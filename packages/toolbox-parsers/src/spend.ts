// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan (TR-1, TR-4): the worker-side Toolbox re-runs the Spend Plan needs, all on Toolbox's own
// exported functions (ADR 0005: Toolbox numbers, our arithmetic only).
//  - Vault cost ladders: re-run `parseUpgradeVault` on cloned levels and read each row's next-level
//    `cost` at L, L+1, ... (the clone trick of #16). Pass A moves every row but Major Discount (13), Pass B
//    moves row 13 alone, because row 13's level changes the price of rows 0-32.
//  - Stamps: re-run `updateStamps` with the account's real Gilded Stamp state and `withMinReduction`,
//    because the parse prices every cap raise at the Gilded rate (`gildedStamp` defaults to true).
// Runs only in the parse worker (ADR 0006), inside the parse's frozen clock.
import { upgradeVault } from '@website-data';
import { liveEntries } from '../vendor/parsers/catalog';
import { parseUpgradeVault } from '../vendor/parsers/misc/upgradeVault';
import { getGoldCostToMaxLevel, updateStamps } from '../vendor/parsers/world-1/stamps';
import type { ParsedSave, StampEvaluation, VaultCostRun } from './types';

/** TR-4: the ladder depth; a ladder sums per-level costs up to +25 levels. */
export const LADDER_DEPTH = 25;
const MAJOR_DISCOUNT = 13;

// biome-ignore lint/suspicious/noExplicitAny: Toolbox's own account and character types are untyped.
type Any = any;

/** The row index of each entry of Toolbox's `upgrades` array (placeholders are skipped by liveEntries). */
const rowIndices = (): number[] => liveEntries<Any>(upgradeVault as Any[]).map(({ index }) => index);

/**
 * `parseUpgradeVault` prices "cost to max" by `structuredClone`-ing the whole row list once per row, and
 * the bundle's core-js `structuredClone` polyfill makes that the bulk of a re-parse (~12 ms each). Its
 * only use of the clone is to set one row's `level` on a copy, so while the ladders run, an array of
 * plain rows is copied row by row instead. Same values, and the global is restored even on a throw.
 */
function withRowCopyClone<T>(f: () => T): T {
  const g = globalThis as { structuredClone: (v: unknown) => unknown };
  const real = g.structuredClone;
  g.structuredClone = (v: unknown) =>
    Array.isArray(v) && v.every((x) => x !== null && typeof x === 'object' && !Array.isArray(x))
      ? v.map((x) => ({ ...x }))
      : real(v);
  try {
    return f();
  } finally {
    g.structuredClone = real;
  }
}

/**
 * Per-level Vault costs: `costs[j]` is Toolbox's `cost` of the row at level L + j, for j = 0 .. depth - 1.
 * `costs[0]` equals the parse's own `cost`. Levels are the raw `UpgVault` array (indices are row indices).
 */
export function vaultLadders(
  parsed: ParsedSave,
  rawLevels: readonly number[],
  depth = LADDER_DEPTH,
): VaultCostRun[] {
  return withRowCopyClone(() => ladders(parsed, rawLevels, depth));
}

