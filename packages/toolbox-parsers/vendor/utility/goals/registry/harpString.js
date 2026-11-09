// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { HARP_STRING_LETTERS, harpNoteIcon } from '@parsers/world-5/caverns/the-harp';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'harpString',
  label: 'Harp strings',
  entryLabel: 'string',
  scope: 'account',
  route: GOAL_ROUTES.harpString,
  list: ({ account }) => (account?.hole?.caverns?.theHarp?.chords ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => `${HARP_STRING_LETTERS[row.index]} string`,
  icon: (row) => harpNoteIcon(row.index),
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
