// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-10, TR-4, TR-6, D4: today's skill-minigame plays, only when they would be lost (the daily
// reset falls before the return) and an open highscore Milestone exists. The Milestones are authored
// and checked in order (TR-4): Choppin 20 for Funguy's quest if no character has done it, then the
// next multiple of 25 in Choppin when a Mage-line character exists. The other TR-4 Milestones (the
// Barbarian Bobbin' Bobbers cap, Goldric's Hoopsies, the Mining yellow-vein achievement) need fields
// the Account State does not carry yet and are not checked.
import { dailyResetAfter } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/daily-plays',
  kind: 'check',
  system: 'minigames',
  params: z.strictObject({
    funguyChoppinScore: z.int().positive().default(20),
    mageChoppinStep: z.int().positive().default(25),
    /** Mage-line classes (Toolbox class names). */
    mageLine: z
      .array(z.string())
      .default(['Mage', 'Wizard', 'Shaman', 'Elemental_Sorcerer', 'Bubonic_Conjuror', 'Arcane_Cultist']),
  }),
  slots: z.strictObject({ plays: z.number(), choppinTarget: z.number() }).partial(),
  reads: [
    'account.minigames',
    'account.lastCloudSave',
    'account.dailyResetInSeconds',
    'characters[*].class',
    'characters[*].index',
    'diagnostics',
  ],
  examples: {
    // W3-early at the fixture's now (8.5 h after the save): the reset is 4 h away, before the return.
    fires: [{ fixture: 'scrubbed-w3', expect: { slots: { plays: 4, choppinTarget: 125 } } }],
    // W2-late at its save: the reset is about 23 h 43 m away, after the return.
    silent: [{ fixture: 'scrubbed-w2' }],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withAccount(s, { minigames: null }) }],
  },
  run({ state, now, expectedReturnMs }, { funguyChoppinScore, mageChoppinStep, mageLine }) {
    const mg = state.account.minigames;
    const reset = dailyResetAfter(state, now);
    if (!isKnown(state, 'account.minigames') || mg == null || reset == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (mg.plays <= 0 || reset >= now + expectedReturnMs)
      return [{ subject: accountSubject, slots: {}, result: 'pass' as const, nextChangeAt: reset }];
    const choppin = mg.highscores.choppin;
    let target: number | null = null;
    if (!mg.funguyChoppinDone && choppin < funguyChoppinScore) target = funguyChoppinScore;
    else if (state.characters.some((c) => mageLine.includes(c.class)))
      target = (Math.floor(choppin / mageChoppinStep) + 1) * mageChoppinStep;
    if (target == null) return [];
    return [
      {
        subject: accountSubject,
        slots: { plays: mg.plays, choppinTarget: target },
        result: 'fires' as const,
        urgency: 'lost-before-return' as const,
        deadline: reset,
        doneKey: 'minigame-plays',
        nextChangeAt: reset,
      },
    ];
  },
});
