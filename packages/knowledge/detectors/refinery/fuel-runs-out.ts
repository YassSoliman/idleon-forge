// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-26: an active salt's materials run out before the return (Toolbox getSaltMatsTimeLeft hours).
// An account-level Next Action, from W3-early: more fuel means farming or printing, not a quick fix.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const WORLD = 3;

const dryIn = (s: AccountState, ms: number): AccountState => {
  const afk = s.account.afk;
  if (!afk?.salts) return s;
  return withAccount(s, { afk: { ...afk, salts: afk.salts.map((x) => ({ ...x, dryAt: s.asOf + ms })) } });
};

export default defineDetector({
  id: 'refinery/fuel-runs-out',
  kind: 'check',
  system: 'refinery',
  params: z.strictObject({}),
  slots: z.strictObject({ dryIn: z.number() }).partial(),
  reads: ['account.afk', 'account.currentWorld', 'diagnostics'],
  examples: {
    // US-6: the W3-early active salt has about 40 h of fuel; here, 3 h.
    fires: [{ fixture: 'scrubbed-w3', subject: accountSubject, mutate: (s) => dryIn(s, 1.08e7) }],
    silent: [{ fixture: 'scrubbed-w3', subject: accountSubject }, { fixture: 'scrubbed-w2' }],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withUnknown(s, 'account.afk.salts') }],
  },
  run({ state, now, expectedReturnMs }) {
    if (!isKnown(state, 'account.currentWorld') || (state.account.currentWorld ?? 0) < WORLD) return [];
    const subject = accountSubject;
    const salts = state.account.afk?.salts;
    if (!isKnown(state, 'account.afk.salts') || !salts)
      return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    if (salts.length === 0) return [];
    const at = Math.min(...salts.map((x) => x.dryAt));
    if (at >= now + expectedReturnMs) return [{ subject, slots: {}, result: 'pass' as const }];
    return [
      {
        subject,
        slots: { dryIn: Math.max(0, at - now) },
        result: 'fires' as const,
        at,
        fixHolds: false,
        demotedBecause: 'not-quick' as const,
      },
    ];
  },
});
