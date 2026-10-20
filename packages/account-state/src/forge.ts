// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-25, the Forge: Toolbox `account.forge` (parseForge: 16 slot rows, the six upgrades, ore
// capacity) plus the ores and barrels held in the Storage Chest and every bag -> `account.forge`.
//
// Toolbox parses all 16 slot rows whatever the New Forge Slot level, and its own empty-slots alert
// counts them all (dossier M21); a slot is usable only below that level (`upgrades[0].level`), so the
// `unlocked` flag here is what every Check counts. A slot whose ore is under one bar's worth is empty:
// the leftover never smelts (M2).
import type { ForgeBarrel, ForgeItem, ForgeOre, ForgeSlot, ForgeState } from './gaps-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const named = (v: unknown): v is Dict & { rawName: string } =>
  isDict(v) && typeof v.rawName === 'string' && v.rawName !== 'Blank';

const item = (i: Dict & { rawName: string }): ForgeItem => ({
  rawName: i.rawName,
  name: typeof i.name === 'string' ? i.name : i.rawName,
  amount: Math.max(0, finite(i.amount) ?? 0),
});

const ore = (i: Dict & { rawName: string }): ForgeOre => ({
  ...item(i),
  perBar: Math.max(1, finite(i.Amount) ?? 1),
  baseSeconds: finite(i.Cooldown) ?? 0,
});

/** OilBarrel items: `SpeedForge` (+% speed) or `DoubleBarsForge` (% chance of an extra bar), items.json. */
const barrel = (i: Dict & { rawName: string }): ForgeBarrel => ({
  ...item(i),
  effect: i.Effect === 'DoubleBarsForge' ? 'double' : 'speed',
  power: finite(i.Amount) ?? 0,
});

/** Every ore (typeGen bOre) or barrel (cOil) held in storage and bags, summed by rawName. */
function held<T extends ForgeItem>(
  account: Dict,
  characters: readonly unknown[],
  typeGen: string,
  make: (i: Dict & { rawName: string }) => T,
): T[] {
  const bags = characters.flatMap((c) => (isDict(c) ? list(c.inventory) : []));
  const storage = isDict(account.storage) ? list(account.storage.list) : [];
  const out = new Map<string, T>();
  for (const i of [...storage, ...bags]) {
    if (!named(i) || i.typeGen !== typeGen) continue;
    const e = out.get(i.rawName);
    const x = make(i);
    if (e) e.amount += x.amount;
    else out.set(i.rawName, x);
  }
  return [...out.values()].filter((x) => x.amount > 0);
}

export function readForge(account: Dict, characters: readonly unknown[]): ForgeState | null {
  const f = account.forge;
  if (!isDict(f) || !Array.isArray(f.list) || !Array.isArray(f.upgrades)) return null;
  const upgrades = f.upgrades.map((u) => ({
    name: isDict(u) && typeof u.name === 'string' ? u.name : '',
    level: isDict(u) ? (finite(u.level) ?? 0) : 0,
    maxLevel: isDict(u) ? (finite(u.maxLevel) ?? 0) : 0,
  }));
  const slotsUnlocked = Math.min(f.list.length, upgrades[0]?.level ?? 0);
  const slots: ForgeSlot[] = f.list.map((s, index) => {
    const r = isDict(s) ? s : {};
    const o = named(r.ore) ? ore(r.ore) : null;
    const loaded = o !== null && o.amount >= o.perBar;
    return {
      index,
      unlocked: index < slotsUnlocked,
      brimstone: r.isBrimestone === true,
      ore: o,
      smelting: loaded,
      emptyInSeconds: loaded && isDict(r.ore) ? Math.max(0, (finite(r.ore.timeTillEmpty) ?? 0) / 1000) : 0,
      bar: named(r.bar) && (finite(r.bar.amount) ?? 0) > 0 ? item(r.bar) : null,
      barrel: named(r.barrel) && (finite(r.barrel.amount) ?? 0) > 0 ? barrel(r.barrel) : null,
      speed: finite(r.speed) ?? 0,
    };
  });
  const cap = isDict(f.oreCapacity) ? finite(f.oreCapacity.value) : null;
  return {
    slotsUnlocked,
    slots,
    upgrades,
    oreCapacity: cap === null ? 0 : Math.floor(cap),
    oresHeld: held(account, characters, 'bOre', ore),
    barrelsHeld: held(account, characters, 'cOil', barrel),
  };
}
