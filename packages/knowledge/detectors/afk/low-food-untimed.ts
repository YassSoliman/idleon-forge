// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-14, Final rulings RT-5: before any history gives a food rate, a food-dependent fighter
// (under 100% without food, 100% with it) whose equipped health food is below the entry's authored
// `lowStack` gets "Low food: N left; can't time it yet". Never a blocker (effect next-action). Once a
// rate exists (TR-6), afk/health-food-runs-out times it instead and this stays silent.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { defineDetector, type HistoryEntry } from '../../src/types';

const FULL = 1e2;
/** An example threshold, the same as the entry's. */
const LOW = { lowStack: 2.5e1 };

const healthLeft = (c: CharacterState | undefined) =>
  (c?.afk?.food ?? []).filter((f) => f.kind === 'health').reduce((n, f) => n + f.amount, 0);

/**
 * Whether history may already give a food rate: at least two earlier AFK Stretches of this character
 * (health-food-runs-out needs two observations). Then that Check times the food instead.
 */
const hasHistory = (history: readonly HistoryEntry[], c: CharacterState) => {
  const stretches = new Set<number>();
  for (const h of history) {
    const prev = h.state.characters.find((x) => x.index === c.index)?.afk?.afkSince;
    if (prev !== undefined && prev !== c.afk?.afkSince) stretches.add(prev);
  }
  return stretches.size >= 2;
};

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
  params: z.strictObject({ lowStack: z.int().positive() }),
  slots: z.strictObject({ left: z.number() }).partial(),
  reads: ['characters[*].index', 'characters[*].afkType', 'characters[*].afk', 'diagnostics'],
  examples: {
    // US-1: the W3-early Squire Lv 85 (45% without food) with a small health stack and no history.
    fires: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: LOW,
        mutate: (s) => lowStack(s, 3, 7),
      },
    ],
    silent: [
      // US-1: 153 and 146 health food are above the threshold.
      { fixture: 'scrubbed-w3', params: { lowStack: 25 } },
      { fixture: 'scrubbed-w2', params: { lowStack: 25 } },
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
  run({ state, history }, { lowStack: threshold }) {
    return state.characters.flatMap((c) => {
      if (c.afkType !== 'FIGHTING') return [];
      const subject = characterSubject(c.index);
      const f = c.afk?.fighting;
      if (!isKnown(state, `characters[${c.index}].afk.fighting`) || !c.afk || !f)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      const left = healthLeft(c);
      const dependent = f.survivabilityNoFood < FULL && f.survivability >= FULL;
      if (!dependent || left === 0 || left >= threshold || hasHistory(history, c))
        return [{ subject, slots: {}, result: 'pass' as const }];
      return [{ subject, slots: { left }, result: 'fires' as const, fixHolds: true }];
    });
  },
});
