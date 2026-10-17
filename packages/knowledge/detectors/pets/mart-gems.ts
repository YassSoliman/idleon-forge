// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-13, TR-6: today's free Pet Mart gems. It runs only when `petMart.unlocked` is true; the adapter
// sets it since Yasser confirmed the Pet Mart reachable in game (M6 Final rulings, #34).
// The game's own rule: the server offers them, the shop day is at least 1, and today's are not
// claimed (N.js, Toolbox petMartGems). After a daily reset since the save they are offered again.
import { dailyResetAfter, resetsSinceSave } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'pets/mart-gems',
  kind: 'check',
  system: 'pets',
  params: z.strictObject({}),
  slots: z.strictObject({ shopDay: z.number() }).partial(),
  reads: ['account.petMart', 'account.lastCloudSave', 'account.dailyResetInSeconds', 'diagnostics'],
  examples: {
    // The W2-late account: shop day 241, never claimed.
    fires: [{ fixture: 'scrubbed-w2', expect: { slots: { shopDay: 241 } } }],
    // A closed gate stays silent.
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) =>
          withAccount(s, { petMart: s.account.petMart && { ...s.account.petMart, unlocked: false } }),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { petMart: null }) }],
  },
  run({ state, now, expectedReturnMs }) {
    const pm = state.account.petMart;
    if (!isKnown(state, 'account.petMart') || pm == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (!pm.unlocked) return [];
    const resets = resetsSinceSave(state, now);
    const reset = dailyResetAfter(state, now);
    if (resets == null || reset == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const claimable =
      pm.gemsOffered && pm.currentShopDay >= 1 && (resets >= 1 || pm.lastClaimedShopDay < pm.currentShopDay);
    if (!claimable) return [];
    return [
      {
        subject: accountSubject,
        slots: { shopDay: pm.currentShopDay },
        result: 'fires' as const,
        urgency: reset < now + expectedReturnMs ? ('lost-before-return' as const) : ('banked' as const),
        deadline: reset,
        doneKey: 'pet-mart-gems',
        nextChangeAt: reset,
      },
    ];
  },
});
