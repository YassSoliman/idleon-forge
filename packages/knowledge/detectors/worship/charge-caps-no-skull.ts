// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-19, D2: the skull-less sibling of worship/charge-caps-skull. Without a skull the bar is small
// (50), so a capped charge is a quiet Next Action, never a blocker: blocking it would turn 4 of 6
// W3-early rows red every session over charge the account isn't using yet. Same arithmetic: Toolbox's
// getPlayerWorship charge, max and rate; gated on World 2 finished.
import { z } from 'zod';
import { characterSubject, isKnown, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

const HOUR = 3.6e6;
const WORLD = 2;

export default defineDetector({
  id: 'worship/charge-caps-no-skull',
  kind: 'check',
  system: 'worship',
  params: z.strictObject({}),
  slots: z.strictObject({ fullIn: z.number(), charge: z.number(), max: z.number() }).partial(),
  reads: ['asOf', 'characters[*].index', 'characters[*].afk', 'account.finishedWorlds', 'diagnostics'],
  examples: {
    // US-5: the W3-early Squire Lv 51, Bowman Lv 60, Squire Lv 85 and Barbarian Lv 56 sit at 50/50.
    fires: [
      { fixture: 'scrubbed-w3', subject: characterSubject(1) },
      { fixture: 'scrubbed-w3', subject: characterSubject(3) },
    ],
    // US-5: the W2-late account hasn't finished World 2, so no worship Finding at all.
    silent: [{ fixture: 'scrubbed-w2' }],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(1),
        mutate: (s) => withUnknown(s, 'characters[1].afk.worship'),
      },
    ],
  },
  run({ state, now, expectedReturnMs }) {
    if (!isKnown(state, 'account.finishedWorlds')) return [];
    if (!state.account.finishedWorlds.includes(WORLD)) return [];
    const returnAt = now + expectedReturnMs;
    return state.characters.flatMap((c): CheckFinding[] => {
      const subject = characterSubject(c.index);
      const w = c.afk?.worship;
      if (!isKnown(state, `characters[${c.index}].afk.worship`) || !c.afk)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      if (!w || w.hasSkull) return [];
      const at = Math.round(state.asOf + (Math.max(0, w.max - w.charge) / w.ratePerHour) * HOUR);
      if (at >= returnAt) return [{ subject, slots: {}, result: 'pass' as const, nextAt: at }];
      return [
        {
          subject,
          slots: { fullIn: Math.max(0, at - now), charge: w.charge, max: w.max },
          result: 'fires' as const,
          at,
          fixHolds: (w.max / w.ratePerHour) * HOUR >= returnAt - now,
          demotedBecause: 'effect-next-action' as const,
        },
      ];
    });
  },
});
