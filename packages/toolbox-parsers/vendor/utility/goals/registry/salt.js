// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'salt',
  label: 'Salts',
  entryLabel: 'salt',
  scope: 'account',
  route: GOAL_ROUTES.salt,
  list: ({ account }) => account?.refinery?.salts ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.saltName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    rank: {
      label: 'Rank',
      noun: 'rank',
      value: (row) => row.rank ?? 0,
      steps: [10, 25]
    }
  }
};
