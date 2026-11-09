// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'hatRack',
  label: 'Hat Rack',
  entryLabel: 'premium helmet',
  scope: 'account',
  route: GOAL_ROUTES.hatRack,
  list: ({ account }) => account?.hatRack?.allPremiumHelmets ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName || row.rawName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    acquired: {
      label: 'Acquired',
      value: (row) => (row.isAcquired ? 1 : 0),
      boolean: true,
      verb: 'own'
    }
  }
};
