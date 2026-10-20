// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-13, US-7: the nest is full, so no egg is laid until one is hatched or trashed (game client: an
// egg is added only into a free slot). Value is lost from now on.
import { z } from 'zod';
import { accountSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'breeding/full-nest',
  kind: 'check',
  system: 'breeding',
  params: z.strictObject({}),
  slots: z.strictObject({ eggs: z.number(), capacity: z.number(), first: z.number() }).partial(),
  reads: ['account.breeding', 'diagnostics'],
  examples: {
    // highend.json: 15 of 15 eggs.
    fires: [{ fixture: 'highend', expect: { slots: { eggs: 15, capacity: 15, first: 0 } } }],
    silent: [{ fixture: 'first' }, { fixture: 'fourth' }],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.breeding') }],
  },
  run({ state, now }) {
    if (!isKnown(state, 'account.breeding'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const b = state.account.breeding;
    if (!b || b.eggCapacity <= 0 || b.eggs < b.eggCapacity) return [];
    return [
      {
        subject: accountSubject,
        slots: { eggs: b.eggs, capacity: b.eggCapacity, first: b.started === false ? 1 : 0 },
        result: 'fires' as const,
        urgency: 'losing-now' as const,
        at: now,
        doneKey: 'breeding-nest',
      },
    ];
  },
});
