// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16: the Tome is past 4,000 PTS and the Blue Tome Pages aren't bought (`accountOptions[196]`), so
// the Skill Efficiency the Tome pays above 4,000 PTS (Toolbox `getTomeBonus` index 1) is off.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'tome/blue-pages',
  kind: 'check',
  system: 'tome',
  params: z.strictObject({ from: z.number().default(4000) }),
  slots: z.strictObject({ points: z.number(), over: z.number(), from: z.number() }).partial(),
  reads: ['account.tome', 'diagnostics'],
  examples: {
    fires: [
      {
        fixture: 'first',
        mutate: (s) =>
          s.account.tome ? withAccount(s, { tome: { ...s.account.tome, totalPoints: 4500 } }) : s,
        expect: { slots: { points: 4500, over: 500 } },
      },
    ],
    // first.json is under 4,000 PTS; highend.json has the pages.
    silent: [{ fixture: 'first' }, { fixture: 'highend' }],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.tome') }],
  },
  run({ state }, { from }) {
    if (!isKnown(state, 'account.tome'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const t = state.account.tome;
    if (!t || t.pages.blue || t.totalPoints < from) return [];
    return [
      {
        subject: accountSubject,
        slots: { points: t.totalPoints, over: t.totalPoints - from, from },
        result: 'fires' as const,
        doneKey: 'tome-blue-pages',
      },
    ];
  },
});
