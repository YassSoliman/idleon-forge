// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-11 (Final rulings R-1): pat Bubba, then buy Open Gift, only when Beeg Slice is picked (the one
// gift whose trigger uses the happiness-boosted rate), a pat is left (F-h) and Open Gift is affordable.
// `untilStops` 1: no pats-per-refill number, but a refill is due, so at least one pat is certain.
import { z } from 'zod';
import {
  accountSubject,
  BUBBA_READS,
  bubbaNow,
  patGift,
  UNKNOWN,
  unreadable,
  withGifts,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/pat-gift',
  kind: 'check',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z.strictObject({ pats: z.number(), untilStops: z.number() }).partial(),
  reads: BUBBA_READS,
  examples: {
    fires: [{ fixture: 'latest', mutate: (s) => withGifts(s, 1, 5) }, { fixture: 'scrubbed-w3' }],
    silent: [
      { fixture: 'latest' },
      // Beach Ball and Numbahs: their triggers ignore happiness (F-h).
      { fixture: 'scrubbed-w3', mutate: (s) => withGifts(s, 2, 3) },
    ],
    unknown: [{ fixture: 'latest', mutate: unreadable }],
  },
  run({ state, now }) {
    const n = bubbaNow(state, now);
    if (n === null) return [];
    const p = n === 'unknown' ? 'unknown' : patGift(n);
    if (p === null) return [];
    if (p === 'unknown') return [UNKNOWN];
    return [
      {
        subject: accountSubject,
        slots: { pats: p.pats ?? 0, untilStops: p.pats === null ? 1 : 0 },
        result: 'fires' as const,
        doneKey: 'bubba-pat',
      },
    ];
  },
});
