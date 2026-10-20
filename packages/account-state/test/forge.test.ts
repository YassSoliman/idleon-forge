// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-25 contract tests: `account.forge`. Usable slots follow the New Forge Slot level (raw
// ForgeLV[0]), never Toolbox's 16 rows; each slot's ore is the raw ForgeItemOrder entry.
import { describe, expect, it } from 'vitest';
import { accountStateOf, PUBLIC_DIR, readSave } from './helpers';

type Data = Record<string, unknown>;
const json = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);

describe.each(['first.json', 'fourth.json', 'highend.json'])('%s', (file) => {
  const save = readSave(PUBLIC_DIR, file) as { data: Data };
  const f = accountStateOf(save).account.forge;
  const order = json(save.data.ForgeItemOrder) as string[];
  const levels = json(save.data.FurnaceLevels ?? save.data.ForgeLV) as number[];
  it('unlocks the slots the New Forge Slot level gives', () => {
    expect(f?.slots).toHaveLength(16);
    expect(f?.slotsUnlocked).toBe(Math.min(16, levels[0] ?? 0));
    expect(f?.slots.filter((s) => s.unlocked)).toHaveLength(f?.slotsUnlocked ?? -1);
  });
  it("each slot's ore and bar are the raw ForgeItemOrder entries", () => {
    for (const s of f?.slots ?? []) {
      const ore = order[s.index * 3];
      const bar = order[s.index * 3 + 2];
      expect(s.ore?.rawName ?? 'Blank').toBe(ore);
      if (s.bar) expect(s.bar.rawName).toBe(bar);
    }
  });
  it('a smelting slot empties within one bar of its ore', () => {
    for (const s of f?.slots ?? []) if (!s.smelting) expect(s.emptyInSeconds).toBe(0);
  });
});

it('fourth.json: 16 Godshard slots at capacity, six upgrades maxed, ores held from storage', () => {
  const f = accountStateOf(readSave(PUBLIC_DIR, 'fourth.json')).account.forge;
  expect(f?.slotsUnlocked).toBe(16);
  expect(f?.upgrades.map((u) => u.level)).toEqual([16, 50, 90, 85, 75, 60]);
  expect(
    f?.slots.every((s) => s.ore?.rawName === 'Godshard' && s.smelting && s.brimstone !== undefined),
  ).toBe(true);
  expect(f?.oreCapacity).toBe(20669);
  expect(f?.oresHeld.find((o) => o.rawName === 'Copper')).toMatchObject({ perBar: 2, baseSeconds: 15 });
  expect(f?.barrelsHeld.find((b) => b.rawName === 'OilBarrel7')).toMatchObject({
    effect: 'double',
    power: 60,
  });
});
