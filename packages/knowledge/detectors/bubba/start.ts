// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-4, FR-5: Bubba is open but never started (1st Slice 0, Megaflesh 0, Boon 0, meat at most 1), or
// a Megaflesh set 1st Slice back to 0, so Bubba makes nothing (`losing-now`, M17 FR-17: wasting).
import { z } from 'zod';
import {
  accountSubject,
  BUBBA_READS,
  bubbaNow,
  justReset,
  neverStarted,
  startOf,
  UNKNOWN,
  unreadable,
} from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/start',
  kind: 'check',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z.strictObject({ restart: z.number() }).partial(),
  reads: BUBBA_READS,
  examples: {
    fires: [
      { fixture: 'scrubbed-w3', mutate: neverStarted },
      { fixture: 'scrubbed-w3', mutate: justReset },
    ],
    silent: [{ fixture: 'scrubbed-w3' }, { fixture: 'scrubbed-w2' }, { fixture: 'latest' }],
    unknown: [{ fixture: 'scrubbed-w3', mutate: unreadable }],
  },
  run({ state, now }) {
    const n = bubbaNow(state, now);
    if (n === null) return [];
    if (n === 'unknown') return [UNKNOWN];
    const mode = startOf(n);
    if (mode === null) return [];
    return [
      {
        subject: accountSubject,
        slots: { restart: mode === 'restart' ? 1 : 0 },
        result: 'fires' as const,
        ...(mode === 'restart' ? { urgency: 'losing-now' as const } : {}),
        doneKey: 'bubba-start',
      },
    ];
  },
});
