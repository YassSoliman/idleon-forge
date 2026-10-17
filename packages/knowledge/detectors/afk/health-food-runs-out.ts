// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-14, D1: a food-dependent fighter (survivability under 100% without food, 100% with it) whose
// equipped health food runs out before the return. Food use comes from the player's own history (TR-6):
// arithmetic on observed amounts, never a game formula (ADR 0005). Without an observed rate it fires
// only when no health food is equipped (D1) and otherwise reports `needs-history`, which never makes a
// character Unknown (FR-8): the row shows "food estimate after your next session".
//
// One observation is two saves of the same character around one AFK Stretch: a save within
// `windowMinutes` of the character's switch-away (its afkSince A) and one within `windowMinutes` of its
// next own save (afkSince B > A), same AFK Target and same health foods; rate = eaten / (B - A) hours.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector, type HistoryEntry } from '../../src/types';

const HOUR = 3.6e6;
const MINUTE = 6e4;
const DAY = 8.64e7;
const FULL = 1e2;

const healthOf = (c: CharacterState | undefined) => {
  const food = (c?.afk?.food ?? []).filter((f) => f.kind === 'health');
  return {
    amount: food.reduce((n, f) => n + f.amount, 0),
    items: food
      .map((f) => `${f.slot}:${f.item}`)
      .sort()
      .join(','),
  };
};

interface Params {
  windowMinutes: number;
  minHours: number;
  lookbackDays: number;
  observations: number;
  minObservations: number;
}

/** Health food eaten per AFK hour, the median of the last observations; null with too few. */
export function observedHealthFoodRate(
  history: readonly HistoryEntry[],
  current: AccountState,
  index: number,
  now: number,
  p: Params,
): number | null {
  const records = [...history.map((h) => h.state), current]
    .map((s) => ({ at: s.account.lastCloudSave, c: s.characters.find((x) => x.index === index) }))
    .filter((r): r is { at: number; c: CharacterState } => r.at !== null && !!r.c?.afk);
  const near = (at: number, afkSince: number) => Math.abs(at - afkSince) <= p.windowMinutes * MINUTE;
  const stretches = [...new Set(records.map((r) => r.c.afk?.afkSince as number))].sort((a, b) => a - b);
  const rates: number[] = [];
  for (let i = 1; i < stretches.length; i++) {
    const a = stretches[i - 1] as number;
    const b = stretches[i] as number;
    if (now - b > p.lookbackDays * DAY) continue;
    const before = records.filter((r) => r.c.afk?.afkSince === a && near(r.at, a)).at(-1);
    const after = records.find((r) => r.c.afk?.afkSince === b && near(r.at, b));
    if (!before || !after) continue;
    if (before.c.afkType !== after.c.afkType || before.c.afkTarget !== after.c.afkTarget) continue;
    const hours = (b - a) / HOUR;
    if (hours < p.minHours) continue;
    const x = healthOf(before.c);
    const y = healthOf(after.c);
    if (x.items !== y.items || y.amount > x.amount) continue;
    rates.push((x.amount - y.amount) / hours);
  }
  const last = rates.slice(-p.observations).sort((m, n) => m - n);
  if (last.length < p.minObservations) return null;
  const mid = Math.floor(last.length / 2);
  return last.length % 2 ? (last[mid] as number) : ((last[mid - 1] as number) + (last[mid] as number)) / 2;
}

const params = z.strictObject({
  windowMinutes: z.number().positive().default(10),
  minHours: z.number().positive().default(0.5),
  lookbackDays: z.number().positive().default(30),
  observations: z.int().positive().default(5),
  minObservations: z.int().positive().default(2),
});

// A food-dependent fighter: dies without food, survives with what it has (FR-14).
const dependent = (s: AccountState, index: number): AccountState => {
  const c = s.characters.find((x) => x.index === index);
  const afk = c?.afk;
  if (!afk?.fighting) return s;
  return withCharacter(s, index, {
    afk: {
      ...afk,
      food: afk.food.filter((f) => f.kind !== 'health'),
      fighting: { ...afk.fighting, survivability: FULL, survivabilityNoFood: FULL / 2 },
    },
  });
};

export default defineDetector({
  id: 'afk/health-food-runs-out',
  kind: 'check',
  system: 'afk',
  params,
  slots: z.strictObject({ left: z.number(), runsOutIn: z.number(), perHour: z.number() }).partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].afk',
    'account.lastCloudSave',
    'diagnostics',
  ],
  examples: {
    // D1's presence branch: a food-dependent fighter with no health food equipped.
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(3), mutate: (s) => dependent(s, 3) }],
    silent: [
      { fixture: 'scrubbed-w2', subject: characterSubject(0) },
      { fixture: 'scrubbed-w3', subject: characterSubject(1) },
      { fixture: 'scrubbed-w3', subject: characterSubject(2) },
    ],
    unknown: [
      // No history yet: the estimate waits for the next session (never Unknown, FR-8).
      { fixture: 'scrubbed-w3', subject: characterSubject(3) },
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(0),
        mutate: (s) => withUnknown(s, 'characters[0].afk.fighting'),
      },
    ],
  },
  run({ state, history, now, expectedReturnMs }, p) {
    const returnAt = now + expectedReturnMs;
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
      if (!(f.survivabilityNoFood < FULL && f.survivability >= FULL))
        return [{ subject, slots: {}, result: 'pass' as const }];
      const left = healthOf(c).amount;
      if (left === 0)
        return [
          {
            subject,
            slots: { left, runsOutIn: 0, perHour: 0 },
            result: 'fires' as const,
            at: c.afk.afkSince,
            fixHolds: f.spareHealthFood > 0,
            ...(f.spareHealthFood > 0 ? {} : { demotedBecause: 'not-fillable' as const }),
          },
        ];
      const rate = observedHealthFoodRate(history, state, c.index, now, p);
      if (rate === null)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'needs-history' as const }];
      if (rate <= 0) return [{ subject, slots: {}, result: 'pass' as const }];
      const at = Math.round(c.afk.afkSince + (left / rate) * HOUR);
      if (at >= returnAt) return [{ subject, slots: {}, result: 'pass' as const, nextAt: at }];
      // The fix holds when the spare food covers the rest of the stretch at the same rate.
      const needed = rate * ((returnAt - c.afk.afkSince) / HOUR) - left;
      const fixHolds = f.spareHealthFood >= needed;
      return [
        {
          subject,
          slots: { left, runsOutIn: Math.max(0, at - now), perHour: rate },
          result: 'fires' as const,
          at,
          fixHolds,
          ...(f.spareHealthFood > 0 ? {} : { demotedBecause: 'not-fillable' as const }),
        },
      ];
    });
  },
});
