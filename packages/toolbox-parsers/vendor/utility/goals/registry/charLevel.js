// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'charLevel',
  label: 'Character level',
  entryLabel: 'level',
  scope: 'character',
  // one entry per character: the goal form picks it itself
  single: true,
  route: GOAL_ROUTES.charLevel,
  list: ({ character }) => (character ? [character] : []),
  key: () => 'level',
  name: () => 'Character level',
  icon: (row) => `data/ClassIcons${row.classIndex ?? 0}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