function ladders(parsed: ParsedSave, rawLevels: readonly number[], depth: number): VaultCostRun[] {
  const account = parsed.account as Any;
  const characters = parsed.characters as Any[];
  const indices = rowIndices();
  const levelOf = (i: number) => Number(rawLevels[i] ?? 0) || 0;
  const len = Math.max(rawLevels.length, (indices.at(-1) ?? 0) + 1);
  const base = parseUpgradeVault(
    Array.from({ length: len }, (_, i) => levelOf(i)),
    account,
    characters,
  ).upgrades as Any[];
  const maxOf = new Map(indices.map((row, k) => [row, Number(base[k]?.maxLevel) || 0]));
  const total = indices.reduce((s, row) => s + levelOf(row), 0);
  const open = indices.filter((row) => Number(base[indices.indexOf(row)]?.unlockLevel) <= total).length;
  // Rows that need a ladder: not maxed, and unlocked by Toolbox's flag or the game's count rule.
  const wanted = new Set(
    indices.filter(
      (row, k) => levelOf(row) < (maxOf.get(row) ?? 0) && (base[k]?.unlocked === true || row < open),
    ),
  );
  const out = new Map<number, number[]>(indices.map((row, k) => [row, [Number(base[k]?.cost)]]));
  // A row parked at its max level costs Toolbox nothing to price (its cost-to-max loop is empty), so
  // every row a pass doesn't read is parked there. Only the rows read keep their real cost.
  const parked = (row: number) => maxOf.get(row) ?? levelOf(row);
  for (let j = 1; j < depth; j++) {
    const live = [...wanted].filter((row) => levelOf(row) + j < (maxOf.get(row) ?? 0));
    if (!live.length) break;
    // Pass A: every live row but 13 at L + j, row 13 held at L. Pass B: row 13 alone at L + j.
    const a = Array.from({ length: len }, (_, i) =>
      i === MAJOR_DISCOUNT ? levelOf(i) : live.includes(i) ? levelOf(i) + j : parked(i),
    );
    const ra = parseUpgradeVault(a, account, characters).upgrades as Any[];
    let rb: Any[] | null = null;
    if (live.includes(MAJOR_DISCOUNT)) {
      const b = Array.from({ length: len }, (_, i) => (i === MAJOR_DISCOUNT ? levelOf(i) + j : parked(i)));
      rb = parseUpgradeVault(b, account, characters).upgrades as Any[];
    }
    indices.forEach((row, k) => {
      if (!live.includes(row)) return;
      out.get(row)?.push(Number((row === MAJOR_DISCOUNT ? rb : ra)?.[k]?.cost));
    });
  }
  return indices.map((index) => ({ index, costs: out.get(index) ?? [] }));
}

/** One stamp as the worker re-evaluation sees it, flattened to the fields M7 reads. */
const toEvaluation = (s: Any, account: Any): StampEvaluation => ({
  rawName: String(s?.rawName ?? ''),
  name: String(s?.displayName ?? s?.rawName ?? ''),
  level: Number(s?.level) || 0,
  maxLevel: Number(s?.maxLevel) || 0,
  capStep: Number(s?.reqItemMultiplicationLevel) || 0,
  goldCost: Number(s?.goldCost),
  coinsToCap: Number(getGoldCostToMaxLevel(s, account)),
  material: String(s?.itemReq?.rawName ?? ''),
  materialName: String(s?.itemReq?.name ?? s?.itemReq?.rawName ?? ''),
  equip: Array.isArray(s?.materials) && s.materials.length > 0,
  materialCost: Number(s?.materialCost),
  ownedMats: Number(s?.ownedMats) || 0,
  hasMaterials: s?.hasMaterials === true,
  enoughPlayerStorage: s?.enoughPlayerStorage === true,
  minReduction: typeof s?.minReduction?.reduction === 'number' ? s.minReduction.reduction : null,
  topCharacters: ((s?.bestCharacter?.topCharacters ?? []) as Any[]).map((t) => ({
    character: String(t?.character ?? ''),
    maxCapacity: Number(t?.maxCapacity) || 0,
  })),
  next: s?.futureCosts?.[0]
    ? {
        level: Number(s.futureCosts[0].level),
        goldCost: Number(s.futureCosts[0].goldCost),
        reduction: Number(s.futureCosts[0].reduction),
      }
    : null,
});

/**
 * TR-4: every stamp re-evaluated by Toolbox's `updateStamps` with `gildedStamp` as given (the account's
 * real Gilded Stamp state), `forcedStampReducer` (undefined: the account's discount; 0: no discount)
 * and `withMinReduction = true`.
 */
export function stampEvaluations(parsed: ParsedSave, gilded: boolean, reducer?: number): StampEvaluation[] {
  const account = parsed.account as Any;
  const grouped = updateStamps(account, parsed.characters, gilded, reducer, undefined, true) as Record<
    string,
    Any[]
  >;
  return Object.values(grouped)
    .flat()
    .map((s) => toEvaluation(s, account));
}
