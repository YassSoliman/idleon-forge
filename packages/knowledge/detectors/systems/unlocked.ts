// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Milestone (M26 FR-6): `system` is unlocked on this account, by its own unlock fact (`src/unlock.ts`),
// with `currentWorld` only as the fallback when the fact is null. The registry uses it for every System
// with an own unlock rule; the engine core silences that System's Goals while it reads 'no'.
import { z } from 'zod';
import { accountSubject, UNLOCK_RULES, unlocked, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'systems/unlocked',
  kind: 'milestone',
  system: 'systems',
  params: z.strictObject({ system: z.string().refine((s) => Object.hasOwn(UNLOCK_RULES, s)) }),
  slots: z.strictObject({}),
  reads: [
    'account.lab',
    'account.breeding',
    'account.cooking',
    'account.equinoxUnlocked',
    'account.currentWorld',
    'diagnostics',
  ],
  examples: {
    fires: [
      { fixture: 'highend', params: { system: 'lab' }, subject: accountSubject },
      { fixture: 'first', params: { system: 'breeding' } },
      { fixture: 'fourth', params: { system: 'equinox' } },
    ],
    silent: [
      // W3, but no Mirror and no Dream Upgrade (M26 FR-8): Equinox stays locked though currentWorld is 3.
      { fixture: 'scrubbed-w3', params: { system: 'equinox' } },
      { fixture: 'scrubbed-w2', params: { system: 'lab' } },
      { fixture: 'scrubbed-w3', params: { system: 'cooking' } },
      { fixture: 'scrubbed-w3', params: { system: 'breeding' } },
      { fixture: 'scrubbed-w2', params: { system: 'equinox' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { system: 'rift' },
        mutate: (s) => withUnknown(s, 'account.currentWorld'),
      },
    ],
  },
  run({ state }, { system }) {
    return [{ subject: accountSubject, slots: {}, reached: unlocked(system, state) }];
  },
});
