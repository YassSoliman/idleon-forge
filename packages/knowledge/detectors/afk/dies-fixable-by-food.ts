// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-13 with the owner's ruling R-FOOD-1 (#31): a fighter whose Toolbox survivability is under 100%
// keeps dying while you're away, and a health food it already owns would fix it (the account-state
// clone puts each owned health food in the first Blank food slot and re-runs Toolbox's getMaxDamage).
//
// Which food to name (R-FOOD-1): the most efficient one, the smallest heal per bite that still refills
// most of the character's max HP (`refillShare`, no overheal waste), among the fixing foods whose stack
// lasts the whole return. Heal per bite is Toolbox data (item Amount x getPlayerFoodBonus); max HP is
// Toolbox getMaxDamage. How long a stack lasts needs the HP the character eats per hour, which only the
// player's own history gives (TR-6: health food eaten per AFK hour x its heal per bite). Without it no
// stack is judged short (D1: no worst-case bound). If no owned stack lasts, the finding's `stockUp` slot
// is 1 and the entry's `text-stock-up` text applies: equip the efficient food now, and stock up on it.
// When heal per bite is unknown for every fixing food, it falls back to the largest stack (PR #67).
// With no owned food that fixes it, it does not fire: survival is then a better-map problem (M4, M5).
import type { AccountState, CharacterAfkFacts, CharacterState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector, type HistoryEntry } from '../../src/types';

const FULL = 1e2;
const HOUR = 3.6e6;
const MINUTE = 6e4;
const DAY = 8.64e7;

type Food = NonNullable<CharacterAfkFacts['fighting']>['fixingFoods'][number];

const patchAfk = (s: AccountState, index: number, patch: Partial<CharacterAfkFacts>): AccountState => {
  const afk = s.characters.find((c) => c.index === index)?.afk;
  return afk ? withCharacter(s, index, { afk: { ...afk, ...patch } }) : s;
};

const params = z.strictObject({
  /** "Most of" max HP: a bite healing at least this share of max HP counts as a full refill (R-FOOD-1). */
  refillShare: z.number().positive().max(1).default(0.5),
  windowMinutes: z.number().positive().default(10),
  minHours: z.number().positive().default(0.5),
  lookbackDays: z.number().positive().default(30),
  observations: z.int().positive().default(5),
  minObservations: z.int().positive().default(2),
});
type Params = z.infer<typeof params>;

const hpOf = (c: CharacterState | undefined) =>
  (c?.afk?.food ?? [])
    .filter((f) => f.kind === 'health')
    .reduce(
      (n, f) => (n === null || f.healPerBite === null ? null : n + f.amount * f.healPerBite),
      0 as number | null,
    );
const itemsOf = (c: CharacterState | undefined) =>
  (c?.afk?.food ?? [])
    .filter((f) => f.kind === 'health')
    .map((f) => `${f.slot}:${f.item}`)
    .sort()
    .join(',');

/** HP of health food eaten per AFK hour, from earlier stretches (TR-6); null with too few. */
export function observedHpPerHour(
  history: readonly HistoryEntry[],
  current: AccountState,
  index: number,
  now: number,
  p: Params,
): number | null {
  const records = [...history.map((h) => h.state), current]
    .map((s) => ({ at: s.account.lastCloudSave, c: s.characters.find((x) => x.index === index) }))
    .filter((r): r is { at: number; c: CharacterState } => r.at !== null && !!r.c?.afk);
  const near = (at: number, since: number) => Math.abs(at - since) <= p.windowMinutes * MINUTE;
  const stretches = [...new Set(records.map((r) => r.c.afk?.afkSince as number))].sort((a, b) => a - b);
  const rates: number[] = [];
  for (let i = 1; i < stretches.length; i++) {
    const a = stretches[i - 1] as number;
    const b = stretches[i] as number;
    if (now - b > p.lookbackDays * DAY) continue;
    const before = records.filter((r) => r.c.afk?.afkSince === a && near(r.at, a)).at(-1);
    const after = records.find((r) => r.c.afk?.afkSince === b && near(r.at, b));
    if (!before || !after || before.c.afkType !== after.c.afkType || before.c.afkTarget !== after.c.afkTarget)
      continue;
    const hours = (b - a) / HOUR;
    const x = hpOf(before.c);
    const y = hpOf(after.c);
    if (hours < p.minHours || x === null || y === null || itemsOf(before.c) !== itemsOf(after.c) || y > x)
      continue;
    rates.push((x - y) / hours);
  }
  const last = rates.slice(-p.observations).sort((m, n) => m - n);
  if (last.length < p.minObservations) return null;
  const mid = Math.floor(last.length / 2);
  return last.length % 2 ? (last[mid] as number) : ((last[mid - 1] as number) + (last[mid] as number)) / 2;
}

