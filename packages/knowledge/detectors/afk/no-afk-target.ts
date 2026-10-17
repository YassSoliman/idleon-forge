// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 FR-12: a character with no AFK Target earns nothing while you're away. `Paying_Respect` (a W5
// monument) is a deliberate activity and never fires (RT-23). A present-state Check: it fires whatever
// the Expected Return.
import { z } from 'zod';
import { characterSubject, isKnown, withCharacter, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'afk/no-afk-target',
  kind: 'check',
  system: 'afk',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['characters[*].index', 'characters[*].afkType', 'diagnostics'],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(3),
        mutate: (s) => withCharacter(s, 3, { afkType: 'Nothing', afkTarget: null }),
      },
    ],
    silent: [{ fixture: 'scrubbed-w2' }, { fixture: 'scrubbed-w3' }],
    unknown: [
      {
        fixture: 'scrubbed-w2',
        subject: characterSubject(0),
        mutate: (s) => withUnknown(s, 'characters[0].afkType'),
      },
    ],
  },
  run({ state }) {
    return state.characters.map((c) => {
      const subject = characterSubject(c.index);
      if (!isKnown(state, `characters[${c.index}].afkType`) || c.afkType === null)
        return { subject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const };
      if (c.afkType === 'Nothing') return { subject, slots: {}, result: 'fires' as const, fixHolds: true };
      return { subject, slots: {}, result: 'pass' as const };
    });
  },
});
