// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/Anvil.dc.html): the Anvil page's view, from the adapter's anvil point plan
// (`characters[].afk.anvilPlan`, scored by anvil work with Toolbox `getPlayerAnvil`, ADR 0005) and each
// anvil's products (`characters[].afk.anvil`). Plain arithmetic on those numbers; no rule of its own:
// which character a Whetstone is worth it on is the `anvil.check.respec` Goal's per-character detail.
// Pure and deterministic; characters by class and level only.
import type { AccountState, AfkAnvilPlan, AfkAnvilWindowPlan } from '@idleon-forge/account-state';
import type { EngineResult } from '../result';
import { type WhoToken, whoToken } from './hub-view';
import { ANVIL_WORDS as W } from './words';

/** The "Away for" windows the page offers (a subset of the plan's windows). */
export const ANVIL_PAGE_HOURS = [2, 4, 8, 12] as const;

export interface AnvilRowView {
  index: number;
  who: WhoToken | null;
  /** "Smithing 28 · Thread, Leather Hide". */
  detail: string;
  speed: number;
  capacity: number;
  spare: number;
  /** "62 Speed · 29 Capacity · 221 spare". */
  split: string;
  tone: 'gold' | 'mint' | 'mut';
  /** "Add all 221 to Speed", "Respec to 99 Speed, 0 Capacity", "Fine as it is". */
  todo: string;
  /** "about 2.5 times the work in 8h", "a respec adds about 3%". */
  gain: string;
}

export interface AnvilProductView {
  item: string;
  name: string;
  /** Anvil work one item takes (Toolbox requiredAmount). */
  work: number;
  /** 0..1 against the slowest product. */
  bar: number;
  /** "every character", "Hunter 70 only", "4 characters". */
  who: string;
  /** "fills in 33h" for the first character making it, from empty; null when unknown. */
  fill: string | null;
}

export interface AnvilPageView {
  hours: number;
  rows: AnvilRowView[];
  products: AnvilProductView[];
  /** "Leather Hide takes 12 times the work of Thread: …", or null with one product. */
  why: string | null;
  /** The answer when a character has spare points; null otherwise (the page keeps the engine's). */
  hero: { hero: string; sub: string; points: number } | null;
  /** The Whetstone's per-character order (the respec Goal's detail), "today", "tomorrow", … */
  whetstone: { who: WhoToken | null; when: string }[];
  /** No character holds Exp points (a respec clears them). */
  noExp: boolean;
  /** Per character: what each anvil makes. */
  makes: {
    index: number;
    who: WhoToken | null;
    items: { name: string; amount: number; capacity: number; full: string }[];
  }[];
}

