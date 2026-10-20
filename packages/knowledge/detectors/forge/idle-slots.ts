// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-25 (US-20): unlocked Forge slots holding less than one bar's worth of ore, while the account holds
// an ore to load. Locked slots never count (Toolbox's own alert counts all 16 rows, dossier M21).
import { z } from 'zod';
import { accountSubject, COPPER, idleForge, isKnown, oreToLoad, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'forge/idle-slots',
  kind: 'check',
  system: 'forge',
  params: z.strictObject({}),
  slots: z
    .strictObject({ idle: z.number(), ore: z.string(), held: z.number(), bars: z.number(), more: z.number() })
    .partial(),
  reads: ['account.forge', 'diagnostics'],
  examples: {
    fires: [
      // US-20 m:fourth-forge-idle: 4 slots unlocked, all 4 empty, Copper Ore held.
      {
        fixture: 'fourth',
        mutate: (s) => idleForge(s, 4, [COPPER]),
        expect: { slots: { idle: 4, ore: 'Copper_Ore', held: 500, bars: 250 } },
      },
    ],
    // fourth.json: all 16 smelting. Nothing to load: silent.
    silent: [{ fixture: 'fourth' }, { fixture: 'fourth', mutate: (s) => idleForge(s, 4, []) }],
    unknown: [{ fixture: 'fourth', mutate: (s) => withUnknown(s, 'account.forge') }],
  },
  run({ state }) {
    if (!isKnown(state, 'account.forge'))
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const f = state.account.forge;
    if (!f) return [];
    const idle = f.slots.filter((s) => s.unlocked && !s.smelting).length;
    const load = oreToLoad(f);
    if (idle === 0 || !load) return [];
    return [
      {
        subject: accountSubject,
        slots: {
          idle,
          ore: load.pick.name,
          held: load.pick.amount,
          bars: Math.floor(load.pick.amount / load.pick.perBar),
          more: load.others.length,
        },
        result: 'fires' as const,
        doneKey: `forge-idle-${idle}`,
      },
    ];
  },
});
