// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/stamps.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const stamp = (rawName: string, displayName: string, capStep: number, material: string) => ({
  displayName,
  rawName,
  reqItemMultiplicationLevel: capStep,
  baseMatCost: 5,
  baseCoinCost: 50,
  powCoinBase: 1.3,
  powMatBase: 6,
  itemReq: [{ name: material, rawName: material }],
});

const slice = {
  stamps: {
    combat: {
      0: stamp('StampA4', 'Tomahawk_Stamp', 4, 'CopperBar'),
      1: stamp('StampA5', 'Wax_Stamp', 5, 'Ore'),
    },
    misc: { 0: stamp('StampC9', 'Gear_Stamp', 10, 'Ore') },
  },
  shops: { 0: { name: 'Town', items: [{ rawName: 'StampA5' }] } },
  npcPlacements: { Hamish: [2] },
  mapNames: { 0: 'Town', 2: 'Field' },
  mapEnemiesArray: ['Nothing', 'Nothing', 'frogG'],
  quests: {
    Hamish: {
      1: {
        Type: 'ItemsAndSpaceRequired',
        QuestName: 'Hamish1',
        Name: 'The_Hamazing_Plot_Twist',
        ConsumeItems: true,
        InventorySpacesNeeded: 1,
        itemReq: [{ rawName: 'EquipmentToolsHatchet3', name: 'Copper_Chopper', amount: 1 }],
        rewards: [
          { rawName: 'StampA4', amount: 1 },
          { rawName: 'Experience3', amount: 100 },
        ],
      },
      sprite: 'x',
    },
  },
  monsterDrops: {
    frogG: [
      {
        monsterRawName: 'frogG',
        rawName: 'StampA4',
        chance: 0.002,
        effectiveChance: 0.001,
        questLink: 'N/A',
      },
    ],
  },
  crafts: {
    Copper_Chopper: {
      rawName: 'EquipmentToolsHatchet3',
      materials: [{ rawName: 'OakTree', itemName: 'Oak_Logs', itemQuantity: 6 }],
    },
  },
  items: { EquipmentToolsHatchet3: { lvReqToCraft: 15 } },
};

describe('stamps generator', () => {
  it('builds the shop, quest (with one-level craft) and drop routes (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, slice, { unobtainableStamps: { Gear_Stamp: true } });
    const a4 = out.entries?.find((e) => e.id === 'stamps.acquisition.stamp-a4');
    expect(a4?.values).toMatchObject({ capStep: 4, material: 'CopperBar', tab: 'combat', baseCoinCost: 50 });
    const routes = (a4?.type === 'acquisition' ? (a4.data?.routes ?? []) : []) as Record<string, unknown>[];
    expect(routes.find((r) => r.kind === 'quest')).toMatchObject({
      npc: 'Hamish',
      questName: 'Hamish1',
      world: 1,
      map: 2,
      consumes: true,
      requires: [
        {
          rawName: 'EquipmentToolsHatchet3',
          amount: 1,
          craft: { lvReqToCraft: 15, materials: [{ rawName: 'OakTree', amount: 6 }] },
        },
      ],
      alsoRewards: [{ rawName: 'Experience3', amount: 100 }],
    });
    // The effective chance, not the raw chance, is the drop rate.
    expect(routes.find((r) => r.kind === 'drop')).toMatchObject({
      monster: 'frogG',
      chance: 0.001,
      maps: [2],
      world: 1,
    });
    expect(a4?.type === 'acquisition' && a4.rates).toEqual({ frogG: 0.001 });
    const a5 = out.entries?.find((e) => e.id === 'stamps.acquisition.stamp-a5');
    expect(a5?.type === 'acquisition' && a5.data?.routes).toEqual([
      { kind: 'shop', shop: 0, town: 'Town', map: 0, world: 1, price: null },
    ]);
    const gear = out.entries?.find((e) => e.id === 'stamps.acquisition.stamp-c9');
    expect(gear?.type === 'acquisition' && gear.data?.obtainable).toBe(false);
  });

  it('fails when a quest rewards a stamp stamps.json lacks (M8 TR-8 rule 6)', () => {
    const bad = structuredClone(slice);
    bad.quests.Hamish[1].rewards[0] = { rawName: 'StampZ99', amount: 1 };
    expect(() => runOnSlice(generator, bad, {})).toThrow(/StampZ99/);
  });

  it('holds its invariants on the pinned data: 128 stamps, Toolbox marks 6 unobtainable', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries).toHaveLength(128);
    // Toolbox's list names 7 stamps, one with a typo, so 6 match: the authored overlay fixes it (M8 TR-3).
    expect(out.entries.filter((e) => e.type === 'acquisition' && e.data?.obtainable === false)).toHaveLength(
      6,
    );
    // Hand-checked against quests.json Hamish1 and the M8 TR-3 example: the Tomahawk Stamp is a W1 quest
    // reward for a Copper Chopper, craftable from 6 Oak Logs.
    const a4 = out.entries.find((e) => e.id === 'stamps.acquisition.stamp-a4');
    const quest = (
      (a4?.type === 'acquisition' ? (a4.data?.routes ?? []) : []) as Record<string, unknown>[]
    ).find((r) => r.kind === 'quest');
    expect(quest).toMatchObject({
      npc: 'Hamish',
      world: 1,
      requires: [
        { rawName: 'EquipmentToolsHatchet3', craft: { materials: [{ rawName: 'OakTree', amount: 6 }] } },
      ],
    });
    // The Obol Altar's map is in World 2 (npcPlacements map 50), not Toolbox's Blunder Hills grouping.
    const shopStamps = out.entries.filter(
      (e) =>
        e.type === 'acquisition' &&
        ((e.data?.routes ?? []) as { kind: string }[]).some((r) => r.kind === 'shop'),
    );
    expect(shopStamps.length).toBeGreaterThanOrEqual(10);
  });

  it("matches Toolbox's parsed stamps on a known save (catalogue, cap step, raise material)", async () => {
    const out = await runLive(generator);
    const parsed = knownSave('latest.json').account.stamps as Record<
      string,
      { rawName: string; reqItemMultiplicationLevel: number; itemReq: { rawName: string } }[]
    >;
    const all = Object.values(parsed).flat();
    expect(all.map((s) => s.rawName).sort()).toEqual(
      out.entries.map((e) => (e.type === 'acquisition' ? e.thing.rawName : '')).sort(),
    );
    for (const e of out.entries) {
      if (e.type !== 'acquisition') continue;
      const t = all.find((s) => s.rawName === e.thing.rawName);
      expect(t?.reqItemMultiplicationLevel).toBe(e.values.capStep);
      expect(t?.itemReq?.rawName).toBe(e.values.material);
    }
  });
});