const nameOf = (raw: string) => raw.replace(/_/g, ' ');
const pick = (plan: AfkAnvilPlan, hours: number): AfkAnvilWindowPlan | null => {
  let best: AfkAnvilWindowPlan | null = null;
  for (const w of plan.windows)
    if (
      best === null ||
      Math.abs(w.windowMs / 3_600_000 - hours) < Math.abs(best.windowMs / 3_600_000 - hours)
    )
      best = w;
  return best;
};
const hoursText = (ms: number) => {
  const h = ms / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(ms / 60_000))}m`;
  if (h < 10) {
    const whole = Math.floor(h);
    const m = Math.round((h - whole) * 60);
    return m ? `${whole}h ${m}m` : `${whole}h`;
  }
  return `${Math.round(h)} hours`;
};
const pct = (r: number) => Math.round((r - 1) * 100);
const times = (r: number) => Math.round(r * 10) / 10;

export function buildAnvilPageView(
  state: Pick<AccountState, 'characters'>,
  result: Pick<EngineResult, 'characters' | 'classFamilies' | 'account' | 'asOf'>,
  hours: number,
): AnvilPageView | null {
  const chars = state.characters
    .map((c) => ({ c, plan: c.afk?.anvilPlan ?? null }))
    .filter((x): x is { c: (typeof state.characters)[number]; plan: AfkAnvilPlan } => x.plan !== null);
  if (chars.length === 0) return null;
  const who = (i: number) => whoToken(result as EngineResult, i);
  const label = (i: number) => who(i)?.label ?? W.character(i + 1);
  const respecGoal = result.account.goals.find((g) => g.id === 'anvil.check.respec');
  const respecOn = new Set((respecGoal?.details ?? []).map((d) => d.subject));

  const rows: AnvilRowView[] = chars.map(({ c, plan }) => {
    const w = pick(plan, hours);
    const spare = Math.max(0, plan.unspent);
    const names = plan.products.map((p) => nameOf(p.name)).join(', ');
    const detail = [W.smithing(plan.smithingLevel), names].filter(Boolean).join(' · ');
    const split = W.split(plan.speedPoints, plan.capPoints, spare);
    const base = {
      index: c.index,
      who: who(c.index),
      detail,
      speed: plan.speedPoints,
      capacity: plan.capPoints,
      spare,
      split,
    };
    if (!w) return { ...base, tone: 'mut', todo: W.cantTell, gain: '' };
    const h = Math.round(w.windowMs / 3_600_000);
    if (spare > 0 && w.spend) {
      const toS = w.spend.speed - plan.speedPoints;
      const toC = w.spend.capacity - plan.capPoints;
      const r = w.current.output > 0 ? w.spend.output / w.current.output : 1;
      return {
        ...base,
        tone: 'gold',
        todo: W.add(toS, toC, spare),
        gain: r >= 1.95 ? W.timesWork(times(r), h) : pct(r) >= 1 ? W.moreWork(pct(r), h) : W.free,
      };
    }
    const now = w.spend?.output ?? w.current.output;
    const r = now > 0 ? w.respec.output / now : 1;
    const moves = w.respec.speed !== plan.speedPoints || w.respec.capacity !== plan.capPoints;
    if (respecOn.has(`c${c.index}`) && moves)
      return {
        ...base,
        tone: 'gold',
        todo: W.respec(w.respec.speed, w.respec.capacity),
        gain: W.moreWork(pct(r), h),
      };
    if (moves && pct(r) >= 1)
      return {
        ...base,
        tone: 'mut',
        todo: W.respec(w.respec.speed, w.respec.capacity),
        gain: W.respecAdds(pct(r), h),
      };
    return { ...base, tone: 'mint', todo: W.fine, gain: W.bestSplit(h) };
  });

  // Products: one row per item any anvil makes, slowest last; who makes it; fill time from empty.
  const byItem = new Map<string, { name: string; work: number; makers: number[]; fill: number | null }>();
  for (const { c, plan } of chars)
    for (const p of plan.products) {
      if (!(p.required > 0)) continue;
      const row = byItem.get(p.item) ?? { name: nameOf(p.name), work: p.required, makers: [], fill: null };
      row.makers.push(c.index);
      const own = c.afk?.anvil?.find((a) => a.item === p.item);
      if (row.fill === null && own) row.fill = own.fromEmptyMs;
      byItem.set(p.item, row);
    }
  const items = [...byItem.entries()].sort((a, b) => a[1].work - b[1].work || a[0].localeCompare(b[0]));
  const maxWork = Math.max(1, ...items.map(([, r]) => r.work));
  const products: AnvilProductView[] = items.map(([item, r]) => ({
    item,
    name: r.name,
    work: r.work,
    bar: r.work / maxWork,
    who:
      r.makers.length === chars.length
        ? W.everyCharacter
        : r.makers.length === 1
          ? W.only(label(r.makers[0] ?? 0))
          : W.characters(r.makers.length),
    fill: r.fill !== null ? hoursText(r.fill) : null,
  }));
  const fast = items[0]?.[1];
  const slow = items[items.length - 1]?.[1];
  const why =
    fast && slow && slow.work > fast.work
      ? W.why(slow.name, Math.round(slow.work / fast.work), fast.name)
      : null;

  // The answer: the character with the most spare points (the engine's anvil/points Goal names them).
  const spareRows = rows.filter((r) => r.spare > 0).sort((a, b) => b.spare - a.spare || a.index - b.index);
  const top = spareRows[0];
  let hero: AnvilPageView['hero'] = null;
  if (top) {
    const plan = chars.find((x) => x.c.index === top.index)?.plan;
    const w = plan ? pick(plan, hours) : null;
    const toS = w?.spend ? w.spend.speed - (plan?.speedPoints ?? 0) : top.spare;
    const toC = w?.spend ? w.spend.capacity - (plan?.capPoints ?? 0) : 0;
    const others = spareRows
      .slice(1)
      .map((r) => W.alsoSpare(r.who?.label ?? W.character(r.index + 1), r.spare));
    hero = {
      hero: W.hero(label(top.index), top.spare, toS, toC),
      sub: [top.gain ? `${top.gain.charAt(0).toUpperCase()}${top.gain.slice(1)}.` : null, ...others]
        .filter(Boolean)
        .join(' '),
      points: spareRows.reduce((n, r) => n + r.spare, 0),
    };
  }

  const whetstone = (respecGoal?.details ?? []).map((d, i) => ({
    who: d.subject.startsWith('c') ? who(Number(d.subject.slice(1))) : null,
    when: W.day(i),
  }));

  const makes = chars.map(({ c }) => ({
    index: c.index,
    who: who(c.index),
    items: (c.afk?.anvil ?? []).map((a) => ({
      name: nameOf(a.name),
      amount: a.amount,
      capacity: a.capacity,
      full: a.capAt <= result.asOf ? W.fullNow : W.fullIn(hoursText(a.capAt - result.asOf)),
    })),
  }));

  return {
    hours,
    rows,
    products,
    why,
    hero,
    whetstone,
    noExp: chars.every(({ plan }) => plan.xpPoints === 0),
    makes,
  };
}
