// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-10: the Smoker has smoked long enough for its best quality (Toolbox's SMOKER_MAX_QUALITY_SECONDS)
// and a Smoker level is affordable. Silent with Slabcakes picked (holding the timer at max feeds every
// Open Gift a top meat) and while a Megaflesh fires (a claim before the reset is wiped). No urgency: only
// time is lost (D-13).
import { z } from 'zod';
import {
  accountSubject,
  BUBBA_READS,
  bubbaNow,
  smokerClaim,
  UNKNOWN,
  UPG,
  unreadable,
  withGifts,
  withUpgrade,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/smoker',
  kind: 'check',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z.strictObject({ freeRoll: z.number() }).partial(),
  reads: BUBBA_READS,
  examples: {
    fires: [{ fixture: 'latest', mutate: (s) => withGifts(s, 1, 6) }],
    silent: [{ fixture: 'latest' }, { fixture: 'highend' }, { fixture: 'scrubbed-w3' }],
    unknown: [
      { fixture: 'latest', mutate: unreadable },
      { fixture: 'latest', mutate: (s) => withUpgrade(withGifts(s, 1, 6), UPG.smoker, 44, null) },
    ],
  },
  run({ state, now }) {
    const n = bubbaNow(state, now);
    if (n === null) return [];
    const claim = n === 'unknown' ? 'unknown' : smokerClaim(n);
    if (claim === null) return [];
    if (claim === 'unknown') return [UNKNOWN];
    return [
      {
        subject: accountSubject,
        slots: { freeRoll: claim.freeRoll ? 1 : 0 },
        result: 'fires' as const,
        doneKey: 'bubba-smoker',
      },
    ];
  },
});
