// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: Toolbox `kangaroo` -> `account.poppy` (poppy-types.ts). Toolbox's numbers only (ADR 0005):
// costs, rates and multipliers come from `parsers/world-2/kangaroo.ts`; the counters it doesn't expose
// (resets done, Megafish, shiny catches) are the `accountOptions` indices that parser itself reads.
import type { PoppyState, PoppyTarUpgrade, PoppyUpgrade } from './poppy-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown): number => finite(v) ?? 0;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const nameOf = (v: unknown, fallback: string) =>
  (typeof v === 'string' && v !== '' ? v : fallback).replace(/_/g, ' ');

/** The `accountOptions` indices Poppy reads, each named where kangaroo.ts reads it at the pin. */
export const POPPY_OLA = {
  /** kangaroo.ts parseKangaroo: Fisheroo Reset level, the resets done (`totalResets`). */
  RESETS: 274,
  /** kangaroo.ts getMegaFish: Megafish caught. */
  MEGAFISH: 279,
  /** kangaroo.ts getShinyMulti: the six shiny fish counts. */
  SHINY: [281, 282, 283, 284, 285, 286] as const,
} as const;

/** "90.64x_bluefin_fish_caught" -> 90.64. */
const leadingNumber = (s: unknown): number => {
  const m = typeof s === 'string' ? /^([\d.]+)/.exec(s) : null;
  return m ? num(m[1]) : 1;
};

export function readPoppy(account: Dict): PoppyState | null {
  const k = account.kangaroo;
  if (!isDict(k)) return null;
  const o = list(account.accountOptions);
  const upgrades: PoppyUpgrade[] = list(k.upgrades).map((u, index) => {
    const d = isDict(u) ? u : {};
    return {
      index,
      name: nameOf(d.name, `Upgrade ${index + 1}`),
      level: num(d.level),
      cost: num(d.cost),
      unlocked: d.unlocked === true,
      opensAt: num(d.x3),
    };
  });
  const unlocked = num(k.totalFish) > 0 || upgrades.some((u) => u.level > 0);
  const tarUpgrades: PoppyTarUpgrade[] = list(k.tarUpgrades).map((u, index) => {
    const d = isDict(u) ? u : {};
    return {
      index,
      name: nameOf(d.name, `Tar upgrade ${index + 1}`),
      level: num(d.level),
      cost: num(d.cost),
      unlocked: d.unlocked === true,
    };
  });
  const multis = list(k.allMultipliers);
  return {
    unlocked,
    pendingFish: num(k.pendingFish),
    fish: num(k.fish),
    totalFish: num(k.totalFish),
    fishPerMinute: num(k.fishRate),
    progress: num(k.progress),
    fisherooResets: num(o[POPPY_OLA.RESETS]),
    megafish: num(o[POPPY_OLA.MEGAFISH]),
    upgrades,
    spirals: list(k.resetBonuses).map((r) => ({
      level: isDict(r) ? num(r.level) : 0,
      multi: isDict(r) ? leadingNumber(r.desc) : 1,
    })),
    tar: { fish: num(k.totalTarFishOwned), upgrades: tarUpgrades },
    shiny: POPPY_OLA.SHINY.map((at, i) => {
      const m = multis[i];
      return { caught: num(o[at]), multi: isDict(m) ? (finite(m.multi) ?? 1) : 1 };
    }),
    bonuses: list(k.bonuses)
      .filter((b) => isDict(b) && b.name !== 'Fish/minute')
      .map((b) => {
        const d = b as Dict;
        return { name: nameOf(d.name, ''), value: num(d.bonus), percent: d.percentage === true };
      }),
  };
}
