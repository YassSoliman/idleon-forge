// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-24: Arcade balls stop accruing once the time since the last claim passes the max claim time
// (`timeAway.Arcade` + Toolbox getMaxClaimTime: 48 h plus up to 10 h from stamps). An account-level
// Check, from W2-early. It fires when the cap falls before the return or has passed; claiming now
// holds when the max claim time covers the stretch.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const WORLD = 2;

// The W3-early account, claimed `hoursAgo` before the save instead.
const claimed = (s: AccountState, hoursAgo: number): AccountState => {
  const afk = s.account.afk;
  if (!afk?.arcade) return s;
  const lastClaimAt = (s.account.lastCloudSave ?? s.asOf) - hoursAgo * 3.6e6;
  return withAccount(s, { afk: { ...afk, arcade: { ...afk.arcade, lastClaimAt } } });
};

export default defineDetector({
  id: 'arcade/balls-cap',
  kind: 'check',
  system: 'arcade',
  params: z.strictObject({}),
  slots: z.strictObject({ capsIn: z.number(), fullFor: z.number() }).partial(),
  reads: ['account.afk', 'account.currentWorld', 'account.lastCloudSave', 'diagnostics'],
  examples: {
    // US-6: the W2-late account, 96.3 h since the last claim against a 48 h cap.
    fires: [{ fixture: 'scrubbed-w2', subject: accountSubject }],
    // A claim an hour before the save caps 47 h later, after an 8 h return.
    silent: [{ fixture: 'scrubbed-w3', subject: accountSubject, mutate: (s) => claimed(s, 1) }],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withUnknown(s, 'account.afk.arcade') }],
  },
  run({ state, now, expectedReturnMs }) {
    if (!isKnown(state, 'account.currentWorld') || (state.account.currentWorld ?? 0) < WORLD) return [];
    const subject = accountSubject;
    const arcade = state.account.afk?.arcade;
    if (!isKnown(state, 'account.afk.arcade') || !arcade)
      return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    const returnAt = now + expectedReturnMs;
    const at = arcade.lastClaimAt + arcade.maxClaimMs;
    if (at >= returnAt) return [{ subject, slots: {}, result: 'pass' as const, nextAt: at }];
    const fixHolds = arcade.maxClaimMs >= returnAt - now;
    return [
      {
        subject,
        slots: { capsIn: Math.max(0, at - now), fullFor: Math.max(0, now - at) },
        result: 'fires' as const,
        at,
        fixHolds,
        ...(fixHolds || at <= now ? {} : { demotedBecause: 'fix-does-not-hold' as const }),
      },
    ];
  },
});
