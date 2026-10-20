// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: Hoops and Darts upgrades open by total levels bought (Toolbox getHoopsData / getDartsData:
// Hoops 12 / 80 / 200, Darts 40 / 150 / 250); the progress is the levels bought so far.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/unlock-ladder',
  kind: 'progress',
  system: 'minigames',
  params: z.strictObject({ game: z.enum(['hoops', 'darts']) }),
  slots: z.strictObject({}),
  reads: ['account.minigames', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'first', params: { game: 'hoops' }, expect: { value: 0 } },
      { fixture: 'first', params: { game: 'darts' }, expect: { value: 0 } },
    ],
    silent: [],
    unknown: [
      { fixture: 'first', params: { game: 'hoops' }, mutate: (s) => withAccount(s, { minigames: null }) },
    ],
  },
  run({ state }, { game }) {
    const mg = state.account.minigames;
    if (!isKnown(state, 'account.minigames') || mg == null)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    return [{ subject: accountSubject, slots: {}, value: mg[game].levels.reduce((n, l) => n + l, 0) }];
  },
});
