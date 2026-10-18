// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-7: the next Megaflesh is affordable at the projected meat (F-b). The engine adds FR-7's details
// (the leftover's Boon and Fun Gifts buys, the restart, the Charisma reset) from the same reading.
import { z } from 'zod';
import {
  accountSubject,
  BUBBA_READS,
  bubbaNow,
  megafleshPlan,
  UNKNOWN,
  UPG,
  unreadable,
  withMeat,
  withUpgrade,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/megaflesh',
  kind: 'check',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z.strictObject({ next: z.number(), boonBuys: z.number(), funGiftBuys: z.number() }).partial(),
  reads: BUBBA_READS,
  examples: {
    fires: [{ fixture: 'scrubbed-w3', mutate: (s) => withMeat(s, 260e9) }],
    silent: [{ fixture: 'scrubbed-w3' }, { fixture: 'latest' }, { fixture: 'scrubbed-w2' }],
    unknown: [
      { fixture: 'scrubbed-w3', mutate: unreadable },
      { fixture: 'scrubbed-w3', mutate: (s) => withUpgrade(s, UPG.megaflesh, 3, null) },
    ],
  },
  run({ state, now }) {
    const n = bubbaNow(state, now);
    if (n === null) return [];
    const plan = n === 'unknown' ? 'unknown' : megafleshPlan(n);
    if (plan === null) return [];
    if (plan === 'unknown') return [UNKNOWN];
    return [
      {
        subject: accountSubject,
        slots: { next: plan.next, boonBuys: plan.boonBuys.length, funGiftBuys: plan.funGiftBuys.length },
        result: 'fires' as const,
        doneKey: 'bubba-megaflesh',
      },
    ];
  },
});
