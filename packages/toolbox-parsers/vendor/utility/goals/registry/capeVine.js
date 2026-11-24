// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'capeVine',
  label: 'Cape Vine',
  entryLabel: 'cape',
  scope: 'account',
  route: GOAL_ROUTES.capeVine,
  list: ({ account }) => account?.capeVine?.allCapes ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName || row.rawName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    acquired: {
      label: 'On the vine',
      value: (row) => (row.isAcquired ? 1 : 0),
      boolean: true,
      verb: 'own'
    }
  }
};
