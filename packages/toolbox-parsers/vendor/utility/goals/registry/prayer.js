// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'prayer',
  label: 'Prayers',
  entryLabel: 'prayer',
  scope: 'account',
  route: GOAL_ROUTES.prayer,
  list: ({ account }) => account?.prayers ?? [],
  key: (row) => String(row.prayerIndex),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/Prayer${row.prayerIndex}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
