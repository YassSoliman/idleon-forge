// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Milestone: the account has reached world `world` (it is the current world or a finished one). The
// System registry uses it as the first-cut `unlocked` rule for world Systems (TR-9) until a System's
// own module ships a sharper unlock Detector.
import { z } from 'zod';
import { accountSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'worlds/reached',
  kind: 'milestone',
  system: 'worlds',
  params: z.strictObject({ world: z.int().min(1).max(8) }),
  slots: z.strictObject({}),
  reads: ['account.currentWorld', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'scrubbed-w2', params: { world: 2 }, subject: accountSubject },
      { fixture: 'highend', params: { world: 4 } },
    ],
    silent: [
      { fixture: 'scrubbed-w2', params: { world: 3 } },
      { fixture: 'scrubbed-w3', params: { world: 4 } },
    ],
    unknown: [
      { fixture: 'highend', params: { world: 2 }, mutate: (s) => withUnknown(s, 'account.currentWorld') },
    ],
  },
  run({ state }, { world }) {
    if (!isKnown(state, 'account.currentWorld') || state.account.currentWorld === null)
      return [{ subject: accountSubject, slots: {}, reached: 'unknown' as const }];
    return [
      {
        subject: accountSubject,
        slots: {},
        reached: state.account.currentWorld >= world ? ('yes' as const) : ('no' as const),
      },
    ];
  },
});
