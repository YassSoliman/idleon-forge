// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-18, D7, Final rulings RT-14: an anvil product with hammers reaches capacity before the return
// (Toolbox getTimeTillCap). One finding per character, about its earliest product to cap.
//   - Full now (capAt <= now): the blocker rule's already-full exception applies (FR-7), whether or not
//     collecting covers the stretch; the text adds how long it takes to fill again from empty.
//   - Fills before the return: the fix holds only if every such product, collected now, takes at least
//     the stretch to fill from empty (getTimeTillCap fromZero >= returnAt - now). Otherwise it is one
//     quiet Next Action (D7): Capacity points are the real fix.
//   - Fills after the return: pass, with nextAt for "first thing fills up" (FR-11).
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'anvil/caps-before-return',
  kind: 'check',
  system: 'anvil',
  params: z.strictObject({}),
  slots: z.strictObject({ product: z.string(), fullIn: z.number(), fromEmpty: z.number() }).partial(),
  reads: ['characters[*].index', 'characters[*].afk', 'diagnostics'],
  examples: {
    // US-4: the W2-late Barbarian Lv 60 is full now (1,069/1,069); the other four fill within 8 h.
    fires: [
      { fixture: 'scrubbed-w2', subject: characterSubject(0) },
      { fixture: 'scrubbed-w2', subject: characterSubject(4) },
    ],
    // US-4's W3-early Bowman Lv 60 caps at about 8.2 h, after an 8 h return: here, a product that caps
    // a day after the save.
    silent: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(3),
        mutate: (s) => {
          const afk = s.characters[3]?.afk;
          if (!afk?.anvil) return s;
          const anvil = afk.anvil.map((p) => ({ ...p, amount: 0, capAt: s.asOf + 8.64e7 }));
          return withCharacter(s, 3, { afk: { ...afk, anvil } });
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
  run({ state, now, expectedReturnMs }) {
    const returnAt = now + expectedReturnMs;
    return state.characters.flatMap((c) => {
      const subject = characterSubject(c.index);
      const anvil = c.afk?.anvil;
      if (!isKnown(state, `characters[${c.index}].afk.anvil`) || !anvil)
        return [{ subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const }];
      if (anvil.length === 0) return [];
      const byCap = [...anvil].sort((a, b) => a.capAt - b.capAt || a.item.localeCompare(b.item));
      const first = byCap[0];
      if (!first) return [];
      if (first.capAt >= returnAt)
        return [{ subject, slots: {}, result: 'pass' as const, nextAt: first.capAt }];
      const firing = byCap.filter((p) => p.capAt < returnAt);
      const fixHolds = firing.every((p) => p.fromEmptyMs >= returnAt - now);
      return [
        {
          subject,
          slots: {
            product: first.name,
            fullIn: Math.max(0, first.capAt - now),
            fromEmpty: first.fromEmptyMs,
          },
          result: 'fires' as const,
          at: first.capAt,
          fixHolds,
          ...(fixHolds || first.capAt <= now ? {} : { demotedBecause: 'fix-does-not-hold' as const }),
        },
      ];
    });
  },
});
