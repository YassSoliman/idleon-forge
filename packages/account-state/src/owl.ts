// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51: Toolbox `account.owl` (`parseOwl`: upgrades, bonuses, feathers, progress, nextLvReq,
// featherRate, restartMulti) plus `accountOptions[253..264]` -> `account.owl`. Called from adapter.ts.
//
// A save from before Orion was added stops short of `accountOptions[264]`; it reads null (no Owl), never a
// fresh Owl. The Bonuses of Orion multiplier is read back off Toolbox's own bonuses (value / base / steps),
// and only while no step is bought does it fall back to the Megafeather part of Toolbox's formula.
import type { OwlBonus, OwlState, OwlUpgrade } from './owl-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Toolbox `owlStats`: the six stats' base per step and cycle offset. */
const STATS: ReadonlyArray<Omit<OwlBonus, 'value'>> = [
  { name: 'Class XP', base: 5, offset: 0, percent: true },
  { name: 'Base DMG', base: 10, offset: 1, percent: false },
  { name: 'Total DMG', base: 2, offset: 2, percent: true },
  { name: 'Skill XP', base: 4, offset: 3, percent: true },
  { name: 'Drop Rate', base: 1, offset: 4, percent: true },
  { name: 'All Stats', base: 2, offset: 5, percent: false },
];

/** Bonuses of Orion steps a stat has at level `level` (Toolbox: ceil((L - offset) / 6), at least 0). */
export const owlSteps = (level: number, offset: number): number =>
  Math.max(0, Math.ceil((level - offset) / 6));

/** Toolbox `getMegaFeather(account, i)`: 1 when that Megafeather is owned (the 10th counts every one past 9). */
const megaFeather = (mf: number, i: number) => (mf > i ? (i === 9 ? mf - 9 : 1) : 0);

class Unreadable extends Error {}

export function readOwl(account: Dict): OwlState | null {
  const opts = list(account.accountOptions);
  if (opts.length <= 264) return null;
  const o = account.owl;
  if (!isDict(o) || !Array.isArray(o.upgrades)) throw new Unreadable();
  const opt = (i: number) => finite(opts[i]) ?? 0;
  const upgrades: OwlUpgrade[] = o.upgrades.map((u, index) => {
    if (!isDict(u) || typeof u.name !== 'string') throw new Unreadable();
    const cost = finite(u.cost);
    const unlockAt = finite(u.x3);
    if (cost === null || unlockAt === null) throw new Unreadable();
    return {
      index,
      name: u.name,
      level: opt(254 + index),
      cost,
      unlockAt,
      unlocked: u.unlocked === true,
    };
  });
  if (upgrades.length !== 9) throw new Unreadable();
  const bonusesLevel = opt(255);
  const raw = list(o.bonuses);
  const bonuses: OwlBonus[] = STATS.map((s) => {
    const b = raw.find((x) => isDict(x) && x.name === s.name);
    return { ...s, value: isDict(b) ? (finite(b.bonus) ?? 0) : 0 };
  });
  const mf = opt(262);
  const stepped = bonuses.find((b) => owlSteps(bonusesLevel, b.offset) > 0);
  const bonusMultiplier = stepped
    ? stepped.value / (stepped.base * owlSteps(bonusesLevel, stepped.offset))
    : 1 +
      (100 * (megaFeather(mf, 1) + megaFeather(mf, 3) + megaFeather(mf, 5) + megaFeather(mf, 7)) +
        100 * Math.min(1, megaFeather(mf, 9)) +
        50 * Math.max(0, megaFeather(mf, 9) - 1)) /
        100;
  const featherRate = finite(o.featherRate);
  if (featherRate === null) throw new Unreadable();
  return {
    feathers: opt(253),
    progress: opt(263),
    featherRate,
    megafeathers: mf,
    restarts: opt(258),
    shiny: opt(264),
    bonusesLevel,
    bonusMultiplier: Number(bonusMultiplier.toPrecision(6)),
    restartMulti: finite(o.restartMulti) ?? 3,
    nextUnlockAt: finite(o.nextLvReq) ?? 0,
    upgrades,
    bonuses,
  };
}
