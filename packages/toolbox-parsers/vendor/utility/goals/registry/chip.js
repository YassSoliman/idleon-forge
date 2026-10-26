// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'chip',
  label: 'Lab chips',
  entryLabel: 'chip',
  scope: 'account',
  route: GOAL_ROUTES.chip,
  list: ({ account }) => account?.lab?.chips ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/ConsoleChip${row.index}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => row.totalAmount ?? 0 }
  }
};
