// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 FR-18, TR-6: Poppy has fish waiting to convert. Fires when Poppy is unlocked, Toolbox's
// `pendingFish` is above 0, and Poppy has not been opened this Play Session (no earlier save in the
// session shows the pending fish dropping).
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'poppy/pending-fish',
  kind: 'check',
  system: 'poppy',
  params: z.strictObject({ sessionGapMs: z.int().positive().default(900_000) }),
  slots: z.strictObject({}),
  reads: ['account.poppy', 'account.lastCloudSave', 'diagnostics'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2' }, { fixture: 'scrubbed-w3' }],
    silent: [
      {
        fixture: 'scrubbed-w2',
        mutate: (s) => withAccount(s, { poppy: s.account.poppy && { ...s.account.poppy, pendingFish: 0 } }),
      },
    ],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { poppy: null }) }],
  },
  run({ state, history }, { sessionGapMs }) {
    const poppy = state.account.poppy;
    const saved = state.account.lastCloudSave;
    if (!isKnown(state, 'account.poppy') || poppy == null || saved == null)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (!poppy.unlocked || poppy.pendingFish <= 0) return [];
    // Converted this session: a later save in the session holds fewer pending fish than an earlier one.
    let t = saved;
    let later = poppy.pendingFish;
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (!h || t - h.lastCloudSave >= sessionGapMs) break;
      const p = h.state.account.poppy?.pendingFish;
      if (typeof p === 'number' && later < p) return [];
      if (typeof p === 'number') later = p;
      t = h.lastCloudSave;
    }
    return [
      {
        subject: accountSubject,
        slots: {},
        result: 'fires' as const,
        urgency: 'banked' as const,
        doneKey: 'poppy',
      },
    ];
  },
});