const byStack = (a: Food, b: Food) => b.amount - a.amount || a.item.localeCompare(b.item);

/** R-FOOD-1's most efficient food among `foods`. */
export function efficientFood(
  foods: readonly Food[],
  maxHp: number | null,
  refillShare: number,
): Food | undefined {
  const healed = foods.filter((f) => f.healPerBite !== null);
  if (healed.length === 0 || maxHp === null) return [...foods].sort(byStack)[0];
  const refill = healed.filter((f) => (f.healPerBite as number) >= refillShare * maxHp);
  if (refill.length > 0)
    return [...refill].sort(
      (a, b) => (a.healPerBite as number) - (b.healPerBite as number) || byStack(a, b),
    )[0];
  return [...healed].sort(
    (a, b) => (b.healPerBite as number) - (a.healPerBite as number) || byStack(a, b),
  )[0];
}

export default defineDetector({
  id: 'afk/dies-fixable-by-food',
  kind: 'check',
  system: 'afk',
  params,
  slots: z
    .strictObject({
      food: z.string(),
      owned: z.number(),
      survivability: z.number(),
      lasts: z.number(),
      stockUp: z.number(),
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].afk',
    'account.lastCloudSave',
    'diagnostics',
  ],
  examples: {
    // The plan's acceptance example: the W2-late Barbarian Lv 60 at 78% on Poopy Sewers, with four
    // owned health foods in storage that each lift it to 100%; Meat Pie is the efficient one.
    fires: [
      { fixture: 'scrubbed-w2', subject: characterSubject(0), expect: { slots: { food: 'Meat_Pie' } } },
    ],
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
  run({ state, history, now, expectedReturnMs }, p) {
    const stretchH = expectedReturnMs / HOUR;
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
      if (f.survivability >= FULL || f.fixingFoods.length === 0 || !c.afk.blankFoodSlot)
        return [{ subject, slots: {}, result: 'pass' as const }];
      const hpPerHour = observedHpPerHour(history, state, c.index, now, p);
      const lastsH = (x: Food) =>
        hpPerHour === null || hpPerHour <= 0 || x.healPerBite === null
          ? Number.POSITIVE_INFINITY
          : (x.amount * x.healPerBite) / hpPerHour;
      const lasting = f.fixingFoods.filter((x) => lastsH(x) >= stretchH);
      const stockUp = lasting.length === 0;
      const best = efficientFood(stockUp ? f.fixingFoods : lasting, f.maxHp, p.refillShare);
      if (!best) return [{ subject, slots: {}, result: 'pass' as const }];
      const lasts = lastsH(best);
      return [
        {
          subject,
          slots: {
            food: best.name,
            owned: best.amount,
            survivability: f.survivability,
            ...(Number.isFinite(lasts) ? { lasts: Math.round(lasts * HOUR) } : {}),
            stockUp: stockUp ? 1 : 0,
          },
          result: 'fires' as const,
          fixHolds: true,
        },
      ];
    });
  },
});
