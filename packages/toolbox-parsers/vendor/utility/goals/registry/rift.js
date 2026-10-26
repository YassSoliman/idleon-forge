// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'rift',
  label: 'Rift',
  entryLabel: 'Rift',
  scope: 'account',
  route: GOAL_ROUTES.rift,
  list: ({ account }) => (account?.rift ? [account.rift] : []),
  key: () => 'rift',
  name: () => 'Rift level',
  icon: () => 'data/Mface75',
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.currentRift ?? 0,
      max: (row) => row.list?.length || null
    }
  }
};
