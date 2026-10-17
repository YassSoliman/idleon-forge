// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-15, TR-6: unspent Darts or Hoops points. An upgrade is unlocked once the total levels reach its
// threshold (the adapter applies Toolbox's thresholds; never Toolbox's `unlocked`, which reads level >
// 0). Darts fires when the points cover the cheapest unlocked upgrade's Toolbox cost. Toolbox prices
// Hoops with the Darts formula, which understates the real cost (M6 R1), so Hoops fires as a stock
// line only, with no cost and no "spend" claim.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/cooldown-spend',
  kind: 'check',
  system: 'minigames',
  params: z.strictObject({ game: z.enum(['darts', 'hoops']) }),
  slots: z.strictObject({ points: z.number(), cost: z.number() }).partial(),
  reads: ['account.minigames', 'diagnostics'],
  examples: {
    fires: [
      // W2-late: 29 Darts points, DMG (unlocked at 0 total levels) costs 2; 7 Hoops points.
      { fixture: 'scrubbed-w2', params: { game: 'darts' }, expect: { slots: { points: 29, cost: 2 } } },
      { fixture: 'scrubbed-w2', params: { game: 'hoops' }, expect: { slots: { points: 7 } } },
    ],
    silent: [
      // W3-early: 2 Darts points against a next cost of 5; 0 Hoops points.
      { fixture: 'scrubbed-w3', params: { game: 'darts' } },
      { fixture: 'scrubbed-w3', params: { game: 'hoops' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { game: 'hoops' },
        mutate: (s) => withAccount(s, { minigames: null }),
      },
    ],
  },
  run({ state }, { game }) {
    const mg = state.account.minigames;
    if (!isKnown(state, 'account.minigames') || mg == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const g = mg[game];
    if (game === 'hoops') {
      if (g.points <= 0) return [];
      return [
        {
          subject: accountSubject,
          slots: { points: g.points },
          result: 'fires' as const,
          urgency: 'banked' as const,
          doneKey: 'hoops-points',
        },
      ];
    }
    const costs = g.nextCosts.filter((c): c is number => c != null);
    if (costs.length === 0) return [];
    const cost = Math.min(...costs);
    if (g.points < cost) return [];
    return [
      {
        subject: accountSubject,
        slots: { points: g.points, cost },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: 'darts-points',
      },
    ];
  },
});
