// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'storageChest',
  label: 'Storage chests',
  entryLabel: 'storage chest',
  scope: 'account',
  route: GOAL_ROUTES.storageChest,
  list: ({ account }) => account?.storage?.storageChests ?? [],
  key: (row) => row.rawName,
  name: (row) => capitalizeFirst(cleanUnderscore(row.displayName).toLowerCase()),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'own' }
  }
};
