// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/obols.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('obols generator', () => {
  it('groups drop rows per obol, takes effectiveChance and the shape from the item type (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, {
      monsterDrops: {
        Boss2A: [
          {
            monsterRawName: 'Boss2A',
            rawName: 'ObolEfauntA',
            displayName: 'Skeletal_Obol',
            Type: 'HEXAGON_OBOL',
            chance: 1,
            effectiveChance: 0.001,
          },
          { monsterRawName: 'Boss2A', rawName: 'COIN', chance: 0.5 },
        ],
        Boss2C: [
          { monsterRawName: 'Boss2C', rawName: 'ObolEfauntA', Type: 'HEXAGON_OBOL', effectiveChance: 0.018 },
        ],
      },
      obols: {
        character: { 0: { shape: 'Square', levelReq: 32 } },
        family: { 0: { shape: 'Circle', levelReq: 60 } },
      },
      mapEnemiesArray: ['Nothing', 'Boss2C'],
      mapNames: { 0: 'Z', 1: 'Boss_Room' },
    });
    expect(out.entries?.map((e) => e.id)).toEqual(['obols.acquisition.obol-efaunt-a-drop']);
    const e = out.entries?.[0];
    expect(e?.type === 'acquisition' && e.rates).toEqual({ Boss2A: 0.001, Boss2C: 0.018 });
    expect(e?.values).toMatchObject({ shape: 'Hexagon' });
    expect(out.facts?.[0]?.rows).toEqual({
      character: [{ slot: 0, shape: 'Square', levelReq: 32 }],
      family: [{ slot: 0, shape: 'Circle', levelReq: 60 }],
    });
  });

  it('holds its invariants on the pinned data: the monster obols and the slot table', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries.length).toBeGreaterThanOrEqual(8);
    expect(out.entries.length).toBeLessThanOrEqual(30);
    // Hand-checked in monsterDrops.json: Efaunt's obol drops at 0.1% / 0.3% / 1.8% from Boss2A/B/C,
    // and the Gigafrog drops the Bronze Obol of Pop at 0.001%.
    const efaunt = out.entries.find((e) => e.id === 'obols.acquisition.obol-efaunt-a-drop');
    expect(efaunt?.type === 'acquisition' && efaunt.rates).toEqual({
      Boss2A: 0.001,
      Boss2B: 0.003,
      Boss2C: 0.018,
    });
    const pop = out.entries.find((e) => e.id === 'obols.acquisition.obol-bronze-pop-drop');
    expect(pop?.type === 'acquisition' && pop.rates).toEqual({ frogBIG: 0.00001 });
    const slots = out.facts.find((f) => f.id === 'obols.fact.slots')?.rows as Record<string, unknown[]>;
    expect(slots.character?.length).toBeGreaterThanOrEqual(16);
    expect(slots.family?.length).toBeGreaterThanOrEqual(16);
  });

  it("matches the slot shapes and level gates Toolbox's parser gives a character, on a known save", async () => {
    const out = await runLive(generator);
    const slots = out.facts.find((f) => f.id === 'obols.fact.slots')?.rows as {
      character: { slot: number; shape: string; levelReq: number }[];
    };
    const parsed = knownSave('latest.json');
    const list = (
      (parsed.characters[0]?.obols ?? { list: [] }) as {
        list: { index: number; shape: string; levelReq: number }[];
      }
    ).list;
    expect(list.length).toBe(slots.character.length);
    // Our `slot` is the position in the save's ObolEquippedOrder, which keys shared-data obols; Toolbox
    // re-sorts the list by a display index (calculateWeirdObolIndex), so compare the slots as a set.
    const key = (o: { shape: string; levelReq: number }) => `${o.shape}@${o.levelReq}`;
    expect(list.map(key).sort()).toEqual(slots.character.map(key).sort());
  });
});
