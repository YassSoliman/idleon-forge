// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4: the progress of a portal ladder (`portals.goal.map-<i>`): a character's kills toward the
// first door of the map it hasn't opened (the last door's kills once every door is open). Door kills
// are the door's requirement minus the raw kills left (`KillsLeft2Advance`, M4 TR-2). Only characters
// standing on the map have an answer; the others are silent.
import { z } from 'zod';
import {
  characterSubject,
  doorKills,
  isKnown,
  portalDoors,
  purposeGoal,
  withUnknown,
} from '../../src/helpers';
import { defineDetector, type ProgressFinding } from '../../src/types';

export default defineDetector({
  id: 'portals/kills-on-map',
  kind: 'progress',
  system: 'portals',
  params: z.strictObject({ map: z.int().min(0) }),
  slots: z.strictObject({}),
  reads: ['characters[*].index', 'characters[*].mapIndex', 'characters[*].portalKillsLeft', 'diagnostics'],
  examples: {
    // W2-late Barbarian Lv 60 on Poopy Sewers: 2,814 of 20,000 (M4 US-3); W3-early Squire Lv 85: 19 of 15,000 (US-6).
    fires: [
      { fixture: 'scrubbed-w2', params: { map: 8 }, expect: { value: 2814 } },
      { fixture: 'scrubbed-w3', params: { map: 109 }, expect: { value: 19 } },
    ],
    silent: [],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { map: 8 },
        mutate: (s) => withUnknown(s, 'characters[0].portalKillsLeft'),
      },
    ],
  },
  run(ctx, { map }) {
    const { state } = ctx;
    const doors = portalDoors(purposeGoal(ctx, `portals.goal.map-${map}`));
    return state.characters.flatMap((c): ProgressFinding[] => {
      if (c.mapIndex !== map) return [];
      const subject = characterSubject(c.index);
      const left = c.portalKillsLeft;
      if (!isKnown(state, `characters[${c.index}].portalKillsLeft`) || !left || doors.length === 0)
        return [{ subject, slots: {}, value: null, reason: 'field-missing' as const }];
      return [{ subject, slots: {}, value: doorKills(doors, left).current }];
    });
  },
});
