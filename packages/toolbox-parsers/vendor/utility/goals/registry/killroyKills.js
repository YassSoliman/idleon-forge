// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'killroyKills',
  label: 'Killroy kills',
  entryLabel: 'monster',
  scope: 'account',
  route: GOAL_ROUTES.killroyKills,
  list: ({ account }) => account?.killroy?.list ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name ?? row.rawName),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    kills: {
      label: 'Kills',
      value: (row) => Number(row.killRoyKills) || 0,
      steps: [1000, 10000]
    }
  }
};
