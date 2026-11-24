// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'jarCollectible',
  label: 'Jar collectibles',
  entryLabel: 'collectible',
  scope: 'account',
  route: GOAL_ROUTES.jarCollectible,
  list: ({ account }) => (account?.hole?.caverns?.theJars?.collectibles ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `data/HoleJarC${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
