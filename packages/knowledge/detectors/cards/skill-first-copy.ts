// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 `cards.contribution.skill`: a skiller on a resource whose card the account has never found
// can drop the first copy. Yes or no only (FR-6): Toolbox computes no resources per hour, so there is
// no ETA for a skilling card.
import { z } from 'zod';
import {
  characterSubject,
  GATHERING,
  isKnown,
  PURPOSE_ENGINE_SLOTS,
  purposeGoal,
  purposeGoalParam,
  valueStr,
  withAccount,
  withUnknown,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

const DROPS = 'cards.fact.drops';

export default defineDetector({
  id: 'cards/skill-first-copy',
  kind: 'contribution',
  system: 'cards',
  params: z.strictObject({ ...purposeGoalParam }),
  slots: z
    .strictObject({ saved: z.number(), rule: z.number(), target: z.string(), ...PURPOSE_ENGINE_SLOTS })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].targetMonster',
    'account.cards',
    'diagnostics',
  ],
  examples: {
    // W2-late Squire Lv 43 mines Copper; the account owns 5 Copper cards, so only a mutation fires it.
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { goal: 'cards.goal.copper' },
        mutate: (s) => {
          const cards = { ...(s.account.cards ?? {}) };
          delete cards.Copper;
          return withAccount(s, { cards });
        },
      },
    ],
    silent: [{ fixture: 'scrubbed-w2', subject: characterSubject(1), params: { goal: 'cards.goal.copper' } }],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        params: { goal: 'cards.goal.copper' },
        mutate: (s) => withUnknown(s, 'account.cards'),
      },
    ],
  },
  run(ctx, { goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const card = valueStr(g, 'card');
    if (card === null) return [];
    const drop = (ctx.facts.get(DROPS) as { rows?: Record<string, { monster: string | null }> } | undefined)
      ?.rows?.[card];
    const node = drop?.monster ?? card;
    const on = state.characters.filter(
      (c) => (GATHERING as readonly string[]).includes(c.afkType ?? '') && c.targetMonster === node,
    );
    if (on.length === 0) return [];
    const cards = state.account.cards;
    if (!isKnown(state, 'account.cards') || !cards)
      return on.map((c) => ({ subject: characterSubject(c.index), slots: {}, advances: 'unknown' as const }));
    const amount = cards[card]?.amount ?? 0;
    return on.map((c) => ({
      subject: characterSubject(c.index),
      slots: { saved: amount, rule: amount === 0 ? 1 : 0, target: c.afkTarget ?? '' },
      advances: amount === 0 ? ('yes' as const) : ('no' as const),
    }));
  },
});
