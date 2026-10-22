// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-58, the Vault plan: every coin the characters hold, spent on the Upgrade Vault, row by row and
// level by level, in one ordered list. Pure and deterministic, like the rest of the Spend Plan.
//
// - Pockets: each character pays from its own coins, because the game takes Vault coins from the
//   character you are playing (dossier C8, `Money_<i>`). The plan starts on the character played last,
//   then the others, richest first. Coins kept in storage (the bank) are withdrawn by the first pocket
//   once its own run out.
// - Order inside a pocket: first the Stage's Spend Priority List Vault items to their targets (M7's list,
//   spend.yaml, in its positions, cheapest target first within one; an open-ended item takes at most its
//   share of the pocket, M7 D6), then the cheapest next level of any
//   open row, one level at a time (the list's unlock fuel, carried on past the next unlock), until the
//   pocket can't pay for one more. Major Discount moves only by its list item, so the prices of rows 0-32
//   change only between list steps, and a step's coins are what the game asks when bought in order.
// - Every price is a Toolbox number (`VaultRow.costs`), rows 0-32 scaled by Toolbox's own Major Discount
//   ratio (`VaultState.discount`). New levels raise the total and open rows by the game's count rule.
import { type AccountState, humanize, type VaultRow, vaultEffectAt } from '@idleon-forge/account-state';
import { DEFAULT_SHARE_CAP, rowOf, vaultTarget } from './candidates';
import type { ResolvedSpendItem } from './knowledge';

/** Rows the plan covers (M7 scope: Vault I and II). */
const ROWS = 62;
const MAJOR_DISCOUNT = 13;

export type VaultPlanPhase = 'list' | 'cheapest';

export interface VaultPlanStep {
  /** Vault row index (`upgrade-vault.acquisition.row-<index>`). */
  index: number;
  /** "Critters 'n Souls". */
  name: string;
  fromLevel: number;
  toLevel: number;
  maxLevel: number;
  /** Toolbox's price of every level from `fromLevel` to `toLevel`, in order. */
  coins: number;
  /** Character index of the pocket that pays: log in on it to buy. */
  payer: number;
  /** 'list': a Spend Priority List target; 'cheapest': the cheapest levels after the list. */
  phase: VaultPlanPhase;
  /** The list item's target level (phase 'list'); null for the cheapest levels. */
  target: number | null;
  /** The row's effect at `fromLevel` and at `toLevel` (Toolbox's description, at today's Mastery). */
  effectFrom: string | null;
  effectTo: string | null;
  /** Both in one line, each changing number as "from → to" ("+14 → 20% Construction SPD"). */
  effectChange: string | null;
  /** The row was locked when the plan started: the total Vault levels that open it. */
  opensAt: number | null;
}

export interface VaultPlanPocket {
  /** Character index. */
  holder: number;
  coins: number;
  /** Withdrawn from storage by this pocket (the first one only). */
  fromBank: number;
  spent: number;
  left: number;
  steps: number;
}

/** A row the plan doesn't buy, with its next price after the plan. */
export interface VaultPlanRow {
  index: number;
  name: string;
  level: number;
  maxLevel: number;
  /** Next level's price after the plan; null when maxed or not priced (out of the coins' reach). */
  nextCoins: number | null;
  effect: string | null;
  /** The total Vault levels that open it; null when open. */
  opensAt: number | null;
}

export interface VaultPlan {
  /** The full ordered list (FR-58): every step, never cut to a top N. */
  steps: VaultPlanStep[];
  pockets: VaultPlanPocket[];
  /** Coins in storage at the start, and what is left there. */
  bank: { coins: number; left: number };
  spent: number;
  /** Coins left in every pocket and the bank after the plan. */
  left: number;
  levels: { before: number; after: number; bought: number };
  /** The next unlock after the plan: its row, threshold and how many levels short. */
  nextUnlock: { index: number; name: string; at: number; levels: number } | null;
  /** Rows the plan opens. */
  opened: { index: number; name: string; at: number }[];
  /** Open rows the plan buys nothing of, cheapest next level first, then the locked ones. */
  waiting: VaultPlanRow[];
  /** Rows at their max. */
  maxed: { index: number; name: string; effect: string | null }[];
}

