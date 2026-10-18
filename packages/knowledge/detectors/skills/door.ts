// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 the skills door Contribution: a miner or fisher below the skill's next level door is working
// toward it (D6, the Copper lesson: skilling is judged on its Goals, never on EXP). Yes or no (FR-6):
// the level and the door it opens, never an ETA.
import { z } from 'zod';
import {
  characterSubject,
  isKnown,
  PURPOSE_ENGINE_SLOTS,
  purposeGoal,
  purposeGoalParam,
  SKILL_OF_AFK,
  withCharacter,
  withUnknown,
} from '../../src/helpers';
import { type ContributionFinding, defineDetector } from '../../src/types';

const MAPS = 'maps.fact.maps';

export default defineDetector({
  id: 'skills/door',
  kind: 'contribution',
  system: 'skills',
  params: z.strictObject({ afkType: z.enum(['MINING', 'FISHING']), ...purposeGoalParam }),
  slots: z
    .strictObject({
      saved: z.number(),
      rule: z.number(),
      destination: z.string(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: ['characters[*].index', 'characters[*].afkType', 'characters[*].skillLevels', 'diagnostics'],
  examples: {
    // W2-late Squire Lv 43, Mining 20: the next door is at 25 (M4 US-4).
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING', goal: 'skills.goal.door-mining' },
        expect: { slots: { saved: 20, destination: "The_Ol'_Straightaway" } },
      },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING', goal: 'skills.goal.door-mining' },
        mutate: (s) =>
          withCharacter(s, 1, {
            skillLevels: { ...(s.characters[1]?.skillLevels ?? {}), mining: 70 },
          }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING', goal: 'skills.goal.door-mining' },
        mutate: (s) => withUnknown(s, 'characters[1].skillLevels'),
      },
    ],
  },
  run(ctx, { afkType, goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const skill = SKILL_OF_AFK[afkType] as string;
    const doors = [...(g?.milestones ?? [])].sort((a, b) => a.at - b.at);
    if (doors.length === 0) return [];
    // The map each door opens, by the door's level (generated `data.doors`), named as the map table does.
    const opens = Array.isArray(g?.data?.doors) ? (g.data.doors as { level: number; to: number }[]) : [];
    const maps =
      (ctx.facts.get(MAPS) as { rows?: { index: number; name: string }[] } | undefined)?.rows ?? [];
    const nameOf = (level: number) =>
      opens
        .filter((d) => d.level === level)
        .map((d) => maps.find((m) => m.index === d.to)?.name)
        .filter((n): n is string => !!n)
        .join(' and ');
    return state.characters.flatMap((c): ContributionFinding[] => {
      if (c.afkType !== afkType) return [];
      const subject = characterSubject(c.index);
      const level = c.skillLevels?.[skill];
      if (!isKnown(state, `characters[${c.index}].skillLevels`) || level === undefined)
        return [{ subject, slots: {}, advances: 'unknown' as const }];
      const next = doors.find((d) => d.at > level);
      const slots = { saved: level, rule: next ? 1 : 0, destination: next ? nameOf(next.at) : '' };
      return [{ subject, slots, advances: next ? ('yes' as const) : ('no' as const) }];
    });
  },
});
