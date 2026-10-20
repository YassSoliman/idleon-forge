// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: the Megafish count (`accountOptions[279]`, Toolbox getMegaFish), the progress of
// poppy.goal.megafish. Null while Poppy's pond is unread; nothing while it has never been reached.
import { z } from 'zod';
import { accountSubject, isKnown, withAccount } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'poppy/megafish',
  kind: 'progress',
  system: 'poppy',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['account.poppy', 'diagnostics'],
  examples: {
    fires: [{ fixture: 'highend', expect: { value: 26 } }],
    // first.json never reached Poppy's pond.
    silent: [{ fixture: 'first' }],
    unknown: [{ fixture: 'highend', mutate: (s) => withAccount(s, { poppy: null }) }],
  },
  run({ state }) {
    const p = state.account.poppy;
    if (!isKnown(state, 'account.poppy') || p == null || p.megafish === undefined)
      return [{ subject: accountSubject, slots: {}, value: null, reason: 'field-missing' as const }];
    if (!p.unlocked) return [];
    return [{ subject: accountSubject, slots: {}, value: p.megafish }];
  },
});
