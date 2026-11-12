// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51: Orion's two ladders, as Goal progress.
// - `megafeathers`: Megafeathers owned (the Great Mega Reset's level); slot `multi` is Orion's bonus multiplier.
// - `bonuses-level`: Bonuses of Orion level; slots `drop` (its Drop Rate now, %) and `nextDrop` (the next level
//   that adds a Drop Rate step: every 6th level from 5, Toolbox's `owlStats` offset 4).
import { z } from 'zod';
import { accountSubject, isKnown, oneDecimal, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'owl/progress',
  kind: 'progress',
  system: 'owl',
  params: z.strictObject({ part: z.enum(['megafeathers', 'bonuses-level']) }),
  slots: z.strictObject({ multi: z.number(), drop: z.number(), nextDrop: z.number() }).partial(),
  reads: ['account.owl', 'diagnostics'],
  examples: {
    fires: [
      { fixture: 'highend', params: { part: 'megafeathers' }, expect: { value: 37 } },
      { fixture: 'highend', params: { part: 'bonuses-level' }, expect: { value: 41 } },
      { fixture: 'scrubbed-w2', params: { part: 'megafeathers' }, expect: { value: 12 } },
    ],
    silent: [{ fixture: 'first', params: { part: 'megafeathers' } }],
    unknown: [
      { fixture: 'highend', params: { part: 'megafeathers' }, mutate: (s) => withUnknown(s, 'account.owl') },
    ],
  },
  run({ state }, { part }) {
    if (!isKnown(state, 'account.owl'))
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    // A save from before Orion has no Owl: no ladder to climb, nothing unknown.
    const o = state.account.owl;
    if (!o) return [];
    if (part === 'megafeathers')
      return [
        {
          subject: accountSubject,
          slots: { multi: oneDecimal(o.bonusMultiplier) },
          value: o.megafeathers,
        },
      ];
    const L = o.bonusesLevel;
    const drop = o.bonuses.find((b) => b.name === 'Drop Rate')?.value ?? 0;
    // The next level L' > L with L' = 5 (mod 6): Drop Rate's step (offset 4) lands on levels 5, 11, 17, ...
    const nextDrop = L + 1 + ((((4 - L) % 6) + 6) % 6);
    return [
      {
        subject: accountSubject,
        slots: { drop: oneDecimal(drop), nextDrop },
        value: L,
      },
    ];
  },
});
