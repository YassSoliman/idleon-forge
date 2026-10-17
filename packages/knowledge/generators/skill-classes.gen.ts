// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `talents.fact.skill-classes` (M5 TR-6, feeding the Role table's checks): for each class, the skill
// attack talents its talent tabs carry, by skill. A skill attack is a talent whose AFKactivity code
// marks an AFK skill (1 mining, 3 choppin, 4 fishing; M9 TR-10). Only that data field is used: talent
// descriptions are never read, so a class "has" a skill here only through game data.
import type { FactTableT } from '../src/schema';
import { SKILL_ATTACK_CODES } from './talents.gen';
import { defineGenerator, generatedBy, generatedSource } from './types';

interface Promotion {
  talentTabs?: string[];
  released?: boolean;
}

export interface SkillClassRow {
  class: string;
  /** skill -> talent rawNames on this class's tabs that are skill attacks for it. */
  skills: Record<string, string[]>;
}

export function skillClasses(
  talents: Record<string, Record<string, { name: string; AFKactivity?: number }>>,
  promotions: Record<string, Promotion>,
): SkillClassRow[] {
  const rows: SkillClassRow[] = [];
  for (const [cls, p] of Object.entries(promotions)) {
    if (p.released === false) continue;
    const skills: Record<string, string[]> = {};
    for (const tab of p.talentTabs ?? [])
      for (const t of Object.values(talents[tab] ?? {})) {
        const skill = typeof t.AFKactivity === 'number' ? SKILL_ATTACK_CODES[t.AFKactivity] : undefined;
        if (!skill) continue;
        if (!skills[skill]) skills[skill] = [];
        const list = skills[skill] as string[];
        if (!list.includes(t.name)) list.push(t.name);
      }
    for (const list of Object.values(skills)) list.sort();
    rows.push({
      class: cls,
      skills: Object.fromEntries(Object.entries(skills).sort(([a], [b]) => (a < b ? -1 : 1))),
    });
  }
  return rows.sort((a, b) => (a.class < b.class ? -1 : 1));
}

const generator = defineGenerator({
  name: 'skill-classes',
  system: 'talents',
  inputs: ['website-data/talents.json', 'website-data/classPromotions.json'],
  run({ data, pin }) {
    const rows = skillClasses(
      data.talents as Parameters<typeof skillClasses>[0],
      data.classPromotions as Record<string, Promotion>,
    );
    if (!rows.some((r) => Object.keys(r.skills).length > 0))
      throw new Error('skill-classes: no class has a skill attack');
    const fact: FactTableT = {
      id: 'talents.fact.skill-classes',
      system: 'talents',
      origin: 'generated',
      title: 'Skill attacks by class',
      rows: rows as unknown as FactTableT['rows'],
      sources: [generatedSource(pin, 'website-data/talents.json', 'IdleOn Toolbox game data: talents')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
