// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Spend Plan page's view (canvas board SpendPlan), pure: it joins the Now view's worded lines
// (skips and dismissals already applied, in M7's order) to M7's plan for each line's payer and sink,
// and words the pockets from M7's wallets. It orders nothing itself: every list keeps the plan's order,
// except the pockets, largest first, as the board draws them. Class and level only, never a name.
import { formatCoins, type SpendLineView, type SpendPlanView } from '@idleon-forge/engine/now';
import type { ClassFamily, EngineResult, SpendLine } from '@idleon-forge/engine/result';
import { NOT_COVERED_WORDS, SINK_WORDS, SPEND_WORDS as W } from './words';

export interface SpendPageLine {
  key: string;
  n: number;
  text: string;
  /** Up to three short steps ("Carry 12.5k Thread"), from the line's detail. */
  steps: string[];
  /** "Barbarian 74"; null when nobody pays yet (unpriced, save-for without a payer). */
  who: string | null;
  payer: number | null;
  family: ClassFamily | null;
  /** "Stamps", "Upgrade Vault". */
  where: string;
  /** "10M"; null when not priced. */
  cost: string | null;
  priced: boolean;
  /** Under the cost when the line isn't a plain buy ("withdraw 2M from storage first"). */
  status: string | null;
  view: SpendLineView;
}

export interface Pocket {
  index: number;
  who: string;
  coins: number;
  planned: number;
  /** Bar widths in % of the fullest pocket. */
  heldPct: number;
  plannedPct: number;
  note: string;
  spends: boolean;
}

export interface SpendPage {
  buys: number;
  payers: number;
  heroSub: string;
  best: null | { who: string; family: ClassFamily | null; text: string; sub: string };
  top: SpendPageLine[];
  rest: SpendPageLine[];
  lineCount: string;
  pockets: Pocket[];
  bank: string | null;
  unpriced: string[];
  notCovered: string[];
  unavailable: string[];
  skippedKeys: string[];
  empty: string | null;
}

const TOP = 3;
/** "2.9M" (the page says "coins" once, beside it). */
export const coins = (n: number) => formatCoins(n).replace(/\s*coins?$/, '');
/**
 * The line's step without what the page already shows beside it (say it once): its payer
 * ("on Squire Lv 43") and its cost (": about 1.2M coins").
 */
export function stepText(text: string, payer: { classLabel: string; level: number } | null): string {
  let t = text.replace(/:\s*(about\s+)?[\d.,]+[kMBTQ]?\s*coins?\s*$/, '');
  if (payer) t = t.replace(` on ${payer.classLabel} Lv ${payer.level}`, '');
  return t.trim();
}
/** A line's detail as short steps (the Account's "Bring first" split, R11 QA). */
const steps = (detail: string) =>
  detail
    .split(/ · |; /)
    .map((x) => x.trim())
    .filter(Boolean);
const pct = (v: number, max: number) => (max > 0 ? Math.round((1000 * v) / max) / 10 : 0);

/** "a, b and c". */
export const listWords = (xs: readonly string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

export function spendPage(result: EngineResult, view: SpendPlanView | null): SpendPage | null {
  const plan = result.account.spendPlan;
  if (!plan || !view) return null;
  const byId = new Map<string, SpendLine>(plan.lines.map((l) => [l.id, l]));
  const char = (i: number | null) =>
    i === null ? null : (result.characters.find((c) => c.index === i) ?? null);
  const whoOf = (i: number | null) => {
    const c = char(i);
    return c ? `${c.classLabel} ${c.level}` : null;
  };
  const familyOf = (i: number | null) => (i === null ? null : (result.classFamilies?.[i] ?? null));

  const lines: SpendPageLine[] = view.lines.map((v, n) => {
    const l = byId.get(v.id);
    const payer = l?.payer ?? null;
    const sinks = [...new Set((l?.steps ?? []).map((s) => SINK_WORDS[s.sink]))];
    const priced = l?.coins !== null && l?.coins !== undefined;
    const status =
      l?.status === 'move-coins'
        ? W.withdraw(coins(l.transfer?.fromBank ?? 0))
        : l?.status === 'save-for'
          ? W.short(coins(l.shortfall?.coins ?? 0))
          : l?.status === 'hold'
            ? v.statusText
            : null;
    return {
      key: v.key,
      n: n + 1,
      text: stepText(v.text, char(payer)),
      steps: v.detail ? steps(v.detail).slice(0, 3) : [],
      who: whoOf(payer),
      payer,
      family: familyOf(payer),
      where: sinks.join(' · '),
      cost: priced && l ? coins(l.coins as number) : null,
      priced,
      status,
      view: v,
    };
  });

  const buyLines = view.lines
    .map((v) => byId.get(v.id))
    .filter((l): l is SpendLine => !!l && (l.status === 'buy' || l.status === 'move-coins'));
  const perPayer = new Map<number, number>();
  for (const l of buyLines) if (l.payer !== null) perPayer.set(l.payer, (perPayer.get(l.payer) ?? 0) + 1);

  const charWallets = plan.wallets.filter(
    (w): w is { holder: number; coins: number; planned: number } => w.holder !== 'bank',
  );
  const planned = charWallets.reduce((s, w) => s + w.planned, 0);
  const held = charWallets.reduce((s, w) => s + w.coins, 0);
  const max = Math.max(0, ...charWallets.map((w) => w.coins));
  const pockets: Pocket[] = charWallets
    .map((w) => {
      const who = whoOf(w.holder) ?? '';
      const note =
        w.planned > 0
          ? W.pocketOf(coins(w.planned), coins(w.coins))
          : w.coins > 0
            ? W.pocketIdle(coins(w.coins))
            : W.pocketEmpty;
      return {
        index: w.holder,
        who,
        coins: w.coins,
        planned: w.planned,
        heldPct: pct(w.coins, max),
        plannedPct: pct(Math.min(w.planned, w.coins), max),
        note,
        spends: w.planned > 0,
      };
    })
    .sort((a, b) => b.coins - a.coins || a.index - b.index);
  const bank = plan.wallets.find((w) => w.holder === 'bank');

  // The payer with the most buys on the list: log into it first.
  let best: SpendPage['best'] = null;
  const top = [...perPayer.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top) {
    const [index, count] = top;
    const first = lines.find((l) => l.payer === index && l.priced);
    const who = whoOf(index) ?? '';
    best = {
      who,
      family: familyOf(index),
      text: W.bestFirst(who, count, buyLines.length),
      sub: first ? [first.text, first.cost ? `${first.cost} coins` : null].filter(Boolean).join(' · ') : '',
    };
  }

  const unpricedLines = lines.filter((l) => !l.priced);
  return {
    buys: buyLines.length,
    payers: perPayer.size,
    heroSub: buyLines.length > 0 ? W.heroSub(perPayer.size, coins(planned), coins(held)) : W.heroSubNone,
    best,
    top: lines.slice(0, TOP),
    rest: lines.slice(TOP),
    lineCount: W.orderCount(lines.length, lines.length - unpricedLines.length, unpricedLines.length),
    pockets,
    bank: bank && bank.coins > 0 ? coins(bank.coins) : null,
    unpriced: unpricedLines.map((l) => l.text),
    notCovered: plan.notCovered.flatMap((id) => (NOT_COVERED_WORDS[id] ? [NOT_COVERED_WORDS[id]] : [])),
    unavailable: view.unavailable,
    skippedKeys: view.skippedKeys,
    empty: lines.length === 0 ? view.summary || W.empty : null,
  };
}
