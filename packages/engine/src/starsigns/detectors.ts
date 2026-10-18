// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16's engine Detectors (TR-4, M11 TR-4 `kind: 'engine'`), behind the Detector contract so `kb check`
// runs their examples on the scrubbed saves and records what they read. The Goals themselves are built
// by the engine module (module.ts), which also reads M2's result; these return the save-only parts.
import { defineDetector } from '@idleon-forge/knowledge';
import { z } from 'zod';

const slots = z.strictObject({ text: z.string(), why: z.string() });

export const telescopeDetector = defineDetector({
  id: 'star-signs/telescope',
  kind: 'engine',
  system: 'star-signs',
  params: z.strictObject({}),
  slots,
  reads: ['account.starSigns', 'characters[*].telescopeRoute'],
  examples: {
    fires: [{ fixture: 'scrubbed-w2', expect: { questDone: false } }],
    silent: [{ fixture: 'scrubbed-w3' }],
  },
  run: ({ state }) => {
    const s = state.account.starSigns;
    if (s?.telescopeQuestDone !== false) return [];
    const open = state.characters.filter((c) => c.telescopeRoute?.every((d) => d === 0)).length;
    return [{ questDone: false, opened: open }];
  },
});

export const constellationsDetector = defineDetector({
  id: 'star-signs/constellations',
  kind: 'engine',
  system: 'star-signs',
  params: z.strictObject({}),
  slots,
  reads: ['account.starSigns'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { done: 1 } }],
    silent: [],
  },
  run: ({ state }) => {
    const s = state.account.starSigns;
    if (!s) return [];
    return [{ done: s.claimed.length, points: s.pointsUnspent }];
  },
});

export const signsDetector = defineDetector({
  id: 'star-signs/signs',
  kind: 'engine',
  system: 'star-signs',
  params: z.strictObject({}),
  slots,
  reads: ['account.starSigns', 'characters[*].starSigns'],
  examples: {
    fires: [{ fixture: 'scrubbed-w3', expect: { unlocked: 4 } }],
    silent: [],
  },
  run: ({ state }) => {
    const s = state.account.starSigns;
    if (!s) return [];
    return [{ unlocked: s.unlocked.length, worn: state.characters.map((c) => c.starSigns?.length ?? 0) }];
  },
});
