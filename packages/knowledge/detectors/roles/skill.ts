// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M4 TR-4, TR-5 the roles skill Contribution: a character doing the skill an active M2 Role gives it (the
// Barbarian fishing, the Bowman catching) serves the team by doing its job (D6). This Detector only
// matches the AFK type; whether the character holds that Role is M2's (`meta.roles`), applied by M4's
// engine, since a Detector never sees the Stage or the Roles (TR-5).
import { z } from 'zod';
import {
  characterSubject,
  isKnown,
  PURPOSE_ENGINE_SLOTS,
  purposeGoalParam,
  withUnknown,
} from '../../src/helpers';
import { type ContributionFinding, defineDetector } from '../../src/types';

export default defineDetector({
  id: 'roles/skill',
  kind: 'contribution',
  system: 'roles',
  params: z.strictObject({
    afkType: z.enum(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']),
    ...purposeGoalParam,
  }),
  slots: z.strictObject({ rule: z.number(), ...PURPOSE_ENGINE_SLOTS }).partial(),
  reads: ['characters[*].index', 'characters[*].afkType', 'diagnostics'],
  examples: {
    // W3-early Barbarian Lv 56 fishes on Salty Shores (M4 US-4).
    fires: [{ fixture: 'scrubbed-w3', subject: characterSubject(4), params: { afkType: 'FISHING' } }],
    silent: [{ fixture: 'scrubbed-w3', subject: characterSubject(3), params: { afkType: 'FISHING' } }],
    unknown: [
      {
        fixture: 'scrubbed-w3',
        subject: characterSubject(4),
        params: { afkType: 'FISHING' },
        mutate: (s) => withUnknown(s, 'characters[4].afkType'),
      },
    ],
  },
  run({ state }, { afkType }) {
    return state.characters.flatMap((c): ContributionFinding[] => {
      const subject = characterSubject(c.index);
      if (!isKnown(state, `characters[${c.index}].afkType`))
        return [{ subject, slots: {}, advances: 'unknown' as const }];
      return c.afkType === afkType ? [{ subject, slots: { rule: 1 }, advances: 'yes' as const }] : [];
    });
  },
});
