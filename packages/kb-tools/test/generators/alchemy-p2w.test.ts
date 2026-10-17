// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/alchemy-p2w.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const MAX = {
  brewing: 170,
  liquidsRegen: 100,
  liquidsCapacity: 80,
  cauldronsSpeed: 150,
  cauldronsNewBubble: 125,
  cauldronsBoostReq: 100,
  vialsAttempts: 15,
  vialsRng: 45,
};

describe('alchemy-p2w generator', () => {
  it('names upgrades from the exported info lists and caps them from CAULDRONS_MAX_LEVELS (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(
      generator,
      {},
      {
        CAULDRONS_MAX_LEVELS: { ...MAX, cauldronsSpeed: 7 },
        CAULDRON_INFO: [{ name: 'power', displayName: 'Power' }],
        LIQUID_INFO: [{ name: 'water drops', displayName: 'Water Drops' }],
      },
    );
    const v = (id: string) => out.entries?.find((e) => e.id === `alchemy-p2w.acquisition.${id}`)?.values;
    expect(out.entries).toHaveLength(3 + 2 + 2);
    expect(v('cauldron-power-speed')).toEqual({
      key: 'cauldron.power.speed',
      group: 'cauldron',
      upgrade: 'speed',
      maxLevel: 7,
      slot: 0,
    });
    expect(v('liquid-water-drops-capacity')).toMatchObject({
      key: 'liquid.water-drops.capacity',
      maxLevel: 80,
    });
    expect(v('vials-rng')).toMatchObject({ key: 'vials.rng', maxLevel: 45 });
  });

  it('holds its invariants on the pinned data: 4 cauldrons × 3 + 4 liquids × 2 + 2 vial upgrades', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries).toHaveLength(22);
    // Hand-checked in parsers/world-2/alchemy.ts CAULDRONS_MAX_LEVELS: speed 150, new bubble 125, boost 100,
    // regen 100, capacity 80, vial attempts 15, vial rng 45.
    const v = (id: string) =>
      out.entries.find((e) => e.id === `alchemy-p2w.acquisition.${id}`)?.values.maxLevel;
    expect(v('cauldron-power-speed')).toBe(150);
    expect(v('cauldron-kazam-new-bubble')).toBe(125);
    expect(v('cauldron-high-iq-boost-req')).toBe(100);
    expect(v('liquid-toxic-mercury-regen')).toBe(100);
    expect(v('liquid-liquid-n2-capacity')).toBe(80);
    expect(v('vials-attempts')).toBe(15);
  });

  it("matches Toolbox's parsed Pay 2 Win on a known save (a level never exceeds its max; maxed means nothing left to pay)", async () => {
    const out = await runLive(generator);
    const p2w = knownSave('latest.json').account.alchemy as {
      p2w: Record<'cauldrons' | 'liquids', Record<string, { level: number; costToMax: number }>[]>;
    };
    let checked = 0;
    for (const e of out.entries) {
      const group = e.values.group as string;
      if (group === 'vials') continue;
      const list = group === 'cauldron' ? p2w.p2w.cauldrons : p2w.p2w.liquids;
      const t = list[e.values.slot as number]?.[e.values.upgrade as string];
      expect(t).toBeDefined();
      expect(t?.level).toBeLessThanOrEqual(e.values.maxLevel as number);
      expect(t?.costToMax === 0).toBe(t?.level === e.values.maxLevel);
      checked++;
    }
    expect(checked).toBe(20);
  });
});
