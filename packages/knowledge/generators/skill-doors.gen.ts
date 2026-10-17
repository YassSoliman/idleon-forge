// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Skill-level doors (M4 TR-4): `skills.goal.door-<skill>`. On mining and fishing maps a door's
// mapPortals requirement is a skill level (Toolbox portals.ts getMapDoorRequirements). A door counts
// when it leads to a real map of the same skill in W1–W4; doors into unused maps (Freefall Caverns'
// 81 to The Royal Castle, Echoing Egress' 50 to a placeholder) are filtered out. Choppin and Catching
// maps have no level doors, so they get no Goal.
import type { GeneratedEntryT } from '../src/schema';
import { MAP_INPUTS, mapDataOf, mapGraph, worldOf } from './map-graph';
import { defineGenerator, generatedBy, generatedSource } from './types';

export const SKILL_OF: Readonly<Record<string, string>> = { MINING: 'mining', FISHING: 'fishing' };
export const MAX_WORLD = 4;

const generator = defineGenerator({
  name: 'skill-doors',
  system: 'skills',
  inputs: [...MAP_INPUTS],
  run({ data, pin }) {
    const g = mapGraph(mapDataOf(data));
    const levels = new Map<string, Map<number, { from: number; door: number; to: number }[]>>();
    for (const m of g.indices) {
      const afk = g.afkType(m);
      const skill = afk ? SKILL_OF[afk] : undefined;
      if (!skill || !g.isReal(m) || worldOf(m) > MAX_WORLD) continue;
      for (const d of g.doors(m)) {
        if (d.requirement <= 0 || d.to === null || worldOf(d.to) > MAX_WORLD || g.afkType(d.to) !== afk)
          continue;
        const byLevel = levels.get(skill) ?? new Map();
        byLevel.set(d.requirement, [
          ...(byLevel.get(d.requirement) ?? []),
          { from: m, door: d.door, to: d.to },
        ]);
        levels.set(skill, byLevel);
      }
    }
    const by = generatedBy(generator, pin);
    const source = generatedSource(
      pin,
      'website-data/shared-data.json',
      'IdleOn Toolbox game data: mapPortals on skilling maps',
    );
    const pretty = (m: number) => g.name(m).replace(/_/g, ' ');
    const entries: GeneratedEntryT[] = [...levels.entries()].map(([skill, byLevel]) => {
      const label = skill.charAt(0).toUpperCase() + skill.slice(1);
      const steps = [...byLevel.entries()].sort(([a], [b]) => a - b);
      return {
        id: `skills.goal.door-${skill}`,
        system: 'skills',
        type: 'goal',
        origin: 'generated',
        title: `${label} level doors`,
        text: `${label} level {value:int}; next door at level {next:int}`,
        why: `${label} level opens the doors to the next ${skill} maps.`,
        values: { skill },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        scope: 'character',
        category: 'compounding',
        unit: 'level',
        progress: { id: 'skills/level', params: { skill } },
        milestones: steps.map(([at, ds]) => ({
          at,
          reward: ds.map((d) => `door to ${pretty(d.to)}`).join(' and '),
        })),
        data: { doors: steps.flatMap(([level, ds]) => ds.map((d) => ({ level, ...d }))) },
        generatedBy: by,
      };
    });
    return { entries };
  },
});

export default generator;
