// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-14, TR-6, D3: a Darts (or Hoops) round is available. Fires when the game is unlocked (an
// upgrade level or a best score above 0), its cooldown has run out at `now`, and no play was seen in
// this Play Session (the plays-today counter has not risen since the session's first save), so the
// prompt comes once per Play Session.
import { resetsSinceSave } from '@idleon-forge/account-state';
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'minigames/cooldown-play',
  kind: 'check',
  system: 'minigames',
  params: z.strictObject({
    game: z.enum(['darts', 'hoops']),
    // M1's Play Session rule: saves less than 15 minutes apart are one session.
    sessionGapMs: z.int().positive().default(900_000),
  }),
  slots: z.strictObject({}),
  reads: ['account.minigames', 'account.lastCloudSave', 'account.dailyResetInSeconds', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'scrubbed-w3', params: { game: 'darts' } },
      { fixture: 'scrubbed-w3', params: { game: 'hoops' } },
    ],
    silent: [
      {
        fixture: 'scrubbed-w3',
        params: { game: 'darts' },
        mutate: (s) =>
          withAccount(s, {
            minigames: s.account.minigames && {
              ...s.account.minigames,
              darts: { ...s.account.minigames.darts, levels: [0, 0, 0, 0], bestScore: 0 },
            },
          }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { game: 'darts' },
        mutate: (s) => withAccount(s, { minigames: null }),
      },
    ],
  },
  run({ state, now, history }, { game, sessionGapMs }) {
    const mg = state.account.minigames;
    const saved = state.account.lastCloudSave;
    if (!isKnown(state, 'account.minigames') || mg == null || saved == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const g = mg[game];
    if (!(g.levels.some((l) => l > 0) || g.bestScore > 0)) return [];
    const elapsed = Math.max(0, now - saved);
    const resets = resetsSinceSave(state, now) ?? 0;
    const remainingMs = resets >= 1 ? 0 : g.cooldownSecondsAtSave * 1000 - elapsed;
    if (remainingMs > 0)
      return [
        { subject: accountSubject, slots: {}, result: 'pass' as const, nextChangeAt: now + remainingMs },
      ];
    // The Play Session: the run of earlier saves ending at this one with no gap of sessionGapMs or more.
    let start = g.playsToday;
    let t = saved;
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (!h || t - h.lastCloudSave >= sessionGapMs) break;
      const prev = h.state.account.minigames?.[game].playsToday;
      if (typeof prev === 'number') start = prev;
      t = h.lastCloudSave;
    }
    if (g.playsToday > start) return [];
    return [
      {
        subject: accountSubject,
        slots: {},
        result: 'fires' as const,
        urgency: 'lost-before-return' as const,
        doneKey: `${game}-play`,
      },
    ];
  },
});
