// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'island',
  label: 'Islands',
  entryLabel: 'island',
  scope: 'account',
  route: GOAL_ROUTES.island,
  list: ({ account }) => (account?.islands?.list ?? []).map((island, index) => ({ ...island, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `data/IslandSail${row.index}`,
  metrics: {
    unlocked: {
      label: 'Unlocked',
      value: (row) => (row.unlocked ? 1 : 0),
      boolean: true,
      verb: 'unlock',
      // the Islands page prices each locked island in bottles
      cost: { label: 'bottles', have: ({ account }) => account?.islands?.bottles ?? 0, price: (row) => row.cost }
    }
  }
};
