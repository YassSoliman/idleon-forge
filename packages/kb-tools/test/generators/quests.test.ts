// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/quests.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const step = (QuestName: string, extra: Record<string, unknown> = {}) => ({
  Type: 'ItemsAndSpaceRequired',
  QuestName,
  Name: `${QuestName}_name`,
  ConsumeItems: true,
  InventorySpacesNeeded: 1,
  itemReq: [{ rawName: 'Quest12', name: 'Wood_Board_Bone', amount: 3 }],
  rewards: [{ rawName: 'Key1', amount: 6 }],
  ...extra,
});

describe('quests generator', () => {
  it('orders steps by position, never by key, and places NPCs by npcPlacements (synthetic slice, hand-checked)', () => {
    const quests: Record<string, Record<string, unknown>> = {
      Fishpaste97: { 971: step('Fishpaste971'), 972: step('Fishpaste972'), sprite: 's' },
      Obol_Altar: { 1: step('Obol_Altar1') },
      Far_Npc: { 1: step('Far_Npc1') },
    };
    for (const npc of ['Dog_Bone', 'Djonnut', 'Hoggindaz', 'Bellows', 'Gobo'])
      quests[npc] = { 1: step(`${npc}1`) };
    const out = runOnSlice(generator, {
      quests,
      npcPlacements: {
        Fishpaste97: [60],
        Obol_Altar: [50],
        Far_Npc: [210],
        Dog_Bone: [20],
        Djonnut: [70],
        Hoggindaz: [110],
        Bellows: [120],
        Gobo: [160],
      },
      crafts: {},
      items: {},
    });
    const v = (id: string) => out.entries?.find((e) => e.id === `quests.acquisition.${id}`)?.values;
    expect(v('fishpaste971')).toMatchObject({ questOrder: 0, world: 2 });
    expect(v('fishpaste972')).toMatchObject({ questOrder: 1 });
    // Map 50 is World 2, although Toolbox's quest grouping files the altar under Blunder Hills.
    expect(v('obol-altar1')).toMatchObject({ world: 2 });
    // World 5 NPCs are out of scope; Gobo (World 4) appears only in the gate fact table.
    expect(v('far-npc1')).toBeUndefined();
    expect(v('gobo1')).toBeUndefined();
    const gates = out.facts?.find((f) => f.id === 'quests.fact.gate-quests')?.rows as Record<
      string,
      { world: number; steps: { questName: string }[] }
    >;
    expect(Object.keys(gates)).toEqual(['Dog_Bone', 'Djonnut', 'Hoggindaz', 'Bellows', 'Gobo']);
    expect(gates.Gobo).toMatchObject({ world: 4, steps: [{ questName: 'Gobo1' }] });
  });

  it('holds its invariants on the pinned data: the W1–W3 quest steps and the five gate NPCs', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries.length).toBeGreaterThan(150);
    expect(out.entries.length).toBeLessThan(400);
    expect(out.entries.every((e) => (e.values.world as number) <= 3)).toBe(true);
    // Hand-checked in quests.json: Dog_Bone1 asks for 3 Wood_Board_Bone (Quest12) and gives 6 Forest Villa keys.
    const dog = out.entries.find((e) => e.id === 'quests.acquisition.dog-bone1');
    expect(dog?.type === 'acquisition' && dog.data).toMatchObject({
      requires: [{ rawName: 'Quest12', amount: 3 }],
      rewards: [{ rawName: 'Key1', amount: 6 }],
    });
    const altar = out.entries.find((e) => e.id === 'quests.acquisition.obol-altar1');
    expect(altar?.values.world).toBe(2);
    const gates = out.facts.find((f) => f.id === 'quests.fact.gate-quests')?.rows as Record<
      string,
      { steps: unknown[] }
    >;
    for (const npc of ['Dog_Bone', 'Djonnut', 'Hoggindaz', 'Bellows', 'Gobo'])
      expect(gates[npc]?.steps.length).toBeGreaterThan(0);
  });

  it("orders each NPC's quests the way Toolbox's parser does, on a known save", async () => {
    const out = await runLive(generator);
    const parsed = knownSave('latest.json').account.quests as Record<
      string,
      { name: string; npcQuests: { QuestName: string }[] }[]
    >;
    const toolbox = new Map(
      Object.values(parsed)
        .flat()
        .map((n) => [n.name, n.npcQuests.map((q) => q.QuestName)]),
    );
    const ours = new Map<string, string[]>();
    for (const e of out.entries) {
      const npc = e.values.npc as string;
      ours.set(npc, [...(ours.get(npc) ?? []), e.values.questName as string]);
    }
    let checked = 0;
    for (const [npc, list] of ours) {
      const t = toolbox.get(npc);
      if (!t) continue; // NPCs Toolbox doesn't group under a world
      const sorted = [...list].sort((a, b) => {
        const ea = out.entries.find((e) => e.values.questName === a)?.values.questOrder as number;
        const eb = out.entries.find((e) => e.values.questName === b)?.values.questOrder as number;
        return ea - eb;
      });
      expect(sorted).toEqual(t);
      checked++;
    }
    expect(checked).toBeGreaterThan(40);
  });
});
