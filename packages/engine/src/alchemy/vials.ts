// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F3 vials (docs/specs/M19-alchemy.md FR-9 to FR-11, D-6, D-7): the next vial levels the chest and
// the liquid left after the bubble pick can pay for, and today's easiest rolls; M24: every locked vial
// split into the ones you can try and the ones missing their item. Pure.
import type { AccountState } from '@idleon-forge/account-state';
import { STAGES, type StageId } from '@idleon-forge/knowledge';
import { holdingsOf } from '../walkthrough/holdings';
import { BREW_STAT, LIQUID_NAMES, titleName, type VialPlanRow, type VialRow } from './kb';
import type { Band, VialHolding, VialMissing, VialTry } from './types';

export interface VialLevel {
  index: number;
  name: string;
  from: number;
  to: number;
  items: number;
  itemName: string;
  liquidCost: number;
  liquidName: string;
}

const CAULDRON_SLOT = { power: 0, quicc: 1, 'high-iq': 2, kazam: 3 } as const;

export interface VialInput {
  state: AccountState;
  stage: StageId;
  band: Band;
  rows: readonly VialPlanRow[];
  catalogue: readonly VialRow[];
  /** `alchemy-vials.fact.costs` items[L]: the item cost from level L to L+1. */
  itemCosts: readonly number[];
  liquidPerLevel: number;
  /** Liquid left per liquid index after the bubble pick's reserve (D-7). */
  liquidLeft: number[];
  isA: (cls: string, ancestor: string) => boolean;
}

/** FR-10: the affordable next levels in plan order; the first is the vial Goal, the rest its details. */
export function vialLevels(x: VialInput): VialLevel[] {
  const plan = x.state.account.alchemyPlan;
  const storage = x.state.account.storageItems;
  if (!plan || !storage) return [];
  const at = STAGES.indexOf(x.stage);
  const left = [...x.liquidLeft];
  const items = new Map(Object.entries(storage));
  const cat = new Map(x.catalogue.map((v) => [v.index, v]));
  const levelOf = (i: number) => plan.vialLevels[i];
  const seats = x.state.characters.map((c) => c.slots?.cauldron ?? null);
  const nitrogen = x.state.account.liquids?.find((l) => l.index === 1)?.unlocked === true;
  const shaman = x.state.characters.some((c) => x.isA(c.class, 'Shaman'));
  const out: VialLevel[] = [];
  const listed = new Set<number>();
  for (const row of x.rows) for (const i of row.vials === 'rest' ? [] : row.vials) listed.add(i);
  for (const row of x.rows) {
    if (row.from && at < STAGES.indexOf(row.from)) continue;
    if (row.when === 'nitrogen' && !nitrogen) continue;
    if (row.when === 'shaman' && !shaman) continue;
    const target = x.band === 'w2' ? row.targets[0] : row.targets[1];
    const list =
      row.vials === 'rest' ? x.catalogue.map((v) => v.index).filter((i) => !listed.has(i)) : row.vials;
    for (const i of list) {
      const level = levelOf(i);
      const c = cat.get(i);
      if (level === undefined || !c || level < 1 || level >= target || level >= 13) continue;
      if (row.when === 'brewer') {
        const cauldron = BREW_STAT[c.stat];
        if (!cauldron || !seats.includes(CAULDRON_SLOT[cauldron])) continue;
      }
      const cost = x.itemCosts[level];
      const liquidCost = x.liquidPerLevel * level;
      const l = c.liquid - 1;
      const held = items.get(c.item) ?? 0;
      // Toolbox's vial alert: more than the item cost in the chest, more liquid than the liquid cost.
      if (cost === undefined || !(held > cost) || !((left[l] ?? 0) > liquidCost)) continue;
      items.set(c.item, held - cost);
      left[l] = (left[l] ?? 0) - liquidCost;
      out.push({
        index: i,
        name: titleName(c.name),
        from: level,
        to: level + 1,
        items: cost,
        itemName: titleName(c.itemName),
        liquidCost,
        liquidName: LIQUID_NAMES[l] as string,
      });
    }
  }
  return out;
}

/**
 * M24 (FR-11 without the top-three cap): every locked vial, split into those whose item the account
 * holds outside the Refinery and the Forge (the ones a try can use, easiest roll first) and those still
 * missing their item (easiest roll first). Holdings are M14's (`holdingsOf`). Null without the plan.
 */
export function vialTries(
  state: AccountState,
  catalogue: readonly VialRow[],
): { tryable: VialTry[]; missing: VialMissing[] } | null {
  const plan = state.account.alchemyPlan;
  if (!plan) return null;
  const tryable: VialTry[] = [];
  const missing: VialMissing[] = [];
  const locked = catalogue
    .filter((v) => plan.vialLevels[v.index] === 0)
    .sort((a, b) => a.score - b.score || a.index - b.index);
  for (const v of locked) {
    const base = {
      index: v.index,
      name: titleName(v.name),
      rollNeeded: v.score,
      item: titleName(v.itemName),
    };
    const h = holdingsOf(state, v.item);
    const places: VialHolding[] = [];
    let refinery = 0;
    let forge = 0;
    for (const x of h) {
      if (x.place === 'refinery') refinery += x.amount;
      else if (x.place === 'forge') forge += x.amount;
      else if (x.place === 'storage') places.push({ place: 'storage', amount: x.amount });
      else places.push({ place: 'bag', index: Number(x.place.slice(5)), amount: x.amount });
    }
    const held = places.reduce((n, p) => n + p.amount, 0);
    if (held <= 0) {
      missing.push(base);
      continue;
    }
    places.sort(
      (a, b) => b.amount - a.amount || (a.place === 'storage' ? -1 : b.place === 'storage' ? 1 : 0),
    );
    tryable.push({ ...base, held, places, elsewhere: { refinery, forge } });
  }
  return { tryable, missing };
}

/** FR-11: up to `max` locked vials whose item is held outside the Refinery and the Forge, easiest first. */
export function rollTargets(
  state: AccountState,
  catalogue: readonly VialRow[],
  max: number,
): { index: number; name: string; rollNeeded: number; item: string }[] {
  return (vialTries(state, catalogue)?.tryable ?? [])
    .slice(0, max)
    .map(({ index, name, rollNeeded, item }) => ({ index, name, rollNeeded, item }));
}
