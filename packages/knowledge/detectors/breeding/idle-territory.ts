// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-13: a territory is won (its spice found) but no team forages it, so it makes no spice. One
// finding for the lowest such territory (the account's first gap); the page lists the rest.
import { z } from 'zod';
import { accountSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'breeding/idle-territory',
  kind: 'check',
  system: 'breeding',
  params: z.strictObject({}),
  slots: z.strictObject({ territory: z.string(), idle: z.number() }).partial(),
  reads: ['account.breeding', 'diagnostics'],
  examples: {
    // fourth.json: some won territories have no team.
    fires: [{ fixture: 'fourth' }],
    silent: [{ fixture: 'first' }, { fixture: 'highend' }],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.breeding') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.breeding'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const idle = (state.account.breeding?.territories ?? []).filter((t) => t.status === 'won');
    const first = idle[0];
    if (!first) return [];
    return [
      {
        subject: accountSubject,
        slots: { territory: first.name, idle: idle.length },
        result: 'fires' as const,
        doneKey: `territory-${first.index}`,
      },
    ];
  },
});
