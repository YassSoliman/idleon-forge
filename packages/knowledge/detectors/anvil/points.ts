// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-23, TR-6: unspent anvil points, one finding per character holding any (Speed first, PV 3.1).
// M3 owns anvil products capping; when M3 reports one before the return, the engine names Capacity
// instead (FR-23), which this Detector does not decide. TODO(M3): read anvilCapsBeforeReturn.
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'anvil/points',
  kind: 'check',
  system: 'anvil',
  params: z.strictObject({}),
  slots: z.strictObject({ points: z.number() }).partial(),
  reads: ['characters[*].index', 'characters[*].anvilPointsAvailable', 'diagnostics'],
  examples: {
    // W3-early: the Bowman Lv 60 has 3.
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(2), expect: { slots: { points: 3 } } }],
    silent: [{ fixture: 'scrubbed-w2' }, { fixture: 'scrubbed-w3', subject: characterSubject(0) }],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(2),
        mutate: (s) => withCharacter(s, 2, { anvilPointsAvailable: null }),
      },
    ],
  },
  run({ state }) {
    return state.characters.flatMap((c) => {
      const v = c.anvilPointsAvailable;
      if (!isKnown(state, `characters[${c.index}].anvilPointsAvailable`) || v === null)
        return [
          {
            subject: characterSubject(c.index),
            slots: {},
            result: 'unknown' as const,
            reason: 'field-missing' as const,
          },
        ];
      if (v <= 0) return [];
      return [
        {
          subject: characterSubject(c.index),
          slots: { points: v },
          result: 'fires' as const,
          urgency: 'banked' as const,
          doneKey: `anvil-points:${c.index}`,
        },
      ];
    });
  },
});
