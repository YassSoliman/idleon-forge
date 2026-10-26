// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'dust',
  label: 'Dust',
  entryLabel: 'dust',
  scope: 'account',
  route: GOAL_ROUTES.dust,
  // the parser builds one entry per dust name, in order
  list: ({ account }) => (account?.compass?.dusts ?? []).map((dust, index) => ({ ...dust, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `data/Dust${row.index}_x1`,
  metrics: {
    amount: { label: 'Held', value: (row) => Number(row.value) || 0 }
  }
};
