// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4: the progress of the class level ladder (`classes.goal.level`): each character's class level.
import { z } from 'zod';
import { characterSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'classes/level',
  kind: 'progress',
  system: 'classes',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['characters[*].index', 'characters[*].level', 'diagnostics'],
  examples: {
    // W3-early: the Squire Lv 85 (M4 US-6).
    fires: [{ fixture: 'scrubbed-w3', expect: { value: 85 } }],
    silent: [],
    unknown: [{ fixture: 'scrubbed-w3', mutate: (s) => withUnknown(s, 'characters[3].level') }],
  },
  run({ state }) {
    return state.characters.map((c) => {
      const subject = characterSubject(c.index);
      if (!isKnown(state, `characters[${c.index}].level`))
        return { subject, slots: {}, value: null, reason: 'field-missing' as const };
      return { subject, slots: {}, value: c.level };
    });
  },
});
