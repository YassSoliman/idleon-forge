// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-12: the Charisma Chart trains nothing, or an attribute already at its max (X1's
// charismaMaxLevel), while another can still level. XP keeps banking and the next Megaflesh wipes it, so
// the urgency is `banked`. Silent while a Megaflesh fires (FR-7 warns instead) and when all six are maxed.
// From Megaflesh 6, with Mindful below its max, the text names Mindful (Final rulings R-2).
import { z } from 'zod';
import {
  accountSubject,
  BUBBA_READS,
  bubbaNow,
  charismaIdle,
  UNKNOWN,
  unreadable,
  withBubba,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/charisma-idle',
  kind: 'check',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z
    .strictObject({ selected: z.number(), none: z.number(), mindful: z.number(), banked: z.number() })
    .partial(),
  reads: BUBBA_READS,
  examples: {
    fires: [
      { fixture: 'scrubbed-w3' },
      { fixture: 'latest' },
      { fixture: 'scrubbed-w3', mutate: (s) => withBubba(s, { charismaPatch: { selected: 0 } }) },
    ],
    silent: [
      { fixture: 'scrubbed-w3', mutate: (s) => withBubba(s, { charismaPatch: { selected: 2 } }) },
      {
        fixture: 'scrubbed-w3',
        mutate: (s) => withBubba(s, { charismaPatch: { levels: [120, 120, 120, 120, 120, 120] } }),
      },
      { fixture: 'scrubbed-w2' },
    ],
    unknown: [
      { fixture: 'scrubbed-w3', mutate: unreadable },
      { fixture: 'scrubbed-w3', mutate: (s) => withBubba(s, { charismaPatch: { maxLevel: null } }) },
    ],
  },
  run({ state, now }) {
    const n = bubbaNow(state, now);
    if (n === null) return [];
    const idle = n === 'unknown' ? 'unknown' : charismaIdle(n);
    if (idle === null) return [];
    if (idle === 'unknown') return [UNKNOWN];
    return [
      {
        subject: accountSubject,
        slots: {
          selected: idle.selected,
          none: idle.selected === 0 ? 1 : 0,
          mindful: idle.mindful ? 1 : 0,
          ...(idle.banked !== null ? { banked: idle.banked } : {}),
        },
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: 'bubba-charisma',
      },
    ];
  },
});
