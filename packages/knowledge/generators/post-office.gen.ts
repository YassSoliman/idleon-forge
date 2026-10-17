// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Post Office facts (M6 TR-5):
// - `post-office.fact.unlock`: the quest that opens the Post Office (Postboy Pablob's first quest,
//   `Postboy_Pablob1`, from quests.json) and the maps the NPC stands on (npcPlacements);
// - `post-office.fact.boxes`: the box catalogue (name, max level, the levels where each of its three
//   bonuses unlocks), from shared-data postOffice.
// Not generated: the "highest character Lv 50" gate M6 names. No website-data field holds it; it needs
// an authored tier-2 or Toolbox-code constant row first.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

export const POST_OFFICE_NPC = 'Postboy_Pablob';

interface QuestStep {
  QuestName?: string;
}
interface Box {
  name: string;
  maxLevel: number;
  upgradeLevels: number[];
}

export function unlockRow(
  quests: Record<string, Record<string, QuestStep>>,
  placements: Record<string, number[]>,
) {
  const steps = quests[POST_OFFICE_NPC];
  const first = steps?.['1']?.QuestName;
  if (!first) throw new Error(`post-office: ${POST_OFFICE_NPC} has no first quest in quests.json`);
  return { npc: POST_OFFICE_NPC, quest: first, npcMaps: [...(placements[POST_OFFICE_NPC] ?? [])] };
}

export function boxRows(boxes: Box[]) {
  return boxes.map((b, index) => {
    if (typeof b.maxLevel !== 'number' || !Array.isArray(b.upgradeLevels))
      throw new Error(`post-office: box ${b.name} has no maxLevel or upgradeLevels`);
    return {
      id: slugify(b.name),
      index,
      name: b.name,
      maxLevel: b.maxLevel,
      upgradeLevels: [...b.upgradeLevels],
    };
  });
}

const generator = defineGenerator({
  name: 'post-office',
  system: 'post-office',
  inputs: [
    'website-data/quests.json',
    'website-data/shared-data.json#npcPlacements',
    'website-data/shared-data.json#postOffice',
  ],
  run({ data, pin }) {
    const by = generatedBy(generator, pin);
    const unlock: FactTableT = {
      id: 'post-office.fact.unlock',
      system: 'post-office',
      origin: 'generated',
      title: 'Post Office unlock quest',
      rows: unlockRow(
        data.quests as Record<string, Record<string, QuestStep>>,
        data.npcPlacements as Record<string, number[]>,
      ),
      sources: [generatedSource(pin, 'website-data/quests.json', 'IdleOn Toolbox game data: quests')],
      generatedBy: by,
    };
    const boxes: FactTableT = {
      id: 'post-office.fact.boxes',
      system: 'post-office',
      origin: 'generated',
      title: 'Post Office boxes: max level and bonus unlock levels',
      rows: boxRows(data.postOffice as Box[]) as unknown as FactTableT['rows'],
      sources: [
        generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: postOffice'),
      ],
      generatedBy: by,
    };
    return { facts: [boxes, unlock] };
  },
});

export default generator;
