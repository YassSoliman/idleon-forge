// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 TR-10: the items generator. Hand-checked trees for the Post Office quest and Anvil Tab 2 on the
// live pinned data, and, for every World 1–3 quest, no recipe loop, no depth stop and no dangling
// reference.
import generator, { sampleItem } from '@idleon-forge/knowledge/generators/items.gen';
import quests from '@idleon-forge/knowledge/generators/quests.gen';
import { describe, expect, it } from 'vitest';
import { runLive } from './helpers';

type Data = {
  rawName: string;
  recipe: { lvReqToCraft: number; materials: { rawName: string; amount: number; ref: string }[] } | null;
  forge: { ore: string; ref: string } | null;
  anvil: { requiredAmount: number; levelReq: number } | null;
  liquidShop: { x1: number; x2: number } | null;
  drops: { monster: string; maps: number[]; chance: number; printable: boolean; table: boolean }[];
};

describe('items generator', () => {
  it('picks the FR-26 sample item: the first of the first four rows that is no coin, card or quest item', () => {
    expect(
      sampleItem([
        { rawName: 'COIN' },
        { rawName: 'CardsA1', typeGen: 'dCard' },
        { rawName: 'Quest5', questLink: 'Goldric3' },
        { rawName: 'DesertA2', questLink: 'N/A' },
      ]),
    ).toBe('DesertA2');
    expect(
      sampleItem([{ rawName: 'COIN' }, { rawName: 'PureWater', dropTablePath: ['DropTable14'] }]),
    ).toBeNull();
  });

  it('generates the Post Office tree and Anvil Tab 2 as the wiki and spec state them (hand-checked)', async () => {
    const { entries } = await runLive(generator);
    const by = new Map(entries.map((e) => [e.id, (e as { data?: unknown }).data as Data]));
    const box = by.get('items.acquisition.quest13');
    expect(box?.recipe).toEqual({
      lvReqToCraft: 15,
      materials: [
        { rawName: 'Fish2', amount: 250, ref: 'items.acquisition.fish2' },
        { rawName: 'DesertA2', amount: 400, ref: 'items.acquisition.desert-a2' },
        { rawName: 'PureWater', amount: 4, ref: 'items.acquisition.pure-water' },
      ],
    });
    const tab = by.get('items.acquisition.equipment-smithing-tabs2');
    expect(tab?.recipe?.materials.map((m) => [m.rawName, m.amount])).toEqual([
      ['IronBar', 100],
      ['CraftMat7', 100],
      ['JungleTree', 100],
      ['Forest3', 100],
    ]);
    expect(by.get('items.acquisition.iron-bar')?.forge?.ore).toBe('Iron');
    expect(by.get('items.acquisition.craft-mat7')?.anvil).toMatchObject({
      requiredAmount: 700,
      levelReq: 17,
    });
    expect(by.get('items.acquisition.pure-water')?.liquidShop).toMatchObject({ x1: 1, x2: 1.37 });
    const teeth = by.get('items.acquisition.desert-a2')?.drops.find((d) => d.monster === 'mimicA');
    expect(teeth).toMatchObject({ chance: 0.212, printable: true, table: false });
    expect(teeth?.maps).toContain(52);
    expect(by.get('items.acquisition.forest3')?.drops.map((d) => [d.monster, d.chance])).toEqual([
      ['frogBIG', 0.14],
    ]);
  });

  it('every W1–W3 quest tree resolves: no dangling reference, no loop, no depth stop (TR-10)', async () => {
    const { entries } = await runLive(generator);
    const ids = new Set(entries.map((e) => e.id));
    const data = new Map(entries.map((e) => [e.id, (e as { data?: unknown }).data as Data]));
    const q = await runLive(quests);
    const walk = (id: string, path: string[]): void => {
      expect(ids.has(id), `${path.join(' > ')} > ${id}`).toBe(true);
      expect(path.includes(id), `loop at ${id}`).toBe(false);
      expect(path.length, `depth at ${id}`).toBeLessThan(6);
      const d = data.get(id);
      for (const m of d?.recipe?.materials ?? []) walk(m.ref, [...path, id]);
      if (d?.forge) expect(ids.has(d.forge.ref)).toBe(true);
    };
    let n = 0;
    for (const e of q.entries) {
      const req = ((e as { data?: { requires?: { ref: string }[] } }).data?.requires ?? []) as {
        ref: string;
      }[];
      for (const r of req) {
        walk(r.ref, []);
        n++;
      }
    }
    expect(n).toBeGreaterThan(100);
  });
});
