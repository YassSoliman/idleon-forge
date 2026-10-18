// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-14, Final rulings RT-5 and the owner's ruling R-FOOD-2 (#31): before any history gives a food
// rate, a food-dependent fighter (under 100% without food, 100% with it) whose equipped health food is
// low gets "Low food: N left; can't time it yet". Low means under `lowShare` (60%) of the character's
// food carry cap (Toolbox getItemCapacity) when that cap is known, else under `lowStack` (50). A cap the
// save itself contradicts (an equipped stack above it) is treated as unknown, so an unverified cap errs
// towards silence. Never a blocker (effect next-action). Once a rate exists (TR-6),
// afk/health-food-runs-out times it instead and this stays silent.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector, type HistoryEntry } from '../../src/types';

const FULL = 1e2;
/** An example threshold, the same as the entry's. */
const LOW = { lowShare: 0.6, lowStack: 5e1 };

const healthLeft = (c: CharacterState | undefined) =>
  (c?.afk?.food ?? []).filter((f) => f.kind === 'health').reduce((n, f) => n + f.amount, 0);

const HOUR = 3.6e6;
const MINUTE = 6e4;
const DAY = 8.64e7;
/** `afk/health-food-runs-out`'s rate rules (TR-6, its default params; its entry sets none). */
const RATE = { windowMinutes: 10, minHours: 0.5, lookbackDays: 30, minObservations: 2 };

const healthOf = (c: CharacterState) => {
  const food = (c.afk?.food ?? []).filter((f) => f.kind === 'health');
  return {
    amount: food.reduce((n, f) => n + f.amount, 0),
    items: food
      .map((f) => `${f.slot}:${f.item}`)
      .sort()
      .join(','),
  };
};

/**
 * Whether history already gives this character a food rate: exactly when `afk/health-food-runs-out`
 * times the food instead. It counts that Check's valid observations with the same rules (Detectors
 * can't import each other, M11 TR-1; the partial-history tests pin that the two agree). Two earlier
 * AFK Stretches are not enough on their own: saves outside the load windows give no rate, and the
 * low-food line must not vanish before the timed one can show.
 */
function hasRate(history: readonly HistoryEntry[], current: AccountState, index: number, now: number) {
  const records = [...history.map((h) => h.state), current]
    .map((s) => ({ at: s.account.lastCloudSave, c: s.characters.find((x) => x.index === index) }))
    .filter((r): r is { at: number; c: CharacterState } => r.at !== null && !!r.c?.afk);
  const near = (at: number, since: number) => Math.abs(at - since) <= RATE.windowMinutes * MINUTE;
  const stretches = [...new Set(records.map((r) => r.c.afk?.afkSince as number))].sort((a, b) => a - b);
  let observed = 0;
  for (let i = 1; i < stretches.length; i++) {
    const a = stretches[i - 1] as number;
    const b = stretches[i] as number;
    if (now - b > RATE.lookbackDays * DAY) continue;
    const before = records.filter((r) => r.c.afk?.afkSince === a && near(r.at, a)).at(-1);
    const after = records.find((r) => r.c.afk?.afkSince === b && near(r.at, b));
    if (!before || !after) continue;
    if (before.c.afkType !== after.c.afkType || before.c.afkTarget !== after.c.afkTarget) continue;
    if ((b - a) / HOUR < RATE.minHours) continue;
    const x = healthOf(before.c);
    const y = healthOf(after.c);
    if (x.items !== y.items || y.amount > x.amount) continue;
    observed++;
  }
  return observed >= RATE.minObservations;
}

const lowStack = (s: AccountState, index: number, amount: number): AccountState => {
  const afk = s.characters.find((x) => x.index === index)?.afk;
  if (!afk) return s;
  let first = true;
  const food = afk.food.map((f) => {
    if (f.kind !== 'health') return f;
    const keep = first;
    first = false;
    return { ...f, amount: keep ? amount : 0 };
  });
  return withCharacter(s, index, { afk: { ...afk, food: food.filter((f) => f.amount > 0) } });
};

export default defineDetector({
  id: 'afk/low-food-untimed',
  kind: 'check',
  system: 'afk',
  params: z.strictObject({ lowShare: z.number().positive().max(1), lowStack: z.int().positive() }),
  slots: z.strictObject({ left: z.number(), threshold: z.number() }).partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].afkTarget',
    'characters[*].afk',
    'account.lastCloudSave',
    'diagnostics',
  ],
  examples: {
    // US-1: the W3-early Squire Lv 85 (45% without food) with a small health stack and no history.
    fires: [
      // R-FOOD-2: the W2-late Wizard Lv 56 carries 88 health food, under 60% of its food cap.
      { fixture: 'scrubbed-w2', subject: characterSubject(4), params: LOW },
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: LOW,
        mutate: (s) => lowStack(s, 3, 7),
      },
    ],
    silent: [
      // US-1: 153 and 146 health food are above the threshold.
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: LOW,
        mutate: (s) => lowStack(s, 3, 2.9e2),
      },
      { fixture: 'scrubbed-w2', subject: characterSubject(0), params: LOW },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: LOW,
        mutate: (s) => withUnknown(s, 'characters[3].afk.fighting'),
      },
    ],
  },
  run({ state, history, now }, { lowShare, lowStack: fallback }) {
    return state.characters.flatMap((c): CheckFinding[] => {
      if (c.afkType !== 'FIGHTING') return [];
      const subject = characterSubject(c.index);
      const f = c.afk?.fighting;
      if (!isKnown(state, `characters[${c.index}].afk.fighting`) || !c.afk || !f)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      const left = healthLeft(c);
      const cap = f.foodCap;
      const capBelievable = cap !== null && c.afk.food.every((x) => x.kind !== 'health' || x.amount <= cap);
      const threshold = capBelievable ? Math.round(lowShare * cap) : fallback;
      const dependent = f.survivabilityNoFood < FULL && f.survivability >= FULL;
      if (!dependent || left === 0 || left >= threshold || hasRate(history, state, c.index, now))
        return [{ subject, slots: {}, result: 'pass' as const }];
      return [{ subject, slots: { left, threshold }, result: 'fires' as const, fixHolds: true }];
    });
  },
});
