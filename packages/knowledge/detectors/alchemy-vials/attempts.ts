// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-9, TR-6, D5: unused vial attempts. Fires while attempts are left and a level-0 vial's
// ingredient is held (Toolbox's vialsAttempts alert rule). After a daily reset since the save the
// attempts are counted as refilled. Urgency comes from the reset: lost before the player is back, or
// banked (position 3) when the reset falls after the return.
import { dailyResetAfter, resetsSinceSave } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'alchemy-vials/attempts',
  kind: 'check',
  system: 'alchemy-vials',
  params: z.strictObject({}),
  slots: z.strictObject({ attempts: z.number() }).partial(),
  reads: ['account.alchemy', 'account.lastCloudSave', 'account.dailyResetInSeconds', 'diagnostics'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { slots: { attempts: 11 } } }],
    silent: [
      // W3-early: 0 of 17 left.
      { fixture: 'scrubbed-w3' },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { alchemy: null }) }],
  },
  run({ state, now, expectedReturnMs }) {
    const alchemy = state.account.alchemy;
    const resets = resetsSinceSave(state, now);
    const reset = dailyResetAfter(state, now);
    if (!isKnown(state, 'account.alchemy') || alchemy == null || resets == null || reset == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const { current, max } = alchemy.vialAttempts;
    const attempts = resets >= 1 ? max : current;
    if (attempts <= 0 || !alchemy.vialAttemptsUsable) return [];
    const lost = reset < now + expectedReturnMs;
    return [
      {
        subject: accountSubject,
        slots: { attempts },
        result: 'fires' as const,
        urgency: lost ? ('lost-before-return' as const) : ('banked' as const),
        deadline: reset,
        doneKey: 'vial-attempts',
        nextChangeAt: reset,
      },
    ];
  },
});
