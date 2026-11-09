// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
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
