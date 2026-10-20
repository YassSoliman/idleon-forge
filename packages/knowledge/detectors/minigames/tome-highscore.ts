// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: the Tome's "Total Minigame Highscore": Choppin, Fishing, Catching, Mining and Pen Pals added up
// (Toolbox calcMinigameTotalScore, the first five minigameHighscores; Poing, Hoops, Darts and Spiketrap don't count).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/tome-highscore',
  kind: 'progress',
  system: 'minigames',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['account.minigames', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'first', expect: { value: 350 } },
      { fixture: 'fourth', expect: { value: 3877 } },
    ],
    silent: [],
    unknown: [{ fixture: 'first', mutate: (s) => withAccount(s, { minigames: null }) }],
  },
  run({ state }) {
    const mg = state.account.minigames;
    if (!isKnown(state, 'account.minigames') || mg == null)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    return [
      {
        subject: accountSubject,
        slots: {},
        value:
          mg.highscores.choppin +
          mg.highscores.fishing +
          mg.highscores.catching +
          mg.highscores.mining +
          (mg.penPals ?? 0),
      },
    ];
  },
});
