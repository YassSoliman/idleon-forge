// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-23, TR-6: unspent anvil points, one finding per character holding any. Speed first (PV 3.1);
// Capacity instead when M3's anvil facts (`characters[].afk.anvil`, M3 TR-2) show a product reaching
// capacity before the player is back. One entry per form; without M3's facts the Speed form applies.
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter } from '../../src/helpers';
import { type CheckFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'anvil/points',
  kind: 'check',
  system: 'anvil',
  params: z.strictObject({ form: z.enum(['speed', 'capacity']).default('speed') }),
  slots: z.strictObject({ points: z.number(), product: z.string() }).partial(),
  reads: ['characters[*].index', 'characters[*].anvilPointsAvailable', 'characters[*].afk', 'diagnostics'],
  examples: {
    fires: [
      // W3-early at the fixture's now (8.5 h after the save): the Bowman Lv 60 has 3 points, and its
      // Leather Hide reaches capacity before an 8 h return, so Capacity is named (FR-23).
      {
        fixture: 'scrubbed-w3',
        params: { form: 'capacity' },
        subject: characterSubject(2),
        expect: { slots: { points: 3, product: 'Leather_Hide' } },
      },
      // With no product capping, Speed (PV 3.1).
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(2),
        mutate: (s) => {
          const afk = s.characters.find((x) => x.index === 2)?.afk;
          return afk ? withCharacter(s, 2, { afk: { ...afk, anvil: [] } }) : s;
        },
        expect: { slots: { points: 3 } },
      },
    ],
    silent: [
      { fixture: 'scrubbed-w2' },
      { fixture: 'scrubbed-w3', subject: characterSubject(0) },
      { fixture: 'scrubbed-w2', params: { form: 'capacity' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(2),
        mutate: (s) => withCharacter(s, 2, { anvilPointsAvailable: null }),
      },
    ],
  },
  run({ state, now, expectedReturnMs }, { form }) {
    const back = now + expectedReturnMs;
    return state.characters.flatMap((c): CheckFinding[] => {
      const v = c.anvilPointsAvailable;
      if (!isKnown(state, `characters[${c.index}].anvilPointsAvailable`) || v == null)
        return [
          {
            subject: characterSubject(c.index),
            slots: {},
            result: 'unknown' as const,
            reason: 'field-missing' as const,
          },
        ];
      if (v <= 0) return [];
      // The first product M3 reports reaching capacity before the return, if M3's facts are readable.
      const anvil = isKnown(state, `characters[${c.index}].afk.anvil`) ? (c.afk?.anvil ?? null) : null;
      const capping = anvil?.find((p) => p.capAt < back) ?? null;
      if ((form === 'capacity') !== (capping !== null)) return [];
      return [
        {
          subject: characterSubject(c.index),
          slots: capping ? { points: v, product: capping.name } : { points: v },
          result: 'fires' as const,
          urgency: 'banked' as const,
          doneKey: `anvil-points:${c.index}`,
        },
      ];
    });
  },
});
