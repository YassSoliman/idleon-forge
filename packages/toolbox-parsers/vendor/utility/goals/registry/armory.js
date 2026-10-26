// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { ARMORY_PLACEHOLDER, realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

export default {
  system: 'armory',
  label: 'Royal Armory',
  entryLabel: 'upgrade',
  scope: 'account',
  route: GOAL_ROUTES.armory,
  list: ({ account }) => (account?.royalGuardian?.armory?.upgrades ?? []).filter(({ slot }) => slot >= 0),
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  icon: (row) => `data/${row.costResourceRawName}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level,
      max: (row) => realCap(row.maxLevel, ARMORY_PLACEHOLDER)
    }
  }
};
