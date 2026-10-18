// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4: the progress of a Death Note ladder (`death-note.goal.<mob>`): the account's kills of that
// monster, summed over every character (Toolbox `deathNote[world].mobs`, looked up by rawName).
import { z } from 'zod';
import { accountSubject, isKnown, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'death-note/kills-of-monster',
  kind: 'progress',
  system: 'death-note',
  params: z.strictObject({ monster: z.string().min(1) }),
  slots: z.strictObject({}),
  reads: ['account.deathNote', 'diagnostics'],
  examples: {
    // W3-early: ~12.8k Sand Castle kills (M4 US-3).
    fires: [{ fixture: 'scrubbed-w3', params: { monster: 'sandcastle' }, expect: { value: 12806 } }],
    silent: [],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        params: { monster: 'sandcastle' },
        mutate: (s) => withUnknown(s, 'account.deathNote'),
      },
    ],
  },
  run({ state }, { monster }) {
    const pages = state.account.deathNote;
    const mob = pages
      ? Object.values(pages)
          .flatMap((p) => p.mobs)
          .find((m) => m.rawName === monster)
      : undefined;
    if (!isKnown(state, 'account.deathNote') || !pages)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    // A monster no page lists (a W5+ mob, a mini-boss) has no answer here.
    if (!mob) return [{ subject: accountSubject, slots: {}, value: null, reason: 'not-applicable' as const }];
    return [{ subject: accountSubject, slots: {}, value: Math.floor(mob.kills) }];
  },
});
