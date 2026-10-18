// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 `classes.contribution.exp`: every fighter earns class EXP. Per character: its level, its
// class EXP per hour here (Toolbox kills/h × EXP per kill, ADR 0005 arithmetic) and the ETA to the next
// level. Whether this map is worth it (D3: at least half the character's best map) is the engine's,
// which has M5's sweep; the ratio is a param so it stays authored judgment.
import { z } from 'zod';
import {
  characterSubject,
  knownOn,
  PURPOSE_ENGINE_SLOTS,
  purposeGoalParam,
  withCharacter,
  withUnknown,
} from '../../src/helpers';
import { type ContributionFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'classes/exp',
  kind: 'contribution',
  system: 'classes',
  params: z.strictObject({ minRatio: z.number().min(0).max(1).default(0.5), ...purposeGoalParam }),
  slots: z
    .strictObject({
      saved: z.number(),
      rate: z.number(),
      exp: z.number(),
      expReq: z.number(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].level',
    'characters[*].classExp',
    'characters[*].fighting',
    'diagnostics',
  ],
  examples: {
    // W3-early Squire Lv 85: 1,065 kills/h × EXP per kill on Thermonuclear Climb.
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(3), expect: { slots: { saved: 85 } } }],
    silent: [
      // The W3-early Barbarian Lv 56 fishes: no class EXP from monsters.
      { fixture: 'scrubbed-w3', subject: characterSubject(4) },
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        mutate: (s) =>
          withCharacter(s, 3, {
            fighting: s.characters[3]?.fighting && { ...s.characters[3].fighting, finalKillsPerHour: 0 },
          }),
      },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        mutate: (s) => withUnknown(s, 'characters[3].classExp'),
      },
    ],
  },
  run({ state }) {
    return state.characters.flatMap((c): ContributionFinding[] => {
      if (c.afkType !== 'FIGHTING') return [];
      const subject = characterSubject(c.index);
      const f = c.fighting;
      const x = c.classExp;
      if (!knownOn(state, c, 'fighting', 'classExp') || !f || !x || f.expPerKill === null)
        return [{ subject, slots: {}, advances: 'unknown' as const }];
      const rate = f.finalKillsPerHour * f.expPerKill;
      const slots = { saved: c.level, rate, exp: x.exp, expReq: x.expReq };
      if (rate <= 0) return [{ subject, slots, advances: 'no' as const, etaMs: null }];
      const etaMs = Math.round((Math.max(0, x.expReq - x.exp) / rate) * 3_600_000);
      return [{ subject, slots, advances: 'yes' as const, etaMs }];
    });
  },
});
