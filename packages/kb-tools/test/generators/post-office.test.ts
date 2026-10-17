// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { boxRows, unlockRow } from '@idleon-forge/knowledge/generators/post-office.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('post-office generator', () => {
  it('reads the first quest name and box levels from data fields (synthetic slice, hand-checked)', () => {
    expect(
      unlockRow({ Postboy_Pablob: { '1': { QuestName: 'Postboy_Pablob1' } } }, { Postboy_Pablob: [50] }),
    ).toEqual({
      npc: 'Postboy_Pablob',
      quest: 'Postboy_Pablob1',
      npcMaps: [50],
    });
    expect(
      boxRows([{ name: 'Civil_War_Memory_Box', maxLevel: 400, upgradeLevels: [24.9, 99.9, 400.1] }]),
    ).toEqual([
      {
        id: 'civil-war-memory-box',
        index: 0,
        name: 'Civil_War_Memory_Box',
        maxLevel: 400,
        upgradeLevels: [24.9, 99.9, 400.1],
      },
    ]);
    expect(() => unlockRow({}, {})).toThrow(/no first quest/);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const get = (id: string): unknown => out.facts.find((f) => f.id === id)?.rows;
    // Hand-checked at the pin: quest Postboy_Pablob1 (M6 TR-5), NPC on map 50; 24 boxes.
    expect(get('post-office.fact.unlock')).toEqual({
      npc: 'Postboy_Pablob',
      quest: 'Postboy_Pablob1',
      npcMaps: [50],
    });
    expect(get('post-office.fact.boxes')).toHaveLength(24);
  });

  it("names the same boxes, in the same order, as Toolbox's parsed Post Office, on a known save", async () => {
    const out = await runLive(generator);
    const boxes = out.facts.find((f) => f.id === 'post-office.fact.boxes')?.rows as unknown as {
      name: string;
      index: number;
    }[];
    const chars = knownSave('latest.json').characters as {
      postOffice?: { boxes?: { name: string }[] } | { name: string }[];
    }[];
    const po = chars.find((c) => c.postOffice)?.postOffice;
    const list = (Array.isArray(po) ? po : (po?.boxes ?? [])) as { name: string }[];
    expect(list.length).toBe(boxes.length);
    list.forEach((b, i) => {
      expect(boxes[i]?.name).toBe(b.name);
    });
  });
});
