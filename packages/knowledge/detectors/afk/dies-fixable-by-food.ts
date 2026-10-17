// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-13: a fighter whose Toolbox survivability is under 100% keeps dying while you're away, and one
// health food it already owns would fix it (the account-state clone puts each owned health food in the
// first Blank food slot and re-runs Toolbox's getMaxDamage). Names the LARGEST fixing stack: the spec
// says the smallest, but with no consumption rate known a 1-food stack "fixes" the row and runs out in
// minutes (W2-late: Meatloaf x1), so this reads the spec's tie rule as the rule until Yasser rules.
// With no owned food that fixes it, it does not fire:
// survival is then a better-map problem (M4, M5). A present-state Check.
import type { AccountState, CharacterAfkFacts } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

const FULL = 1e2;

const patchAfk = (s: AccountState, index: number, patch: Partial<CharacterAfkFacts>): AccountState => {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  return afk ? withCharacter(s, index, { afk: { ...afk, ...patch } }) : s;
};

export default defineDetector({
  id: 'afk/dies-fixable-by-food',
  kind: 'check',
  system: 'afk',
  params: z.strictObject({}),
  slots: z.strictObject({ food: z.string(), owned: z.number(), survivability: z.number() }).partial(),
  reads: ['characters[*].index', 'characters[*].afkType', 'characters[*].afk', 'diagnostics'],
  examples: {
    // The plan's acceptance example: the W2-late Barbarian Lv 60 at 78% on Poopy Sewers, with four
    // owned health foods in storage that each lift it to 100%.
    fires: [{ fixture: 'scrubbed-w2', subject: characterSubject(0) }],
    silent: [
      { fixture: 'scrubbed-w2', subject: characterSubject(4) },
      { fixture: 'scrubbed-w3' },
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        mutate: (s) => {
          const f = s.characters[0]?.afk?.fighting;
          return f ? patchAfk(s, 0, { fighting: { ...f, fixingFoods: [] } }) : s;
        },
      },
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        mutate: (s) => patchAfk(s, 0, { blankFoodSlot: false }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        mutate: (s) => withUnknown(s, 'characters[0].afk.fighting'),
      },
    ],
  },
  run({ state }) {
    return state.characters.flatMap((c): CheckFinding[] => {
      if (c.afkType !== 'FIGHTING') return [];
      const subject = characterSubject(c.index);
      const f = c.afk?.fighting;
      if (!isKnown(state, `characters[${c.index}].afk.fighting`) || !c.afk || !f) {
        const failed = state.diagnostics.failedSections.length > 0;
        return [
          {
            subject,
            slots: {},
            result: 'unknown' as const,
            reason: failed ? ('parser-section-failed' as const) : ('field-missing' as const),
          },
        ];
      }
      const best = [...f.fixingFoods].sort((a, b) => b.amount - a.amount || a.item.localeCompare(b.item))[0];
      if (f.survivability >= FULL || !best || !c.afk.blankFoodSlot)
        return [{ subject, slots: {}, result: 'pass' as const }];
      return [
        {
          subject,
          slots: { food: best.name, owned: best.amount, survivability: f.survivability },
          result: 'fires' as const,
          fixHolds: true,
        },
      ];
    });
  },
});
