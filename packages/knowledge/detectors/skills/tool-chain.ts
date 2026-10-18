// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 the skills tool Contribution: a skiller gathering an ingredient of the next tool its skill
// level allows, while it doesn't hold that tool yet, is working toward the tool. Yes or no (FR-6). The
// next tool is the first one past the best tool equipped whose level the skill already meets.
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

const NODES = 'skills.fact.nodes';

interface Tool {
  level: number;
  rawName: string;
  name: string;
  materials: { rawName: string; quantity: number }[];
}

export default defineDetector({
  id: 'skills/tool-chain',
  kind: 'contribution',
  system: 'skills',
  params: z.strictObject({
    afkType: z.enum(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']),
    ...purposeGoalParam,
  }),
  slots: z
    .strictObject({
      saved: z.number(),
      rule: z.number(),
      target: z.string(),
      tool: z.string(),
      need: z.number(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].targetMonster',
    'characters[*].skillLevels',
    'characters[*].tools',
    'diagnostics',
  ],
  examples: {
    // W2-late Squire Lv 43 mines Copper with a Copper Pickaxe at Mining 20: the next pickaxe needs Iron.
    // Without a pickaxe, Copper is the Copper Pickaxe's ingredient.
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING', goal: 'skills.goal.tool-mining' },
        mutate: (s) => withCharacter(s, 1, { tools: [] }),
        expect: { slots: { tool: 'Copper_Pickaxe' } },
      },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING', goal: 'skills.goal.tool-mining' },
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { afkType: 'MINING', goal: 'skills.goal.tool-mining' },
        mutate: (s) => withUnknown(s, 'characters[1].tools'),
      },
    ],
  },
  run(ctx, { afkType, goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const tools = (Array.isArray(g?.data?.tools) ? (g.data.tools as Tool[]) : [])
      .filter((t) => typeof t.level === 'number' && typeof t.rawName === 'string')
      .sort((a, b) => a.level - b.level);
    if (tools.length === 0) return [];
    const skill = SKILL_OF_AFK[afkType] as string;
    const nodes =
      (ctx.facts.get(NODES) as { rows?: { target: string; item: string }[] } | undefined)?.rows ?? [];
    return state.characters.flatMap((c): ContributionFinding[] => {
      if (c.afkType !== afkType || !c.targetMonster) return [];
      const subject = characterSubject(c.index);
      const level = c.skillLevels?.[skill];
      if (
        !isKnown(state, `characters[${c.index}].skillLevels`) ||
        !isKnown(state, `characters[${c.index}].tools`) ||
        level === undefined ||
        !c.tools
      )
        return [{ subject, slots: {}, advances: 'unknown' as const }];
      const item = nodes.find((n) => n.target === c.targetMonster)?.item ?? c.targetMonster;
      const best = Math.max(-1, ...tools.map((t, i) => (c.tools?.includes(t.rawName) ? i : -1)));
      const next = tools.slice(best + 1).find((t) => t.level <= level);
      const need = next?.materials.find((m) => m.rawName === item)?.quantity;
      const slots = {
        saved: level,
        rule: need ? 1 : 0,
        target: c.afkTarget ?? '',
        tool: next?.name.replace(/ /g, '_') ?? '',
        need: need ?? 0,
      };
      return [{ subject, slots, advances: need ? ('yes' as const) : ('no' as const) }];
    });
  },
});
