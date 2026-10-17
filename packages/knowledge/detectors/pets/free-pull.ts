// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-12, TR-6: the free daily pet pull. Claimable once `freeClaimAnchor + periodMs ≤ now` (Toolbox
// getNextCompanionClaim; the period is an authored Toolbox-code constant). A missed day is not given
// back, so it is losing-now. Without the companions side read it is unknown, never "nothing to claim".
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'pets/free-pull',
  kind: 'check',
  system: 'pets',
  params: z.strictObject({
    // Toolbox utility/helpers.js FREE_COMPANION_CLAIM_ANCHOR_OFFSET_MS, found by experiment.
    periodMs: z.int().positive().default(594_000_000),
  }),
  slots: z.strictObject({ hoursClaimable: z.number() }).partial(),
  reads: ['account.pets', 'diagnostics'],
  examples: {
    // W2-late: claimable since about 15 h at its save.
    fires: [{ fixture: 'scrubbed-w2', expect: { urgency: 'losing-now', slots: { hoursClaimable: 15 } } }],
    // W3-early: the next pull is after the fixture's now.
    silent: [{ fixture: 'scrubbed-w3' }],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { pets: null }) }],
  },
  run({ state, now }, { periodMs }) {
    const pets = state.account.pets;
    if (!isKnown(state, 'account.pets') || pets == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const at = pets.freeClaimAnchor + periodMs;
    if (at > now) return [{ subject: accountSubject, slots: {}, result: 'pass' as const, nextChangeAt: at }];
    return [
      {
        subject: accountSubject,
        slots: { hoursClaimable: Math.round((now - at) / 3_600_000) },
        result: 'fires' as const,
        at,
        urgency: 'losing-now' as const,
        doneKey: 'free-pet-pull',
      },
    ];
  },
});
