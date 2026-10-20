// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: the best Spiketrap Surprise round (OLA[201]); the Tome's row pays in full at round 13.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/spiketrap-round',
  kind: 'progress',
  system: 'minigames',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['account.minigames', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'first', expect: { value: 2 } },
      { fixture: 'highend', expect: { value: 127 } },
    ],
    silent: [],
    unknown: [{ fixture: 'first', mutate: (s) => withAccount(s, { minigames: null }) }],
  },
  run({ state }) {
    const mg = state.account.minigames;
    if (!isKnown(state, 'account.minigames') || mg == null)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    return [{ subject: accountSubject, slots: {}, value: mg.spiketrap.bestRound }];
  },
});
