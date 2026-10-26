// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'farmPlot',
  label: 'Farming plots',
  entryLabel: 'plot',
  scope: 'account',
  route: GOAL_ROUTES.farmPlot,
  list: ({ account }) => account?.farming?.plot ?? [],
  key: (row) => String(row.index),
  name: (row) => `Plot ${row.index + 1}`,
  // the seed the plot card shows
  icon: (row) => `etc/Seed_${row.seedType ?? 0}`,
  metrics: {
    rank: { label: 'Land rank', noun: 'rank', value: (row) => row.rank ?? 0 },
    og: { label: 'OG', value: (row) => row.currentOG ?? 0 }
  }
};
