// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-10, TR-4, TR-6, D4: today's skill-minigame plays, only when they would be lost (the daily
// reset falls before the return) and an open highscore Milestone exists. The Milestones are authored
// and checked in order (TR-4): Choppin 20 for Funguy's quest if no character has done it, then the
// next multiple of 25 in Choppin when some character has put a point in Choppin It Up EZ (talent 463,
// +Total damage per step of Choppin score; M26 FR-8: a Mage-line class alone gets nothing from the step). The other TR-4 Milestones (the
// Barbarian Bobbin' Bobbers cap, Goldric's Hoopsies, the Mining yellow-vein achievement) need fields
// the Account State does not carry yet and are not checked.
import { type CharacterState, dailyResetAfter } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

/** A point bought in `id` in either preset (`base` > 0; the max alone, from books, is not a point). */
const hasTalent = (t: CharacterState['talents'], id: number): boolean =>
  [t?.active, t?.other].some((p) =>
    p?.tabs.some((tab) => tab.talents.some((x) => x.id === id && x.base > 0)),
  );

/** The talents with every bought point removed (the silent example: nobody has Choppin It Up EZ). */
const noPoints = (t: CharacterState['talents']): CharacterState['talents'] => {
  if (!t) return t;
  const strip = (p: NonNullable<typeof t.other>) => ({
    ...p,
    tabs: p.tabs.map((tab) => ({
      ...tab,
      talents: tab.talents.map((x) => ({ ...x, base: 0 })),
    })),
  });
  return { ...t, active: strip(t.active), other: t.other && strip(t.other) };
};

export default defineDetector({
  id: 'minigames/daily-plays',
  kind: 'check',
  system: 'minigames',
  params: z.strictObject({
    funguyChoppinScore: z.int().positive().default(20),
    mageChoppinStep: z.int().positive().default(25),
    /** Choppin It Up EZ (Toolbox talentId): the talent the Choppin step Milestone pays into (M26 FR-8). */
    choppinTalent: z.int().nonnegative().default(463),
  }),
  slots: z.strictObject({ plays: z.number(), choppinTarget: z.number() }).partial(),
  reads: [
    'account.minigames',
    'account.lastCloudSave',
    'account.dailyResetInSeconds',
    'characters[*].talents',
    'characters[*].index',
    'diagnostics',
  ],
  examples: {
    // W3-early at the fixture's now (8.5 h after the save): the reset is 4 h away, before the return.
    fires: [{ fixture: 'scrubbed-w3', expect: { slots: { plays: 4, choppinTarget: 125 } } }],
    // W2-late at its save: the reset is about 23 h 43 m away, after the return.
    silent: [
      { fixture: 'scrubbed-w2' },
      // M26 FR-8: Mage-line characters, but nobody with a point in Choppin It Up EZ: no Choppin step.
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => ({
          ...s,
          account: {
            ...s.account,
            minigames: s.account.minigames && { ...s.account.minigames, funguyChoppinDone: true },
          },
          characters: s.characters.map((c) => ({ ...c, talents: noPoints(c.talents) })),
        }),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withAccount(s, { minigames: null }) }],
  },
  run({ state, now, expectedReturnMs }, { funguyChoppinScore, mageChoppinStep, choppinTalent }) {
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
    else if (state.characters.some((c) => hasTalent(c.talents, choppinTalent)))
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
