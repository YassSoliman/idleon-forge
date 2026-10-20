// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11, US-3: this Rift level is a score task on an elite class (Orb on a Divine Knight, Pirate
// Flag on a Siege Breaker, Wormhole on an Elemental Sorcerer; game client RiftStuff tasks 6-8) and no
// character is that elite or a class it promotes to. The Rift stops here until one is.
import { z } from 'zod';
import { accountSubject, atRift, RIFT_READS, riftOf, shownLevel, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

const GAME: Record<string, string> = {
  Divine_Knight: 'Orb',
  Siege_Breaker: 'Pirate Flag',
  Elemental_Sorcerer: 'Wormhole',
};

export default defineDetector({
  id: 'rift/class-gate',
  kind: 'check',
  system: 'rift',
  params: z.strictObject({}),
  slots: z
    .strictObject({ level: z.number(), score: z.string(), class: z.string(), quota: z.number() })
    .partial(),
  reads: [...RIFT_READS, 'characters[*].class'],
  examples: {
    // fourth.json has no Divine Knight: level 7 (shown 8) is an Orb score on one.
    fires: [
      {
        fixture: 'fourth',
        mutate: (s) =>
          atRift(s, 7, 0, { elites: { Divine_Knight: [], Siege_Breaker: [], Elemental_Sorcerer: [] } }),
        expect: { slots: { level: 8, score: 'Orb', class: 'Divine_Knight', quota: 180 } },
      },
    ],
    silent: [
      // first.json has a Divine Knight.
      { fixture: 'first', mutate: (s) => atRift(s, 7, 0) },
      { fixture: 'fourth' },
      { fixture: 'highend' },
    ],
    unknown: [{ fixture: 'fourth', mutate: (s) => withUnknown(s, 'account.rift') }],
  },
  run({ state }) {
    const r = riftOf(state);
    if (r === 'unknown')
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const t = r?.task;
    if (!r?.unlocked || !t || t.kind !== 'score' || !t.elite || r.complete) return [];
    if ((r.elites[t.elite] ?? []).length > 0) return [];
    return [
      {
        subject: accountSubject,
        slots: { level: shownLevel(r), score: GAME[t.elite] ?? 'score', class: t.elite, quota: t.quota ?? 0 },
        result: 'fires' as const,
        doneKey: `rift-gate-${r.level}`,
      },
    ];
  },
});