export interface VaultPlanInput {
  state: AccountState;
  /** The Stage's Spend Priority List, resolved (M7 `resolveSpendList`); only its Vault items are read. */
  items: readonly ResolvedSpendItem[];
  /** FR-21's gates from M2's frontier (see `combatGate`). */
  gate: { bullseye: boolean; defence: boolean };
}

interface Live {
  row: VaultRow;
  /** Levels bought so far (index into `row.costs`). */
  k: number;
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
/** "Mining_Payday$" -> "Mining Payday": Toolbox marks a few row names with a "$" the game doesn't show. */
export const vaultRowName = (raw: string) => humanize(raw).replace(/\$/g, '').trim();

/** A row's effect from `k0` to `k1` more levels in one line: each number that changes as "a → b". */
export function effectChange(
  row: Pick<VaultRow, 'effect' | 'effectAt'>,
  k0: number,
  k1: number,
): string | null {
  const a = row.effectAt[k0];
  const b = row.effectAt[k1];
  if (a === undefined) return null;
  if (b === undefined) return vaultEffectAt(row, k0);
  if (row.effect === '{}') return a === b ? a : `${a} → ${b}`;
  const from = a.split('|');
  const to = b.split('|');
  let i = 0;
  return row.effect.replace(/\{\}/g, () => {
    const x = from[i] ?? '';
    const y = to[i] ?? '';
    i++;
    return x === y ? x : `${x} → ${y}`;
  });
}

export function buildVaultPlan(input: VaultPlanInput): VaultPlan | null {
  const { state } = input;
  const spend = state.account.spend;
  const vault = spend?.vault;
  if (!spend || !vault) return null;

  const rows = new Map<number, Live>();
  for (const row of vault.rows) if (row.index < ROWS) rows.set(row.index, { row, k: 0 });
  let total = vault.totalLevels;
  const thresholds = vault.unlocks.map((u) => u.at);
  const openCount = () => vault.opened + thresholds.filter((at) => at <= total).length;
  let open = openCount();
  const level = (l: Live) => l.row.level + l.k;
  const discount = vault.discount;
  const factor = (index: number) => {
    if (index >= 33 || index === MAJOR_DISCOUNT || !discount) return 1;
    const md = rows.get(MAJOR_DISCOUNT);
    const m = md ? md.k : 0;
    return discount.factors[m] ?? discount.factors.at(-1) ?? 1;
  };
  /** The next level's price now; null when maxed, locked or past the priced levels. */
  const price = (l: Live): number | null => {
    if (level(l) >= l.row.maxLevel || l.row.index >= open) return null;
    const c = l.row.costs[l.k];
    return finite(c) ? c * factor(l.row.index) : null;
  };

  // Pockets: the character played last first, then the others richest first; the bank tops up the first.
  const chars = spend.wallets.filter((w): w is { holder: number; coins: number } => w.holder !== 'bank');
  const bank = spend.wallets.find((w) => w.holder === 'bank')?.coins ?? 0;
  const last = state.lastPlayedCharacterIndex;
  const order = [...chars]
    .filter((w) => w.coins > 0 || w.holder === last)
    .sort(
      (a, b) =>
        Number(b.holder === last) - Number(a.holder === last) || b.coins - a.coins || a.holder - b.holder,
    );
  if (!order.length && bank > 0 && chars[0]) order.push(chars[0]);
  const pockets: VaultPlanPocket[] = order.map((w) => ({
    holder: w.holder,
    coins: w.coins,
    fromBank: 0,
    spent: 0,
    left: w.coins,
    steps: 0,
  }));
  let bankLeft = bank;

  // The list's Vault items, in position order and, within one position, cheapest full target first.
  const listed = input.items
    .filter((it) => it.spend.sink === 'vault' && it.spend.target.kind !== 'cheapest-until-unlock')
    .flatMap((item) => {
      const index = rowOf(item.ref);
      const l = index === null ? undefined : rows.get(index);
      if (!l || index === null) return [];
      // FR-21, as M7 reads it: Bullseye opens on the hit-chance gate, the defence rows on survivability.
      if (
        item.spend.gate === 'spend/combat-row-gate' &&
        !(index === 4 ? input.gate.bullseye : input.gate.defence)
      )
        return [];
      const to = vaultTarget(item, l.row);
      if (to === null) return [];
      let cost = 0;
      for (let j = 0; j < to - l.row.level; j++) cost += l.row.costs[j] ?? Number.POSITIVE_INFINITY;
      return [{ item, index, to, cost }];
    })
    .sort(
      (a, b) =>
        a.item.position - b.item.position ||
        a.cost - b.cost ||
        (a.item.entryId < b.item.entryId ? -1 : a.item.entryId > b.item.entryId ? 1 : 0),
    );

  const steps: VaultPlanStep[] = [];
  const startLocked = new Map<number, number>();
  {
    const sorted = [...thresholds].sort((a, b) => a - b);
    for (const l of rows.values())
      if (l.row.index >= open)
        startLocked.set(l.row.index, sorted[l.row.index - vault.opened] ?? l.row.unlockAt);
  }
  const opened: VaultPlan['opened'] = [];

  for (const pocket of pockets) {
    const avail = () => pocket.left + (pocket === pockets[0] ? bankLeft : 0);
    const pay = (c: number) => {
      const own = Math.min(pocket.left, c);
      pocket.left -= own;
      if (c > own) {
        pocket.fromBank += c - own;
        bankLeft -= c - own;
      }
      pocket.spent += c;
    };
    const buyOne = (l: Live): number | null => {
      const c = price(l);
      if (c === null || c > avail()) return null;
      pay(c);
      l.k++;
      total++;
      const now = openCount();
      if (now > open) {
        for (let i = open; i < now; i++) {
          const r = rows.get(i);
          if (r)
            opened.push({
              index: i,
              name: vaultRowName(r.row.name),
              at: startLocked.get(i) ?? r.row.unlockAt,
            });
        }
        open = now;
      }
      return c;
    };
    const step = (l: Live, from: number, coins: number, phase: VaultPlanPhase, target: number | null) => {
      const k0 = from - l.row.level;
      steps.push({
        index: l.row.index,
        name: vaultRowName(l.row.name),
        fromLevel: from,
        toLevel: level(l),
        maxLevel: l.row.maxLevel,
        coins,
        payer: pocket.holder,
        phase,
        target,
        effectFrom: vaultEffectAt(l.row, k0),
        effectTo: vaultEffectAt(l.row, l.k),
        effectChange: effectChange(l.row, k0, l.k),
        opensAt: startLocked.get(l.row.index) ?? null,
      });
      pocket.steps++;
    };

    // 1. The list's targets, in order. A target this pocket can't finish is bought as far as it pays.
    // 2. Then the cheapest next level of any open row, until this pocket can't pay for one more. A row
    //    the new levels open sends the plan back to 1, since the list may name it.
    for (;;) {
      for (const t of listed) {
        const l = rows.get(t.index) as Live;
        const from = level(l);
        // D6: an open-ended item takes at most its share of this pocket's own coins (bank excluded).
        const cap = t.item.spend.openEnded
          ? (t.item.spend.shareCap ?? DEFAULT_SHARE_CAP) * pocket.coins
          : Number.POSITIVE_INFINITY;
        let coins = 0;
        while (level(l) < t.to) {
          const next = price(l);
          if (next === null || coins + next > cap) break;
          const c = buyOne(l);
          if (c === null) break;
          coins += c;
        }
        if (level(l) > from) step(l, from, coins, 'list', t.to);
      }
      const openBefore = open;
      const more = new Map<number, { from: number; coins: number; order: number }>();
      while (open === openBefore) {
        let best: Live | null = null;
        let bestPrice = Number.POSITIVE_INFINITY;
        for (const l of rows.values()) {
          if (l.row.index === MAJOR_DISCOUNT) continue;
          const c = price(l);
          if (c !== null && c < bestPrice) {
            best = l;
            bestPrice = c;
          }
        }
        if (!best || bestPrice > avail()) break;
        const from = level(best);
        const c = buyOne(best) as number;
        const m = more.get(best.row.index);
        if (m) m.coins += c;
        else more.set(best.row.index, { from, coins: c, order: more.size });
      }
      for (const [index, m] of [...more].sort((a, b) => a[1].order - b[1].order))
        step(rows.get(index) as Live, m.from, m.coins, 'cheapest', null);
      if (open === openBefore) break;
    }
  }

  // One line per row and pocket for the cheapest levels: a row's later chunk joins its first one (its
  // price doesn't depend on the order, as long as no Major Discount level lies between).
  const merged: VaultPlanStep[] = [];
  const firstChunk = new Map<string, VaultPlanStep>();
  for (const s of steps) {
    if (s.index === MAJOR_DISCOUNT) firstChunk.clear();
    const key = `${s.payer}:${s.index}`;
    const into = s.phase === 'cheapest' ? firstChunk.get(key) : undefined;
    if (into && into.toLevel === s.fromLevel) {
      into.toLevel = s.toLevel;
      into.coins += s.coins;
      into.effectTo = s.effectTo;
      const row = rows.get(s.index)?.row;
      if (row) into.effectChange = effectChange(row, into.fromLevel - row.level, s.toLevel - row.level);
      continue;
    }
    if (s.phase === 'cheapest') firstChunk.set(key, s);
    merged.push(s);
  }
  for (const p of pockets) p.steps = merged.filter((s) => s.payer === p.holder).length;

  const waiting: VaultPlanRow[] = [];
  const maxed: VaultPlan['maxed'] = [];
  const bought = new Set(merged.map((s) => s.index));
  for (const l of [...rows.values()].sort((a, b) => a.row.index - b.row.index)) {
    const name = vaultRowName(l.row.name);
    const effect = vaultEffectAt(l.row, l.k);
    if (level(l) >= l.row.maxLevel) {
      maxed.push({ index: l.row.index, name, effect });
      continue;
    }
    if (bought.has(l.row.index)) continue;
    const locked = l.row.index >= open;
    waiting.push({
      index: l.row.index,
      name,
      level: level(l),
      maxLevel: l.row.maxLevel,
      nextCoins: locked ? null : price(l),
      effect,
      opensAt: locked ? (startLocked.get(l.row.index) ?? l.row.unlockAt) : null,
    });
  }
  waiting.sort(
    (a, b) =>
      Number(a.opensAt !== null) - Number(b.opensAt !== null) ||
      (a.opensAt ?? 0) - (b.opensAt ?? 0) ||
      (a.nextCoins ?? Number.POSITIVE_INFINITY) - (b.nextCoins ?? Number.POSITIVE_INFINITY) ||
      a.index - b.index,
  );

  const next = [...vault.unlocks].sort((a, b) => a.at - b.at || a.index - b.index).find((u) => u.at > total);
  const spent = pockets.reduce((s, p) => s + p.spent, 0);
  return {
    steps: merged,
    pockets,
    bank: { coins: bank, left: bankLeft },
    spent,
    left: pockets.reduce((s, p) => s + p.left, 0) + bankLeft,
    levels: { before: vault.totalLevels, after: total, bought: total - vault.totalLevels },
    nextUnlock: next
      ? { index: next.index, name: vaultRowName(next.name), at: next.at, levels: next.at - total }
      : null,
    opened,
    waiting,
    maxed,
  };
}
