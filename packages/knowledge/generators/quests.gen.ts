// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Quests (M2 TR-7, M8 TR-3): one generated Acquisition per quest step of every NPC who stands in
// Worlds 1–3, `quests.acquisition.<slug of QuestName>` (Hamish1 -> hamish1), with its hand-in items
// (and their one-level craft), its rewards and, for a Custom quest, its measured thresholds. The NPC's
// world is its npcPlacements map's world, never Toolbox's quest grouping (M8 TR-8 rule 2: the Obol
// Altar stands on map 50, World 2, although Toolbox files it under Blunder Hills).
//
// Plus the fact table `quests.fact.gate-quests`: the steps of the five world-gate NPCs (Dog Bone,
// Djonnut, Hoggindaz, Bellows, Gobo), their in-game names and requirements, for M2's gate chain.
import type { FactTableT, GeneratedEntryT } from '../src/schema';
import {
  craftsByRawName,
  customOf,
  type Json,
  type OrderedStep,
  questSteps,
  requirement,
} from './quest-steps';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';
import { humanName, npcWorld } from './world-maps';

export const GATE_NPCS = ['Dog_Bone', 'Djonnut', 'Hoggindaz', 'Bellows', 'Gobo'] as const;
const MAX_WORLD = 3;

const generator = defineGenerator({
  name: 'quests',
  system: 'quests',
  inputs: [
    'website-data/quests.json',
    'website-data/shared-data.json#npcPlacements',
    'website-data/crafts.json',
    'website-data/items.json',
  ],
  run({ data, pin }) {
    const quests = data.quests as Record<string, Record<string, unknown>>;
    const placements = data.npcPlacements as Record<string, number[]>;
    const crafts = craftsByRawName(data.crafts as Record<string, { rawName: string }>);
    const items = data.items as Record<string, { lvReqToCraft?: number }>;
    const steps = questSteps(quests);
    if (steps.length === 0) throw new Error('quests: quests.json has no quest steps');
    for (const npc of GATE_NPCS)
      if (!quests[npc]) throw new Error(`quests: gate NPC ${npc} is missing from quests.json`);
    const source = generatedSource(pin, 'website-data/quests.json', 'IdleOn Toolbox game data: quests');
    const by = generatedBy(generator, pin);

    const stepData = ({ npc, key, order, step }: OrderedStep): { [k: string]: Json } => {
      const where = npcWorld(placements, npc);
      const questName = step.QuestName ?? `${npc}${key}`;
      return {
        acquisition: `quests.acquisition.${slugify(questName)}`,
        npc,
        questKey: key,
        questOrder: order,
        questName,
        title: humanName(step.Name ?? ''),
        questType: step.Type ?? null,
        world: where?.world ?? null,
        map: where?.map ?? null,
        consumes: step.ConsumeItems === true,
        inventorySpacesNeeded: step.InventorySpacesNeeded ?? 0,
        // M14 TR-4: each hand-in item references its generated item Acquisition, so a shipped quest
        // ships the Requirement Tree of its items (kb compile follows ids).
        requires: (step.itemReq ?? []).map((i) => ({
          ...requirement(i, crafts, items),
          ref: `items.acquisition.${slugify(i.rawName)}`,
        })),
        custom: customOf(step),
        rewards: (step.rewards ?? []).map((r) => ({ rawName: r.rawName, amount: r.amount ?? 1 })),
      };
    };

    const entries: GeneratedEntryT[] = [];
    for (const s of steps) {
      const where = npcWorld(placements, s.npc);
      if (!where || where.world > MAX_WORLD) continue;
      const questName = s.step.QuestName ?? `${s.npc}${s.key}`;
      const title = humanName(s.step.Name ?? questName);
      entries.push({
        id: `quests.acquisition.${slugify(questName)}`,
        system: 'quests',
        type: 'acquisition',
        origin: 'generated',
        title: `Quest: ${title}`.slice(0, 80),
        text: `${humanName(s.npc)} quest ${s.order + 1}: ${title}`.slice(0, 240),
        why: 'A quest gives its rewards once its requirements are handed in or met.',
        values: { npc: s.npc, questName, questOrder: s.order, world: where.world },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'other', rawName: questName.slice(0, 64) },
        data: stepData(s),
        generatedBy: by,
      });
    }

    const facts: FactTableT[] = [
      {
        id: 'quests.fact.gate-quests',
        system: 'quests',
        origin: 'generated',
        title: 'World gate NPC quests',
        rows: Object.fromEntries(
          GATE_NPCS.map((npc) => [
            npc,
            {
              world: npcWorld(placements, npc)?.world ?? null,
              steps: steps.filter((s) => s.npc === npc).map(stepData),
            },
          ]),
        ),
        sources: [source],
        generatedBy: by,
      },
    ];
    return { entries, facts };
  },
});

export default generator;
