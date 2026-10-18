// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23's engine Detector (TR-4, M11 TR-4 `kind: 'engine'`): `bubba.goal.visit`'s progress, behind the
// Detector contract so `kb check` records what it reads. The Goal itself is built by the engine module
// (module.ts) from the six Bubba Checks; this returns the save-only part (is there a Bubba to visit).
import { defineDetector } from '@idleon-forge/knowledge';
import { bubbaNow } from '@idleon-forge/knowledge/helpers';
import { z } from 'zod';

export const visitDetector = defineDetector({
  id: 'bubba/visit',
  kind: 'engine',
  system: 'bubba',
  params: z.strictObject({}),
  slots: z.strictObject({}),
  reads: ['account.bubba', 'account.lastCloudSave', 'characters[*].doorKillsLeft', 'characters[*].index'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { open: true } }],
    silent: [{ fixture: 'scrubbed-w2' }],
  },
  run: ({ state, now }) => {
    const n = bubbaNow(state, now);
    return n === null || n === 'unknown' ? [] : [{ open: true }];
  },
});
