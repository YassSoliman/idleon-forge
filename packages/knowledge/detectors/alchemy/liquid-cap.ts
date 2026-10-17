// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-25, RT-4: a liquid truly at cap (`current >= maxLiquid`), so its regeneration has stopped.
// An account-level Check, from W2-early, for Water only until the unlock gate of liquids 2-4 is
// verified (TR-12 item 6). At cap now it blocks under the blocker rule's already-full exception (FR-7,
// Final rulings RT-14); Toolbox has no regeneration rate, so "fills again in about X" waits for an
// observed rate (TR-6), and the before-the-cap branch is not built yet.
// Toolbox's own `liquids` alert is not used: at this pin it compares against the cauldron object, not
// maxLiquid, so it never fires, and its 90% threshold is a user setting.
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const WORLD = 2;
const WATER = 0;

const atCap = (s: AccountState): AccountState => {
  const afk = s.account.afk;
  if (!afk?.liquids) return s;
  return withAccount(s, { afk: { ...afk, liquids: afk.liquids.map((l) => ({ ...l, current: l.max })) } });
};

export default defineDetector({
  id: 'alchemy/liquid-cap',
  kind: 'check',
  system: 'alchemy',
  params: z.strictObject({}),
  slots: z.strictObject({ current: z.number(), max: z.number() }).partial(),
  reads: ['asOf', 'account.afk', 'account.currentWorld', 'diagnostics'],
  examples: {
    // US-6: the W2-late account's Water at 32/32.
    fires: [
      { fixture: 'scrubbed-w2', subject: accountSubject },
      { fixture: 'scrubbed-w3', subject: accountSubject, mutate: atCap },
    ],
    // US-6: the W3-early account's Water at 92.7/138.
    silent: [{ fixture: 'scrubbed-w3', subject: accountSubject }],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withUnknown(s, 'account.afk.liquids') }],
  },
  run({ state, now }) {
    if (!isKnown(state, 'account.currentWorld') || (state.account.currentWorld ?? 0) < WORLD) return [];
    const subject = accountSubject;
    const liquids = state.account.afk?.liquids;
    if (!isKnown(state, 'account.afk.liquids') || !liquids)
      return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    const water = liquids.find((l) => l.index === WATER);
    if (!water) return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
    if (water.current < water.max) return [{ subject, slots: {}, result: 'pass' as const }];
    return [
      {
        subject,
        slots: { current: water.current, max: water.max },
        result: 'fires' as const,
        at: Math.min(now, state.asOf),
        fixHolds: false,
      },
    ];
  },
});
