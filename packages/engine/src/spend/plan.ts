// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 `buildSpendPlan` (TR-1, TR-3): (Account State, Knowledge Base, Stage, gate) -> SpendPlan. Pure: no
// clock, no I/O, no Toolbox import. The order comes from the Stage's Spend Priority List (FR-4); costs
// are Toolbox numbers and their sums (ADR 0005); words come from the entries, except the few phrases
// that join several entries' purchases into one grouped line (FR-9).
import { type AccountState, humanize } from '@idleon-forge/account-state';
import { type Entry, render, type SourceT, type StageId } from '@idleon-forge/knowledge';
import { classLabel } from '../core/labels';
import { compact } from '../now/format';
import { type Allocation, allocate, chooseWallet, Wallets } from './allocate';
import {
  type Candidate,
  type CandidateContext,
  candidatesOf,
  DUPLICATE_ENTRIES_ROW,
  SINKS_OPEN_AT_LEVEL,
  stampRef,
  unlockFuel,
  vaultRef,
} from './candidates';
import { type ResolvedSpendItem, resolveSpendList, type SpendKnowledge } from './knowledge';
import type { SpendHandoff, SpendLine, SpendPlan, SpendSink, SpendStatus, SpendStep } from './types';

/** FR-15. */
export const VISIBLE_LINES = 5;
/** TR-8: past this the lowest positions drop from the list (never from the allocation). */
export const MAX_LINES = 40;

export const CHECK = {
  duplicateEntries: 'spend.check.duplicate-entries',
  hydrogenHold: 'spend.check.hydrogen-hold',
  stampNotReady: 'spend.check.stamp-not-ready',
} as const;

export interface SpendPlanInput {
  state: AccountState;
  kb: SpendKnowledge;
  stage: StageId;
  /** FR-21's gates from M2's frontier (see `combatGate`). */
  gate: { bullseye: boolean; defence: boolean };
}

const sourceRef = (s: SourceT): SpendLine['sources'][number] => ({
  label: s.title,
  url: s.url,
  tier: s.tier,
  verifiedOn: s.verified,
  gameVersion: s.gameVersion,
});

/** "1.2M" at 2 significant figures, for Report this (FR-19). */
export const twoSf = (n: number) => (n > 0 ? Number(n.toPrecision(2)) : n);

const STATUS_ORDER: Record<SpendStatus, number> = {
  buy: 0,
  'move-coins': 0,
  hold: 1,
  'save-for': 2,
  unpriced: 3,
};

/** FR-4 within a position: priced before unpriced, fresh before Stale, cheapest first, then the item key. */
function rankCandidates(cs: Candidate[]): Candidate[] {
  return [...cs].sort(
    (a, b) =>
      a.item.position - b.item.position ||
      Number(a.unpriced) - Number(b.unpriced) ||
      Number(a.item.stale) - Number(b.item.stale) ||
      a.full.coins - b.full.coins ||
      (a.claim < b.claim ? -1 : a.claim > b.claim ? 1 : 0),
  );
}

const kindOf = (a: Allocation): string => {
  const s = a.fill.steps[0];
  if (a.candidate.sink === 'stamp') return s?.material ? 'raise' : 'coins';
  return a.candidate.sink;
};

interface Group {
  allocations: Allocation[];
}

/** FR-9: same sink and kind, same position, same payer and a buy status form one expandable line. */
function group(allocs: Allocation[]): Group[] {
  const out: Group[] = [];
  for (const a of allocs) {
    const groupable =
      (a.status === 'buy' || a.status === 'move-coins') &&
      a.payer !== null &&
      !a.candidate.item.spend.reserve &&
      a.status === 'buy';
    const prev = out.find(
      (g) =>
        groupable &&
        g.allocations[0]?.status === 'buy' &&
        g.allocations[0]?.payer === a.payer &&
        g.allocations[0]?.candidate.item.position === a.candidate.item.position &&
        kindOf(g.allocations[0] as Allocation) === kindOf(a) &&
        !g.allocations[0]?.candidate.item.spend.reserve,
    );
    if (prev) prev.allocations.push(a);
    else out.push({ allocations: [a] });
  }
  return out;
}

