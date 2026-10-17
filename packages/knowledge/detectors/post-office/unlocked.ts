// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Milestone: the Post Office is unlocked (some character finished Postboy Pablob's quest). The System
// registry's sharper unlock rule for `post-office` (M11 TR-9, US-5), replacing "World 1 reached".
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'post-office/unlocked',
  kind: 'milestone',
  system: 'post-office',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['account.postOffice', 'diagnostics'],
  examples: {
    fires: [
      {
        fixture: 'scrubbed-w3',
        mutate: (s) =>
          withAccount(s, { postOffice: s.account.postOffice && { ...s.account.postOffice, unlocked: true } }),
      },
    ],
    // Neither account has finished the quest.
    silent: [{ fixture: 'scrubbed-w2' }, { fixture: 'scrubbed-w3' }],
    unknown: [{ fixture: 'scrubbed-w2', mutate: (s) => withAccount(s, { postOffice: null }) }],
  },
  run({ state }) {
    const po = state.account.postOffice;
    if (!isKnown(state, 'account.postOffice') || po === null)
      return [{ subject: accountSubject, slots: {}, reached: 'unknown' as const }];
    return [
      { subject: accountSubject, slots: {}, reached: po.unlocked ? ('yes' as const) : ('no' as const) },
    ];
  },
});
