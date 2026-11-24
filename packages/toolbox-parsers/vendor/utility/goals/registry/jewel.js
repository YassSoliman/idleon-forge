// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'jewel',
  label: 'Lab jewels',
  entryLabel: 'jewel',
  scope: 'account',
  route: GOAL_ROUTES.jewel,
  list: ({ account }) => account?.lab?.jewels ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  // the catalog rows carry no rawName when logged out
  icon: (row) => `data/ConsoleJwl${row.index}`,
  metrics: {
    acquired: { label: 'Acquired', value: (row) => (row.acquired ? 1 : 0), boolean: true, verb: 'own' }
  }
};
