// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-8, FR-9: a Bubba Boon level is affordable, below 7 (each opens a new account bonus), or from 7
// on when it costs at most `share` of the next Megaflesh (Final rulings R-3, 10%). Silent while a
// Megaflesh fires: FR-7 spends the leftover on Boon first.
import { z } from 'zod';
import {
  accountSubject,
  BUBBA_READS,
  boonBuy,
  bubbaNow,
  UNKNOWN,
  UPG,
  unreadable,
  withMeat,
  withUpgrade,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/boon',
  kind: 'check',
  system: 'bubba',
  params: z.strictObject({ share: z.number().positive().max(1).default(0.1) }),
  slots: z.strictObject({ level: z.number(), cheap: z.number() }).partial(),
  reads: BUBBA_READS,
  examples: {
    fires: [
      { fixture: 'scrubbed-w3', mutate: (s) => withMeat(withUpgrade(s, UPG.boon, 4, 1e6), 100e6) },
      { fixture: 'scrubbed-w3', mutate: (s) => withUpgrade(s, UPG.boon, 11, 20e9) },
    ],
    silent: [
      { fixture: 'scrubbed-w3' },
      { fixture: 'latest' },
      // 50B is more than 10% of Megaflesh 4's 245B.
      { fixture: 'scrubbed-w3', mutate: (s) => withUpgrade(s, UPG.boon, 11, 50e9) },
    ],
    unknown: [
      { fixture: 'scrubbed-w3', mutate: unreadable },
      { fixture: 'scrubbed-w3', mutate: (s) => withUpgrade(s, UPG.boon, 11, null) },
    ],
  },
  run({ state, now }, { share }) {
    const n = bubbaNow(state, now);
    if (n === null) return [];
    const buy = n === 'unknown' ? 'unknown' : boonBuy(n, share);
    if (buy === null) return [];
    if (buy === 'unknown') return [UNKNOWN];
    return [
      {
        subject: accountSubject,
        slots: { level: buy.level, cheap: buy.mode === 'cheap' ? 1 : 0 },
        result: 'fires' as const,
        doneKey: 'bubba-boon',
      },
    ];
  },
});
