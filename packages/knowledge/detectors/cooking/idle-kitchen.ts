// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-14, US-9: an owned kitchen is idle (raw `Cooking[i][0]` 1) while the account has a found meal
// below the max level, so it cooks nothing. `meal` is the one fastest to its next level. One finding,
// for the first idle kitchen.
import { z } from 'zod';
import { accountSubject, fastestMeal, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'cooking/idle-kitchen',
  kind: 'check',
  system: 'cooking',
  params: z.strictObject({}),
  slots: z.strictObject({ kitchen: z.number(), meal: z.string(), idle: z.number() }).partial(),
  reads: ['account.cooking', 'diagnostics'],
  examples: {
    fires: [
      {
        // first.json with Kitchen 2 stopped.
        fixture: 'first',
        mutate: (s) =>
          s.account.cooking
            ? withAccount(s, {
                cooking: {
                  ...s.account.cooking,
                  kitchens: s.account.cooking.kitchens.map((k) =>
                    k.index === 1 ? { ...k, status: 'idle', meal: null } : k,
                  ),
                },
              })
            : s,
        expect: { slots: { kitchen: 2, idle: 1 } },
      },
    ],
    silent: [{ fixture: 'first' }, { fixture: 'fourth' }, { fixture: 'highend' }],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.cooking') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.cooking'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const c = state.account.cooking;
    if (!c) return [];
    const idle = c.kitchens.filter((k) => k.status === 'idle');
    const first = idle[0];
    const meal = fastestMeal(c);
    if (!first || !meal) return [];
    return [
      {
        subject: accountSubject,
        slots: { kitchen: first.index + 1, meal: meal.name, idle: idle.length },
        result: 'fires' as const,
        doneKey: `kitchen-${first.index}`,
      },
    ];
  },
});
