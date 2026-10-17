// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Gathering tool tiers (M4 TR-4): `skills.goal.tool-<skill>`, the anvil-crafted tools of each
// gathering skill at the skill level that lets a character equip them (items.json lvReqToEquip),
// with each tool's anvil recipe (crafts.json materials) in `data` for M4's tool-chain Detector.
// Only tools with an anvil recipe are tiers; drop-only tools are not.
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

/** items.json Type of each gathering skill's tool, to Toolbox's skill key (parseMaps.ts skillIndexMap). */
export const TOOL_TYPES: Readonly<Record<string, string>> = {
  PICKAXE: 'mining',
  HATCHET: 'chopping',
  FISHING_ROD: 'fishing',
  BUG_CATCHING_NET: 'catching',
};

interface Item {
  displayName?: string;
  Type?: string;
  lvReqToEquip?: number;
}
interface Craft {
  rawName: string;
  materials?: { rawName: string; itemQuantity: number }[];
}

const generator = defineGenerator({
  name: 'tools',
  system: 'skills',
  inputs: ['website-data/items.json', 'website-data/crafts.json'],
  run({ data, pin }) {
    const items = data.items as Record<string, Item>;
    const crafts = Object.values(data.crafts as Record<string, Craft>);
    const recipe = new Map(crafts.map((c) => [c.rawName, c.materials ?? []]));
    const bySkill = new Map<
      string,
      { rawName: string; name: string; level: number; materials: { rawName: string; quantity: number }[] }[]
    >();
    for (const [rawName, it] of Object.entries(items)) {
      const skill = it.Type ? TOOL_TYPES[it.Type] : undefined;
      if (!skill || !recipe.has(rawName)) continue;
      if (typeof it.lvReqToEquip !== 'number' || it.lvReqToEquip < 1) continue;
      const list = bySkill.get(skill) ?? [];
      list.push({
        rawName,
        name: (it.displayName ?? rawName).replace(/_/g, ' '),
        level: it.lvReqToEquip,
        materials: (recipe.get(rawName) ?? []).map((m) => ({ rawName: m.rawName, quantity: m.itemQuantity })),
      });
      bySkill.set(skill, list);
    }
    const by = generatedBy(generator, pin);
    const source = generatedSource(
      pin,
      'website-data/items.json',
      'IdleOn Toolbox game data: tool lvReqToEquip and anvil recipes',
    );
    const entries: GeneratedEntryT[] = [...bySkill.entries()].map(([skill, tools]) => {
      tools.sort((a, b) => a.level - b.level || a.rawName.localeCompare(b.rawName));
      const byLevel = new Map<number, string[]>();
      for (const t of tools) byLevel.set(t.level, [...(byLevel.get(t.level) ?? []), t.name]);
      const label = skill.charAt(0).toUpperCase() + skill.slice(1);
      return {
        id: `skills.goal.tool-${skill}`,
        system: 'skills',
        type: 'goal',
        origin: 'generated',
        title: `${label} tools`,
        text: `${label} level {value:int}; next tool tier at level {next:int}`,
        why: `A better ${skill} tool raises the ${skill} rate.`,
        values: { skill },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        scope: 'character',
        category: 'compounding',
        unit: 'level',
        progress: { id: 'skills/level', params: { skill } },
        milestones: [...byLevel.entries()]
          .sort(([a], [b]) => a - b)
          .map(([at, names]) => ({ at, reward: names.join(' or ').slice(0, 240) })),
        data: { tools },
        generatedBy: by,
      };
    });
    return { entries };
  },
});

export default generator;
