// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers, withUniqueNames } from './names';

export default {
  system: 'farmMarket',
  label: 'Farming market',
  entryLabel: 'market upgrade',
  scope: 'account',
  route: GOAL_ROUTES.farmMarket,
  groups: {
    label: 'Market',
    of: (row) => (row.pos < 8 ? 'day' : 'night'),
    names: { day: 'Day market', night: 'Night market' }
  },
  list: ({ account }) => withUniqueNames(
    (account?.farming?.market ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => titleCaseTiers(row.name)
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  // the page draws the crop each upgrade is paid in
  icon: (row) => `data/${row.pos < 8 ? `FarmCrop${row.type}` : 'FarmCropBean'}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLvl)
    }
  }
};
