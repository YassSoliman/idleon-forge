// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-14: a kitchen cooks a meal already at the max level (Toolbox `getMealMaxLevel`) while another
// found meal can still level. `next` is the one fastest to its next level. One finding, the first such
// kitchen.
import { z } from 'zod';
import { accountSubject, fastestMeal, isKnown, withAccount, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'cooking/capped-meal',
  kind: 'check',
  system: 'cooking',
  params: z.strictObject({}),
  slots: z
    .strictObject({ kitchen: z.number(), meal: z.string(), max: z.number(), next: z.string() })
    .partial(),
  reads: ['account.cooking', 'diagnostics'],
  examples: {
    fires: [
      {
        // first.json with the Pie at the max level.
        fixture: 'first',
        mutate: (s) =>
          s.account.cooking
            ? withAccount(s, {
                cooking: {
                  ...s.account.cooking,
                  meals: s.account.cooking.meals.map((m) =>
                    m.name === 'Pie' ? { ...m, level: s.account.cooking?.mealMaxLevel ?? 30 } : m,
                  ),
                },
              })
            : s,
        expect: { slots: { kitchen: 2, meal: 'Pie', max: 30 } },
      },
    ],
    silent: [{ fixture: 'first' }, { fixture: 'fourth' }],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.cooking') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.cooking'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const c = state.account.cooking;
    if (!c) return [];
    for (const k of c.kitchens) {
      if (k.status !== 'cooking' || !k.meal) continue;
      const m = c.meals.find((x) => x.name === k.meal);
      if (!m || m.level < c.mealMaxLevel) continue;
      const next = fastestMeal(c, m.name);
      if (!next) return [];
      return [
        {
          subject: accountSubject,
          slots: { kitchen: k.index + 1, meal: m.name, max: c.mealMaxLevel, next: next.name },
          result: 'fires' as const,
          doneKey: `capped-${k.index}`,
        },
      ];
    }
    return [];
  },
});
