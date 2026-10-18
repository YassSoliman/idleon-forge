// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 FR-2 (milestone): Bubba opens for a character once it has opened YumYum Grotto's door to World 3
// (N.js `Bubbastuff("BubbaUnlocked") = KillsLeft2Advance[50][0] <= 0`, the logged-in character's), so the
// account counts as unlocked when any character has. `no` only when every character is readable.
import { z } from 'zod';
import { accountSubject, doorsUnknown, unlockOf } from '../../src/helpers';
import { defineDetector } from '../../src/types';

export default defineDetector({
  id: 'bubba/unlocked',
  kind: 'milestone',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['characters[*].doorKillsLeft', 'characters[*].index', 'diagnostics'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3' }, { fixture: 'latest' }, { fixture: 'highend' }],
    silent: [{ fixture: 'scrubbed-w2' }],
    unknown: [{ fixture: 'scrubbed-w2', mutate: doorsUnknown }],
  },
  run({ state }) {
    return [{ subject: accountSubject, slots: {}, reached: unlockOf(state).state }];
  },
});
