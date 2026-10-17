// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-19, D2: worship charge reaches its maximum before the return (or is full now), for a character
// with a worship skull equipped. Charge, max and rate are Toolbox's getPlayerWorship at parse time;
// the time is (max - charge) / rate. Gated on World 2 finished (Toolbox's gate). The fix "spend it or
// let the Wizard's Charge Syphon take it" holds when max / rate covers the stretch.
// Its skull-less sibling is worship/charge-caps-no-skull (a Next Action, D2).
import type { AccountState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

const HOUR = 3.6e6;
const WORLD = 2;
// A skull bar nearly full (US-5's mutation).
const NEAR_FULL = 1.1e2;

/** US-5: the W3-early Wizard Lv 73 wearing a skull (max 120), at `charge`. */
const skull = (s: AccountState, index: number, charge: number, max = 120): AccountState => {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  if (!afk?.worship) return s;
  return withCharacter(s, index, {
    afk: { ...afk, worship: { ...afk.worship, max, charge, hasSkull: true } },
  });
};

export default defineDetector({
  id: 'worship/charge-caps-skull',
  kind: 'check',
  system: 'worship',
  params: z.strictObject({}),
  slots: z.strictObject({ fullIn: z.number(), charge: z.number(), max: z.number() }).partial(),
  reads: ['asOf', 'characters[*].index', 'characters[*].afk', 'account.finishedWorlds', 'diagnostics'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(0), mutate: (s) => skull(s, 0, NEAR_FULL) }],
    silent: [
      { fixture: 'scrubbed-w3' },
      { fixture: 'scrubbed-w2' },
      { fixture: 'scrubbed-w3', subject: characterSubject(0), mutate: (s) => skull(s, 0, 26) },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(0),
        mutate: (s) => withUnknown(skull(s, 0, NEAR_FULL), 'characters[0].afk.worship'),
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
      if (!w?.hasSkull) return [];
      const at = Math.round(state.asOf + (Math.max(0, w.max - w.charge) / w.ratePerHour) * HOUR);
      if (at >= returnAt) return [{ subject, slots: {}, result: 'pass' as const, nextAt: at }];
      const fixHolds = (w.max / w.ratePerHour) * HOUR >= returnAt - now;
      return [
        {
          subject,
          slots: { fullIn: Math.max(0, at - now), charge: w.charge, max: w.max },
          result: 'fires' as const,
          at,
          fixHolds,
          ...(fixHolds || at <= now ? {} : { demotedBecause: 'fix-does-not-hold' as const }),
        },
      ];
    });
  },
});