const listNames = (names: string[]) =>
  names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;

export function buildSpendPlan(input: SpendPlanInput): SpendPlan | null {
  const { state, kb, stage } = input;
  const spend = state.account.spend;
  if (!spend) return null;
  const items = resolveSpendList(kb, stage);
  if (!items) return null;
  const handoffs: SpendHandoff[] = [];
  const notCovered = new Set<string>(['forge.upgrades']);
  const world = Number(stage.slice(1, 2)) || 1;
  const ctx: CandidateContext = {
    state,
    spend,
    entries: kb.entries,
    gate: input.gate,
    world,
    handoffs,
    notCovered,
  };
  const unavailable: SpendSink[] = [];
  if (!spend.vault) unavailable.push('vault');
  if (!spend.stamps) unavailable.push('stamp');
  if (!spend.bribes) unavailable.push('bribe');
  if (!spend.statueGold && world >= 2) unavailable.push('statue-gold');
  if (!spend.p2w && world >= 2) unavailable.push('p2w');
  if (!spend.anvilCoinPoints) unavailable.push('anvil');

  // Candidates, in list order; an earlier item claims a purchase before a later sweep can.
  const claimed = new Set<string>();
  const candidates: Candidate[] = [];
  let fuelItem: ResolvedSpendItem | null = null;
  for (const item of items) {
    if (item.spend.target.kind === 'cheapest-until-unlock') {
      fuelItem ??= item;
      continue;
    }
    for (const c of candidatesOf(item, ctx, claimed)) {
      for (const k of c.claim.split(',')) claimed.add(k);
      candidates.push(c);
    }
  }

  // FR-12: while Duplicate Entries is buyable at Lv 0 it is position 1 (its frame item is there already).
  const ranked = rankCandidates(candidates);
  // FR-4: a Contested line is never first.
  const firstFresh = ranked.findIndex((c) => !c.item.contested);
  if (firstFresh > 0) ranked.unshift(...ranked.splice(firstFresh, 1));

  const wallets = new Wallets(spend.wallets);
  const allocations: Allocation[] = [];
  for (const c of ranked) {
    const a = allocate(c, wallets);
    if (a) allocations.push(a);
  }
  // Material steps whose doer isn't Toolbox's best carrier: capacity is the empty-inventory figure.
  const freeUp = new Set<string>();
  // Stamp material steps: the payer carries it when it can, else Toolbox's best carrier (FR-10).
  for (const a of allocations)
    if (a.candidate.raises && a.payer !== null)
      a.fill = {
        ...a.fill,
        steps: a.fill.steps.map((s, i) => {
          const r = a.candidate.raises?.[i];
          if (!s.material || !r) return s;
          const own = r.carriers.find((x) => x.characterIndex === a.payer);
          const best = r.carriers[0]?.characterIndex ?? a.payer;
          const doer = own && own.capacity >= s.material.amount ? a.payer : best;
          if (doer !== best) freeUp.add(s.ref);
          return { ...s, material: { ...s.material, doer: doer as number } };
        }),
      };

  const who = (i: number | null) => {
    const c = i === null ? undefined : state.characters.find((x) => x.index === i);
    return c ? `${classLabel(c)} Lv ${c.level}` : 'any character';
  };
  const lines: SpendLine[] = group(allocations).map((g) => lineOf(g, ctx, kb, who, freeUp));
  // Within a position, buys come before held, save-for and unpriced lines (FR-15).
  lines.sort((a, b) => a.position - b.position || STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  // Keep the guard first once it's there (contested rule aside).

  // FR-13: unlock fuel is the last line.
  let fuel: SpendPlan['unlockFuel'] = null;
  const f = spend.vault ? unlockFuel(spend) : null;
  if (f && fuelItem) {
    const unlocks = humanize(spend.vault?.nextUnlock?.name ?? `Row_${f.index}`);
    fuel = { levels: f.levels, coinsAbout: f.coinsAbout, unlocks };
    lines.push(fuelLine(fuelItem, fuel, wallets, kb, who, Math.max(0, ...lines.map((l) => l.position)) + 1));
  }

  const trimmed = lines.slice(0, MAX_LINES);
  const perCharacter = perCharacterOf(trimmed);
  const buys = trimmed.filter((l) => l.status === 'buy' || l.status === 'move-coins');
  let empty: SpendPlan['empty'] = null;
  if (!trimmed.length)
    empty = { reason: spend.highestClassLevel < SINKS_OPEN_AT_LEVEL ? 'nothing-unlocked' : 'nothing-left' };
  else if (!buys.length) {
    const priced = trimmed.filter((l) => l.coins !== null && l.status !== 'unpriced');
    const cheapest = priced.reduce<SpendLine | undefined>(
      (best, l) => (best === undefined || (l.coins ?? 0) < (best.coins ?? 0) ? l : best),
      undefined,
    );
    empty = cheapest ? { reason: 'nothing-affordable', cheapest } : { reason: 'nothing-affordable' };
  }
  const notCoveredOut = [...notCovered].sort();
  return {
    stage,
    wallets: wallets.planned(),
    lines: trimmed,
    visibleCount: Math.min(VISIBLE_LINES, trimmed.length),
    perCharacter,
    unlockFuel: fuel,
    notCovered: notCoveredOut,
    empty,
    unavailable,
    handoffs,
  };
}

/** FR-16, sorted by total coins, most first (AC-2.4). Anvil steps count for each character that pays one. */
function perCharacterOf(lines: SpendLine[]): SpendPlan['perCharacter'] {
  const by = new Map<number, { lines: number; coins: number }>();
  const add = (i: number, coins: number) => {
    const x = by.get(i) ?? { lines: 0, coins: 0 };
    x.lines += 1;
    x.coins += coins;
    by.set(i, x);
  };
  for (const l of lines) {
    if (l.status !== 'buy' && l.status !== 'move-coins') continue;
    if (l.payer !== null) add(l.payer, l.coins ?? 0);
    else for (const s of l.steps) if (s.payer !== undefined) add(s.payer, s.coins ?? 0);
  }
  return [...by]
    .map(([characterIndex, x]) => ({ characterIndex, ...x }))
    .sort((a, b) => b.coins - a.coins || a.characterIndex - b.characterIndex);
}

function entrySources(
  kb: SpendKnowledge,
  item: ResolvedSpendItem,
  refs: string[],
  extra?: Entry,
): SpendLine['sources'] {
  const seen = new Set<string>();
  const out: SpendLine['sources'] = [];
  const push = (s: SourceT) => {
    const key = `${s.url}|${s.title}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(sourceRef(s));
  };
  // Player-facing Sources first (#74), then the generated Acquisitions' Toolbox provenance (tier 1).
  for (const s of extra?.sources ?? []) push(s);
  for (const s of item.sources) push(s);
  for (const r of refs) for (const s of kb.entries[r]?.sources ?? []) push(s);
  return out.sort((a, b) => (a.tier === 1 ? 1 : 0) - (b.tier === 1 ? 1 : 0));
}

function lineOf(
  g: Group,
  ctx: CandidateContext,
  kb: SpendKnowledge,
  who: (i: number | null) => string,
  freeUp: ReadonlySet<string>,
): SpendLine {
  const first = g.allocations[0] as Allocation;
  const c = first.candidate;
  const item = c.item;
  const steps: SpendStep[] = g.allocations.flatMap((a) => a.fill.steps);
  const priced = first.status !== 'unpriced' && steps.every((s) => s.coins !== null);
  const coins = priced ? steps.reduce((t, s) => t + (s.coins ?? 0), 0) : null;
  const refs = [...new Set(steps.map((s) => s.ref))];
  const payer = first.payer;
  const s0 = steps[0];
  const last = steps.at(-1);
  const slots: Record<string, string | number> = {
    ...c.slots,
    name: c.name,
    // A save-for line names the closest character, the one to save on (FR-22).
    payer: who(payer ?? first.shortfall?.closest ?? null),
    coins: coins ?? 0,
    from: s0?.fromLevel ?? 0,
    to: last?.toLevel ?? 0,
    count: steps.length,
  };
  // A partial fill moves `to`.
  if (g.allocations.length === 1 && first.fill !== c.full) {
    slots.to = first.fill.steps.at(-1)?.toLevel ?? slots.to ?? 0;
    slots.levels = Number(slots.to) - Number(slots.from);
  }
  let template = item.text;
  let why = item.why;
  let extra: Entry | undefined;
  const check = (id: string) => kb.entries[id];
  // FR-12: the Duplicate Entries guard speaks through its Check entry, with the NPC-banked ticket count.
  if (c.sink === 'vault' && s0?.ref === vaultRef(DUPLICATE_ENTRIES_ROW) && check(CHECK.duplicateEntries)) {
    extra = check(CHECK.duplicateEntries);
    slots.tickets = ctx.spend.colosseumTickets?.bankedAtNpcs ?? 0;
    template = extra?.text ?? template;
    why = extra?.why ?? why;
  }
  // FR-11 / D4: the hold notice.
  if (first.status === 'hold' && c.hold && check(CHECK.hydrogenHold)) {
    extra = check(CHECK.hydrogenHold);
    Object.assign(slots, {
      discount: c.hold.discountPct,
      needed: c.hold.neededPct,
      days: c.hold.days,
      // The shared duration format ("about 2d"), never a hand-written "about N days".
      holdIn: c.hold.days * 86_400_000,
      stamp: c.hold.stamp,
    });
    template = extra?.text ?? template;
    why = extra?.why ?? why;
  }
  const values = (extra?.values ?? {}) as Record<string, string | number>;
  const groupText = (coinsText: string, payerText: string) => groupPhrase(g, c, steps, coinsText, payerText);
  const renderWith = (s: Record<string, string | number>) =>
    g.allocations.length > 1
      ? groupText(render('{coins:coins}', s), String(s.payer))
      : render(template, s, values);
  // A held batch names no material step: nothing is to be carried yet.
  const held = first.status === 'hold' ? [] : steps;
  // A step stays short (Design Lab copy rule): the grouped names and the carry steps go in `detail`.
  const names = g.allocations.length > 1 ? listNames(g.allocations.map((a) => a.candidate.name)) : null;
  const detailOf = (rounded: boolean) => {
    const carries = materialsOf(held, ctx, who, freeUp, rounded);
    const parts = [...(names ? [names] : []), ...(carries.length ? [carries.join('; ')] : [])];
    return parts.length ? parts.join(' · ') : null;
  };
  const text = renderWith(slots);
  const detail = detailOf(false);
  const reportDetail = detailOf(true);
  const reportBase = renderWith({ ...slots, coins: twoSf(Number(slots.coins)) });
  const reportText = reportDetail ? `${reportBase} (${reportDetail})` : reportBase;
  const status: SpendStatus = first.status;
  const toLevel = last?.toLevel ?? null;
  return {
    id: `${item.entryId}:${s0?.ref ?? item.ref}:${s0?.fromLevel ?? 'x'}->${toLevel ?? 'x'}`,
    entryId: item.entryId,
    position: item.position,
    status,
    steps,
    coins,
    payer: status === 'unpriced' ? null : payer,
    ...(first.transfer ? { transfer: first.transfer } : {}),
    ...(first.shortfall ? { shortfall: first.shortfall } : {}),
    ...(status === 'hold' && c.hold
      ? { hold: { discountPct: c.hold.discountPct, neededPct: c.hold.neededPct, days: c.hold.days } }
      : {}),
    text,
    detail,
    reportText,
    why: render(why, slots, values),
    sources: entrySources(kb, item, refs, extra),
    confidence: item.confidence,
    contested: item.contested,
    stale: item.stale,
    provenance: {
      fields: [...new Set(g.allocations.flatMap((a) => a.candidate.fields))],
      entries: [
        ...new Set([
          ...g.allocations.map((a) => a.candidate.item.entryId),
          ...(extra ? [extra.id] : []),
          ...refs,
        ]),
      ],
    },
  };
}

/** FR-9's joining phrase for a group: one per sink; the purchases' names go in the line's detail. */
function groupPhrase(g: Group, c: Candidate, steps: SpendStep[], coins: string, payer: string): string {
  const n = g.allocations.length;
  switch (c.sink) {
    case 'vault':
      return `Buy ${n} Vault upgrades on ${payer}: ${coins}`;
    case 'stamp':
      return steps[0]?.material
        ? `Raise and level ${n} capped stamps on ${payer}: about ${coins}`
        : `Level ${n} stamps to their caps on ${payer}: ${coins}`;
    case 'bribe':
      return `Buy ${n} bribes on ${payer}: ${coins}`;
    case 'p2w':
      return `Buy ${n} Pay 2 Win levels on ${payer}: ${coins}`;
    default:
      return `Buy ${n} upgrades on ${payer}: ${coins}`;
  }
}

/** FR-10: "carry N <material> on <class Lv>" for each cap raise in the line. */
function materialsOf(
  steps: SpendStep[],
  ctx: CandidateContext,
  who: (i: number | null) => string,
  freeUp: ReadonlySet<string>,
  rounded = false,
): string[] {
  return steps.flatMap((s) => {
    if (!s.material) return [];
    const stamp = ctx.spend.stamps?.find((x) => stampRef(x.id) === s.ref);
    const item = humanize(stamp?.raise?.materialName ?? s.material.item);
    const amount = compact(rounded ? twoSf(s.material.amount) : s.material.amount);
    const space = freeUp.has(s.ref) ? ', free space first' : '';
    return [`carry ${amount} ${item} on ${who(s.material.doer)}${space}`];
  });
}

function fuelLine(
  item: ResolvedSpendItem,
  fuel: NonNullable<SpendPlan['unlockFuel']>,
  w: Wallets,
  kb: SpendKnowledge,
  who: (i: number | null) => string,
  position: number,
): SpendLine {
  const payer = chooseWallet(w, (i) => w.avail(i) >= fuel.coinsAbout, null);
  let closest: number | null = null;
  for (const i of w.holders()) if (closest === null || w.avail(i) > w.avail(closest)) closest = i;
  if (payer !== null) w.spend(payer, fuel.coinsAbout);
  const slots = {
    levels: fuel.levels,
    unlocks: fuel.unlocks,
    coins: fuel.coinsAbout,
    payer: who(payer ?? closest),
  };
  const ref = item.ref;
  return {
    id: `${item.entryId}:${ref}:fuel->${fuel.levels}`,
    entryId: item.entryId,
    position,
    status: payer === null ? 'save-for' : 'buy',
    steps: [{ sink: 'vault', ref, fromLevel: null, toLevel: null, coins: fuel.coinsAbout }],
    coins: fuel.coinsAbout,
    payer,
    ...(payer === null && closest !== null
      ? { shortfall: { coins: fuel.coinsAbout - w.avail(closest), closest } }
      : {}),
    text: render(item.text, slots),
    detail: null,
    reportText: render(item.text, { ...slots, coins: twoSf(fuel.coinsAbout) }),
    why: render(item.why, slots),
    sources: entrySources(kb, item, [ref]),
    confidence: item.confidence,
    contested: item.contested,
    stale: item.stale,
    provenance: {
      fields: [
        'account.spend.vault.nextUnlock',
        'account.spend.vault.totalLevels',
        'account.spend.vault.rows',
      ],
      entries: [item.entryId, ref],
    },
  };
}

export { stampRef };
