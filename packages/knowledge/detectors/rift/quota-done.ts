// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11: this Rift level's quota is met (game `RiftCompleted`: `Rift[1] >= quota`). V1 (game client):
// the level never advances by itself; a character walks into the portal in The Rift, which sets
// `Rift[0] + 1`. Until then the task takes no more progress, so AFK kills on The Rift are wasted.
import { z } from 'zod';
import { accountSubject, atRift, RIFT_READS, riftOf, shownLevel, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'rift/quota-done',
  kind: 'check',
  system: 'rift',
  params: z.strictObject({}),
  slots: z.strictObject({ level: z.number(), next: z.number(), afk: z.number() }).partial(),
  reads: [...RIFT_READS],
  examples: {
    fires: [
      {
        fixture: 'fourth',
        mutate: (s) => atRift(s, 9, 200000, { afkOnRift: [0] }),
        expect: { slots: { level: 10, next: 11, afk: 1 } },
      },
    ],
    silent: [{ fixture: 'fourth' }, { fixture: 'highend' }, { fixture: 'first' }],
    unknown: [{ fixture: 'fourth', mutate: (s) => withUnknown(s, 'account.rift') }],
  },
  run({ state }) {
    const r = riftOf(state);
    if (r === 'unknown')
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (!r?.unlocked || !r.complete) return [];
    const n = r.afkOnRift.length;
    return [
      {
        subject: accountSubject,
        slots: { level: shownLevel(r), next: shownLevel(r) + 1, afk: n },
        result: 'fires' as const,
        urgency: n > 0 ? ('losing-now' as const) : ('banked' as const),
        doneKey: `rift-done-${r.level}`,
      },
    ];
  },
});
