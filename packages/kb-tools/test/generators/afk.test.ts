// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { foodKinds } from '@idleon-forge/knowledge/generators/afk.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('afk generator', () => {
  it('classifies food by the items.json Type field (synthetic slice, hand-checked)', () => {
    expect(
      foodKinds({
        FoodG9: { Type: 'GOLDEN_FOOD' },
        FoodHealth1: { Type: 'HEALTH_FOOD' },
        Peanut: { Type: 'BOOST_FOOD' },
        FoodDungeon: { Type: 'DUNGEON_FOOD' },
        Copper: { Type: 'ORE' },
      }),
    ).toEqual({ FoodG9: 'golden', FoodHealth1: 'health', Peanut: 'boost' });
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as Record<string, string>;
    // Hand-checked in items.json at the pin: 22 health, 41 boost, 17 golden food items.
    const count = (k: string) => Object.values(rows).filter((v) => v === k).length;
    expect([count('health'), count('boost'), count('golden')]).toEqual([22, 41, 17]);
  });

  it('agrees with the Type Toolbox gives each equipped food, on a known save', async () => {
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as Record<string, string>;
    const want = { HEALTH_FOOD: 'health', BOOST_FOOD: 'boost', GOLDEN_FOOD: 'golden' } as Record<
      string,
      string
    >;
    const chars = knownSave('latest.json').characters as { food?: { rawName?: string; Type?: string }[] }[];
    let checked = 0;
    for (const c of chars)
      for (const f of c.food ?? []) {
        if (!f?.rawName || !f.Type || !want[f.Type]) continue;
        expect(rows[f.rawName]).toBe(want[f.Type]);
        checked++;
      }
    expect(checked).toBeGreaterThan(5);
  });
});
