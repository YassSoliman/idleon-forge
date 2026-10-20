// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: the Pen Pals highscore (OLA[99]); a Trapping bonus opens at every 25, up to 225 (Toolbox
// character.ts, randomList[59]).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/pen-pals',
  kind: 'progress',
  system: 'minigames',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['account.minigames', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'first', expect: { value: 118 } },
      { fixture: 'highend', expect: { value: 183 } },
    ],
    silent: [],
    unknown: [{ fixture: 'first', mutate: (s) => withAccount(s, { minigames: null }) }],
  },
  run({ state }) {
    const mg = state.account.minigames;
    if (!isKnown(state, 'account.minigames') || mg == null)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    return [{ subject: accountSubject, slots: {}, value: mg.penPals ?? 0 }];
  },
});
