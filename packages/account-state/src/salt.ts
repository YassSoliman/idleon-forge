// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-21b, the salt slice: how much of each salt the account holds (Storage Chest and Refinery
// storage, kept apart) and the Salt Lick. This file owns the salt-held field: Construction, the Salt Lick
// and Refinery pages read `account.salts[].held` / `.inRefinery` and never re-derive it.
//
// The Salt Lick #6 liquid-rate term is the game client's, not Toolbox's (X4, contradictions-1 X2): N.js
// `LiquidHRrate` adds `SaltLick(5)` to every liquid's regen percent group; Toolbox applies Salt Lick #6
// only to Bleach/Dragonic capacity (alchemy.ts#L159-L170) and has no liquid rate at all.
import type { SaltLickState, SaltLickUpgrade } from './gaps-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Salt Lick #6, "+{% Liquid rate and Capacity for all liquids" (`saltLicks[5]`). */
export const SALT_LICK_LIQUID = 5;

/** Each `Refinery<n>` salt held, by rawName: the Storage Chest and Refinery storage apart. */
export function readSaltHeld(account: Dict): Map<string, { held: number; inRefinery: number }> | null {
  const storage = isDict(account.storage) ? account.storage.list : undefined;
  const refinery = isDict(account.refinery) ? account.refinery.refineryStorage : undefined;
  if (!Array.isArray(storage) || !Array.isArray(refinery)) return null;
  const out = new Map<string, { held: number; inRefinery: number }>();
  const add = (items: unknown[], key: 'held' | 'inRefinery') => {
    for (const i of items) {
      if (!isDict(i) || typeof i.rawName !== 'string' || !/^Refinery\d+$/.test(i.rawName)) continue;
      const e = out.get(i.rawName) ?? { held: 0, inRefinery: 0 };
      e[key] += Math.max(0, finite(i.amount) ?? 0);
      out.set(i.rawName, e);
    }
  };
  add(storage, 'held');
  add(refinery, 'inRefinery');
  return out;
}

/** Toolbox `account.saltLick` -> `account.saltLick`; null when the save has no Salt Lick list. */
export function readSaltLick(account: Dict): SaltLickState | null {
  const raw = account.saltLick;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const upgrades: SaltLickUpgrade[] = [];
  for (const [index, s] of raw.entries()) {
    if (!isDict(s)) return null;
    const level = finite(s.level);
    const perLevel = finite(s.baseBonus);
    if (level === null || perLevel === null) return null;
    upgrades.push({
      index,
      salt: typeof s.rawName === 'string' ? s.rawName : '',
      level,
      maxLevel: finite(s.maxLevel) ?? 0,
      unlocked: s.unlocked === true,
      perLevel,
      bonus: perLevel * level,
    });
  }
  const towers = isDict(account.towers) ? list(account.towers.data) : [];
  const building = towers.find((t) => isDict(t) && t.name === 'Salt_Lick');
  const buildingLevel = isDict(building)
    ? (finite(building.level) ?? 0)
    : upgrades.filter((u) => u.unlocked).length;
  return {
    buildingLevel,
    upgrades,
    liquidRatePct: upgrades[SALT_LICK_LIQUID]?.bonus ?? 0,
  };
}
