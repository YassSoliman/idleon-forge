// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type GemFactRow, gemRows } from '@idleon-forge/knowledge/generators/gem-shop.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('gem-shop generator', () => {
  it('reads cost, costIncrement and maxPurchases, skipping Blank and other tabs (synthetic slice, hand-checked)', () => {
    const item = (rawName: string, cost: number | null, globalIndex: number) => ({
      rawName,
      displayName: rawName.toUpperCase(),
      cost,
      globalIndex,
      maxPurchases: 1,
      costIncrement: 0,
    });
    const rows = gemRows([
      { name: 'bonuses', sections: { World_1: [item('GemP1', 300, 103), item('Blank', null, 104)] } },
      { name: 'mtx', sections: { Packs: [item('Pack1', 999, 1)] } },
    ]);
    expect(rows).toEqual([
      {
        id: 'gem-p1',
        rawName: 'GemP1',
        index: 103,
        name: 'GEMP1',
        tab: 'bonuses',
        section: 'World_1',
        price: 300,
        increment: 0,
        max: 1,
      },
    ]);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as GemFactRow[];
    // Hand-checked in gemShop.json at the pin: 85 priced usables/bonuses rows; Infinity Hammer (GemP1) is
    // index 103 at 300 gems, max 1; the Crystal 3D Printer (GemQ1) is index 111 at 875 gems.
    expect(rows).toHaveLength(85);
    expect(rows.find((r) => r.rawName === 'GemP1')).toMatchObject({ index: 103, price: 300, max: 1 });
    expect(rows.find((r) => r.rawName === 'GemQ1')).toMatchObject({ index: 111, price: 875 });
  });

  it("reads GemItemsPurchased by the same index Toolbox's parsers do, on a known save", async () => {
    // Toolbox reads these indices of gemShopPurchases at the pin: 120 in world-4/cooking.ts (Richelin
    // Kitchen), 123 in world-4/lab.ts (Souped Up Tube), 125 and 119 in world-4/breeding.ts (Fenceyard
    // Space, Royal Egg Cap). Our rows at those indices must be those items, and the save's counts for
    // these one-time upgrades never exceed their max. (Restocking dailies can exceed max over time.)
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as GemFactRow[];
    const at = (i: number) => rows.find((r) => r.index === i)?.name;
    expect([at(119), at(120), at(123), at(125)]).toEqual([
      'ROYAL_EGG_CAP',
      'RICHELIN_KITCHEN',
      'SOUPED_UP_TUBE',
      'FENCEYARD_SPACE',
    ]);
    const bought = knownSave('latest.json').account.gemShopPurchases as number[];
    for (const i of [119, 120, 123, 125]) {
      const r = rows.find((x) => x.index === i) as GemFactRow;
      expect(bought[i]).toBeGreaterThan(0);
      expect(bought[i]).toBeLessThanOrEqual(r.max);
    }
  });
});
