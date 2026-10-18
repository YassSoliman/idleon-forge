// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F2 the Bubble Plan (docs/specs/M19-alchemy.md FR-1 to FR-4, D-2, D-5): walk the plan rows in order
// for the account's band, hand out affordable levels one at a time while the chest and the liquids cover
// every material's undiscounted cost (Toolbox's own cost function, an upper bound), deducting as it goes so
// two rows never count the same Spore Cap or Water twice. Pure: the cost function is passed in.
import type { AccountState, CauldronId } from '@idleon-forge/account-state';
import { STAGES, type StageId } from '@idleon-forge/knowledge';
import { BAND_INDEX, CAULDRON_CLASS, type CurveRow, LIQUID_NAMES, type PlanRow, titleName } from './kb';
import type { Band, BubblePick } from './types';

export type BubbleCost = (rawName: string, bubbleIndex: number, level: number, baseCost: number) => number;

/** `Liquid1` -> 0; null for an item. */
export const liquidIndex = (rawName: string): number | null => {
  const m = /^Liquid([1-4])$/.exec(rawName);
  return m ? Number(m[1]) - 1 : null;
};

/** The material's player name: "Water", "Copper Ore". */
export const materialName = (m: { rawName: string; name: string }): string => {
  const l = liquidIndex(m.rawName);
  return l === null ? titleName(m.name) : (LIQUID_NAMES[l] as string);
};

/** What the chest and the liquids hold, consumed in plan order (FR-3). */
export class Budget {
  private readonly left = new Map<string, number>();
  constructor(storage: Readonly<Record<string, number>>, liquids: readonly number[]) {
    for (const [k, n] of Object.entries(storage)) this.left.set(k, n);
    for (const [i, n] of liquids.entries()) this.left.set(`Liquid${i + 1}`, n);
  }
  has(rawName: string): number {
    return this.left.get(rawName) ?? 0;
  }
  take(rawName: string, n: number) {
    this.left.set(rawName, this.has(rawName) - n);
  }
}

export interface PlanInput {
  state: AccountState;
  stage: StageId;
  band: Band;
  rows: readonly PlanRow[];
  curves: ReadonlyMap<string, CurveRow>;
  cost: BubbleCost;
  /** The class tree's `isA` (M2): "Barbarian" is a "Warrior". */
  isA: (cls: string, ancestor: string) => boolean;
}

export interface PlanEntry extends BubblePick {
  row: number;
  unlocked: boolean;
  /** Liquid spent by the levels handed out, per liquid index (D-7's reserve). */
  liquidSpent: number[];
  /** Materials of the levels handed out, by player name ("Copper Ore", "Water"). */
  held: string[];
}

export interface PlanResult {
  /** Every eligible row bubble below its band, in plan order (unlocked or not). */
  entries: PlanEntry[];
  /** FR-28: some unlocked eligible row is still below its W2 band level. */
  belowW2Band: boolean;
  /** Every eligible bubble is at its band. */
  met: boolean;
}

/** FR-3 / FR-4 on one account. null when a cost can't be computed (fail closed, FR-26). */
export function runPlan(input: PlanInput): PlanResult | null {
  const { state, stage, band, rows, curves, cost, isA } = input;
  const alch = state.account.alchemy;
  const plan = state.account.alchemyPlan;
  const liquids = state.account.liquids;
  const storage = state.account.storageItems;
  if (!alch || !plan || !liquids || !storage) return null;
  const at = STAGES.indexOf(stage);
  const unlockedIn = new Map<CauldronId, number>(alch.cauldrons.map((c) => [c.id, c.unlockedBubbles]));
  const budget = new Budget(
    storage,
    [0, 1, 2, 3].map((i) => liquids.find((l) => l.index === i)?.current ?? 0),
  );
  const chars = state.characters;
  const eligible = (row: PlanRow, b: PlanRow['bubbles'][number], curve: CurveRow): boolean => {
    if (row.from && at < STAGES.indexOf(row.from)) return false;
    switch (row.when) {
      case 'always':
        return true;
      case 'class': {
        const line = CAULDRON_CLASS[curve.cauldron];
        return line !== undefined && chars.some((c) => isA(c.class, line));
      }
      case 'skill':
        return b.skill !== null && chars.some((c) => c.afkType === b.skill);
      case 'equipped':
        return chars.some((c) => c.bigBubbles?.includes(b.rawName) === true);
    }
  };
  const entries: PlanEntry[] = [];
  let belowW2Band = false;
  let met = true;
  const seen = new Set<string>();
  for (const row of rows) {
    for (const b of row.bubbles) {
      if (seen.has(b.rawName)) continue;
      const curve = curves.get(b.rawName);
      const level = curve ? plan.bubbleLevels[curve.cauldron]?.[curve.index] : undefined;
      if (!curve?.bands || level === undefined || !eligible(row, b, curve)) continue;
      seen.add(b.rawName);
      const unlocked = curve.index < (unlockedIn.get(curve.cauldron) ?? 0);
      if (unlocked && level < curve.bands[0]) belowW2Band = true;
      const target = curve.bands[BAND_INDEX[band]];
      if (level >= target) continue;
      met = false;
      const liquidSpent = [0, 0, 0, 0];
      let to = level;
      let blocked: BubblePick['blocked'] = null;
      if (unlocked) {
        while (to < target) {
          const prices = curve.materials.map((m) => ({ m, n: cost(m.rawName, curve.index, to, m.baseCost) }));
          if (prices.some((p) => !Number.isFinite(p.n) || p.n < 0)) return null;
          const short = prices.find((p) => budget.has(p.m.rawName) < p.n);
          if (short) {
            if (to === level) {
              const liquid = liquidIndex(short.m.rawName) !== null;
              blocked = {
                rawName: short.m.rawName,
                name: materialName(short.m),
                more: Math.ceil(short.n - Math.max(0, budget.has(short.m.rawName))),
                liquid,
              };
            }
            break;
          }
          for (const p of prices) {
            budget.take(p.m.rawName, p.n);
            const l = liquidIndex(p.m.rawName);
            if (l !== null) liquidSpent[l] = (liquidSpent[l] ?? 0) + p.n;
          }
          to++;
        }
      }
      entries.push({
        row: row.n,
        cauldron: curve.cauldron,
        rawName: b.rawName,
        name: titleName(curve.name),
        from: level,
        to: to > level ? to : target,
        atLeast: to - level,
        band: target,
        blocked: unlocked ? blocked : null,
        actionKey: null,
        unlocked,
        liquidSpent,
        held: curve.materials.map(materialName),
      });
    }
  }
  return { entries, belowW2Band, met };
}

/** FR-4: the first row bubble that got a level. */
export const accountPick = (r: PlanResult): PlanEntry | null => r.entries.find((e) => e.atLeast > 0) ?? null;
/** FR-4 / FR-6: the first unlocked row bubble that got none. */
export const firstBlocked = (r: PlanResult): PlanEntry | null =>
  r.entries.find((e) => e.unlocked && e.atLeast === 0 && e.blocked !== null) ?? null;
