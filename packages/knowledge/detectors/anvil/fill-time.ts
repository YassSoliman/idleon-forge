// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// #70 A1: the quiet per-character line "Anvil full in X h at current speed". Not a Goal or a Next
// Action: M3's module turns it into `CharacterResult.info`. It fires for a character with a hammer on a
// product that is not full yet, with the time until its earliest product caps (M3 TR-2 `capAt`). Full
// now is anvil/caps-before-return's blocker, so it is silent then.
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'anvil/fill-time',
  kind: 'check',
  system: 'anvil',
  params: z.strictObject({}),
  slots: z.strictObject({ fullIn: z.number() }).partial(),
  reads: ['characters[*].index', 'characters[*].afk', 'diagnostics'],
  examples: {
    // The W2-late Squire Lv 43's Thread fills in about 1.4 h.
    fires: [{ fixture: 'scrubbed-w2', subject: characterSubject(1) }],
    silent: [
      // The W2-late Barbarian Lv 60 is full now: the blocker says so.
      { fixture: 'scrubbed-w2', subject: characterSubject(0) },
      // No hammer on any product.
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        mutate: (s) => {
          const afk = s.characters[1]?.afk;
          return afk ? withCharacter(s, 1, { afk: { ...afk, anvil: [] } }) : s;
        },
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(1),
        mutate: (s) => withUnknown(s, 'characters[1].afk.anvil'),
      },
    ],
  },
  run({ state, now }) {
    return state.characters.flatMap((c): CheckFinding[] => {
      const subject = characterSubject(c.index);
      const anvil = c.afk?.anvil;
      if (!isKnown(state, `characters[${c.index}].afk.anvil`) || !anvil)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      if (anvil.length === 0) return [];
      const first = Math.min(...anvil.map((p) => p.capAt));
      if (first <= now) return [];
      return [{ subject, slots: { fullIn: first - now }, result: 'fires' as const, at: first }];
    });
  },
});
