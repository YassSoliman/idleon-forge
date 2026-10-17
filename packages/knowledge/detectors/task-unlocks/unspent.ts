// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-20, TR-6: task unlock points owned but not spent, while an open Unlocks column has a row left.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'task-unlocks/unspent',
  kind: 'check',
  system: 'task-unlocks',
  params: z.strictObject({}),
  slots: z.strictObject({ points: z.number() }).partial(),
  reads: ['account.taskUnlocks', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'scrubbed-w2', expect: { slots: { points: 2 } } },
      { fixture: 'scrubbed-w3', expect: { slots: { points: 10 } } },
    ],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) =>
          withAccount(s, { taskUnlocks: s.account.taskUnlocks && { ...s.account.taskUnlocks, bought: 9 } }),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { taskUnlocks: null }) }],
  },
  run({ state }) {
    const tu = state.account.taskUnlocks;
    if (!isKnown(state, 'account.taskUnlocks') || tu === null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const points = tu.owned - tu.bought;
    if (points <= 0 || tu.openUnbought <= 0) return [];
    return [
      {
        subject: accountSubject,
        slots: { points },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: 'task-unlocks',
      },
    ];
  },
});
