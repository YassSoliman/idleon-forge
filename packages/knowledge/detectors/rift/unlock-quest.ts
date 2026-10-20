// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-11, US-1: the Rift is locked on an account in World 4: the Rift Ripper's quest "Entering The
// Rift..." (5 Lost Batteries, 878 Purple Mush Cap, 592 Wurm Tail, consumed) is done on no character.
// The slots count what is still short of each item, over the storage chest and every bag.
import { z } from 'zod';
import { accountSubject, isKnown, RIFT_READS, riftOf, withUnknown } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'rift/unlock-quest',
  kind: 'check',
  system: 'rift',
  params: z.strictObject({}),
  slots: z
    .strictObject({ batteries: z.number(), caps: z.number(), tails: z.number(), short: z.number() })
    .partial(),
  reads: [...RIFT_READS, 'account.storageItems', 'characters[*].inventoryItems'],
  examples: {
    // W4-entry: no character has done the Rift Ripper's quest.
    fires: [{ fixture: 'first', subject: accountSubject }],
    silent: [
      { fixture: 'fourth' },
      { fixture: 'highend' },
      // Late W3: no World 4 yet.
      { fixture: 'scrubbed-w3' },
    ],
    unknown: [{ fixture: 'first', mutate: (s) => withUnknown(s, 'account.rift') }],
  },
  run({ state }) {
    const r = riftOf(state);
    if (r === 'unknown')
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    if (r === null || r.unlocked) return [];
    const world = isKnown(state, 'account.currentWorld') ? state.account.currentWorld : null;
    if (world === null || world === undefined || world < 4) return [];
    const chest = isKnown(state, 'account.storageItems') ? state.account.storageItems : null;
    if (!chest)
      return [
        { subject: accountSubject, slots: {}, result: 'unknown' as const, reason: 'field-missing' as const },
      ];
    const held = (raw: string) =>
      (chest[raw] ?? 0) + state.characters.reduce((n, c) => n + (c.inventoryItems?.[raw] ?? 0), 0);
    const left = (raw: string) => {
      const item = r.questItems.find((i) => i.rawName === raw);
      return item ? Math.max(0, item.amount - held(raw)) : 0;
    };
    const slots = {
      batteries: left('GalaxyA2b'),
      caps: left('GalaxyA1'),
      tails: left('GalaxyB2'),
      short: r.questItems.filter((i) => left(i.rawName) > 0).length,
    };
    return [{ subject: accountSubject, slots, result: 'fires' as const, doneKey: 'rift-ripper' }];
  },
});
