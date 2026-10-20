// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-16: Tome nametags waiting to be claimed this month (Toolbox `nametagClaim`: one per rank tier
// reached, Top 50% to Top 0.1%, less those claimed since the monthly reset).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'tome/nametags',
  kind: 'check',
  system: 'tome',
  params: z.strictObject({}),
  slots: z.strictObject({ available: z.number() }).partial(),
  reads: ['account.tome', 'diagnostics'],
  examples: {
    fires: [
      {
        fixture: 'highend',
        mutate: (s) =>
          s.account.tome
            ? withAccount(s, { tome: { ...s.account.tome, nametags: { available: 2, claimed: 5 } } })
            : s,
        expect: { slots: { available: 2 } },
      },
    ],
    silent: [{ fixture: 'highend' }, { fixture: 'first' }],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.tome') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.tome'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const t = state.account.tome;
    if (!t || t.nametags.available <= 0) return [];
    return [
      {
        subject: accountSubject,
        slots: { available: t.nametags.available },
        result: 'fires' as const,
        doneKey: `tome-nametags-${t.nametags.claimed}`,
      },
    ];
  },
});
