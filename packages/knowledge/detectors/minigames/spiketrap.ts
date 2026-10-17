// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-11, TR-6: Spiketrap Surprise daily gems. Fires when today's gems are unclaimed (OLA[7] == 1,
// counted as set again after a daily reset since the save) and the next round, at the top of the hour,
// starts within `windowMinutes`. It stops firing when the window closes; that is not "done".
import { resetsSinceSave } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const HOUR_MS = 3_600_000;

export default defineDetector({
  id: 'minigames/spiketrap',
  kind: 'check',
  system: 'minigames',
  params: z.strictObject({
    windowMinutes: z.int().positive().max(59).default(20),
    // Authored from the minigames dossier: the most gems one day's Spiketrap round can give.
    maxGems: z.int().positive().default(40),
  }),
  slots: z.strictObject({ gems: z.number(), minutes: z.number() }).partial(),
  reads: ['account.minigames', 'account.lastCloudSave', 'account.dailyResetInSeconds', 'diagnostics'],
  examples: {
    // W2-late at its save: 13 minutes to the hour, gems unclaimed.
    fires: [{ fixture: 'scrubbed-w2', expect: { slots: { gems: 40, minutes: 13 } } }],
    // W3-early at the fixture's now (8.5 h after its save): 47 minutes to the hour, outside the window.
    silent: [{ fixture: 'scrubbed-w3' }],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { minigames: null }) }],
  },
  run({ state, now }, { windowMinutes, maxGems }) {
    const mg = state.account.minigames;
    if (!isKnown(state, 'account.minigames') || mg == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const available = mg.spiketrap.gemsAvailableToday || (resetsSinceSave(state, now) ?? 0) >= 1;
    if (!available) return [];
    const topOfHour = (Math.floor(now / HOUR_MS) + 1) * HOUR_MS;
    const windowStart = topOfHour - windowMinutes * 60_000;
    if (now < windowStart)
      return [{ subject: accountSubject, slots: {}, result: 'pass' as const, nextChangeAt: windowStart }];
    return [
      {
        subject: accountSubject,
        slots: { gems: maxGems, minutes: Math.round((topOfHour - now) / 60_000) },
        result: 'fires' as const,
        urgency: 'lost-before-return' as const,
        deadline: topOfHour,
        doneKey: 'spiketrap',
        nextChangeAt: topOfHour,
      },
    ];
  },
});
