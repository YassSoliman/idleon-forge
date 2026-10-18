// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 `portals.contribution.push`: a fighter on a map with a door it hasn't opened advances that
// map's portal ladder. Per character: its kills toward the first unopened door and its kill rate. Whether
// it counts (M2's pusher on M2's frontier map, D5) and M2's ETA are applied by M4's engine, which has M2's
// result; a Detector never sees the Stage (TR-5).
import { z } from 'zod';
import {
  characterSubject,
  doorKills,
  isKnown,
  knownOn,
  PURPOSE_ENGINE_SLOTS,
  portalDoors,
  purposeGoal,
  purposeGoalParam,
  withUnknown,
} from '../../src/helpers';
import { type ContributionFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'portals/push',
  kind: 'contribution',
  system: 'portals',
  params: z.strictObject({ ...purposeGoalParam }),
  slots: z
    .strictObject({
      saved: z.number(),
      rate: z.number(),
      rule: z.number(),
      door: z.number(),
      map: z.string(),
      ...PURPOSE_ENGINE_SLOTS,
    })
    .partial(),
  reads: [
    'characters[*].index',
    'characters[*].afkType',
    'characters[*].mapIndex',
    'characters[*].currentMap',
    'characters[*].portalKillsLeft',
    'characters[*].fighting',
    'diagnostics',
  ],
  examples: {
    // W3-early Squire Lv 85 on Thermonuclear Climb: 19 of 15,000 (M4 US-6).
    fires: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: { goal: 'portals.goal.map-109' },
        expect: { slots: { saved: 19, rate: 1065, door: 0 } },
      },
    ],
    // W2-late Bowman Lv 54 on Spore Meadows: its only door is open (32 of 21).
    silent: [
      { fixture: 'scrubbed-w2', subject: characterSubject(3), params: { goal: 'portals.goal.map-1' } },
    ],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(3),
        params: { goal: 'portals.goal.map-109' },
        mutate: (s) => withUnknown(s, 'characters[3].portalKillsLeft'),
      },
    ],
  },
  run(ctx, { goal }) {
    const { state } = ctx;
    const g = purposeGoal(ctx, goal);
    const map = typeof g?.values?.map === 'number' ? g.values.map : null;
    const doors = portalDoors(g);
    if (map === null || doors.length === 0) return [];
    return state.characters.flatMap((c): ContributionFinding[] => {
      if (c.afkType !== 'FIGHTING' || c.mapIndex !== map) return [];
      const subject = characterSubject(c.index);
      const left = c.portalKillsLeft;
      if (
        !isKnown(state, `characters[${c.index}].portalKillsLeft`) ||
        !left ||
        !knownOn(state, c, 'fighting')
      )
        return [{ subject, slots: {}, advances: 'unknown' as const }];
      const k = doorKills(doors, left);
      const rate = c.fighting?.finalKillsPerHour ?? 0;
      const slots = {
        saved: k.current,
        rate,
        rule: 1,
        door: k.next ?? doors.length - 1,
        map: c.currentMap ?? '',
      };
      if (k.next === null) return [{ subject, slots, advances: 'no' as const }];
      const need = (doors[k.next]?.requirement ?? 0) - k.current;
      return [
        {
          subject,
          slots,
          advances: rate > 0 ? ('yes' as const) : ('no' as const),
          etaMs: rate > 0 ? Math.round((need / rate) * 3_600_000) : null,
        },
      ];
    });
  },
});
