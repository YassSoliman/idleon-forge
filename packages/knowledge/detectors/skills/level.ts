// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4: the progress of a skill ladder (`skills.goal.door-<skill>`, `skills.goal.tool-<skill>`): each
// character's level in that skill (Toolbox `skillsInfo.<skill>.level`).
import { z } from 'zod';
import { characterSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'skills/level',
  kind: 'progress',
  system: 'skills',
  params: z.strictObject({ skill: z.enum(['mining', 'chopping', 'fishing', 'catching']) }),
  slots: z.strictObject({}),
  reads: ['characters[*].index', 'characters[*].skillLevels', 'diagnostics'],
  examples: {
    // W2-late Squire Lv 43: Mining 20 (M4 US-4); W3-early Barbarian Lv 56: Fishing 22.
    fires: [
      { fixture: 'scrubbed-w2', params: { skill: 'mining' }, expect: { value: 20 } },
      { fixture: 'scrubbed-w3', params: { skill: 'fishing' }, expect: { value: 22 } },
    ],
    silent: [],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        params: { skill: 'mining' },
        mutate: (s) => withUnknown(s, 'characters[1].skillLevels'),
      },
    ],
  },
  run({ state }, { skill }) {
    return state.characters.map((c) => {
      const subject = characterSubject(c.index);
      const v = c.skillLevels?.[skill];
      if (!isKnown(state, `characters[${c.index}].skillLevels`) || v === undefined)
        return { subject, slots: {}, value: null, reason: 'field-missing' as const };
      return { subject, slots: {}, value: v };
    });
  },
});
