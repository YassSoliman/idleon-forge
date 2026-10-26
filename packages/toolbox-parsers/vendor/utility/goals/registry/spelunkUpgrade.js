// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { UNCAPPED_MAX_LEVEL } from '@parsers/world-7/spelunking';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'spelunkUpgrade',
  label: 'Spelunking upgrades',
  entryLabel: 'spelunking upgrade',
  scope: 'account',
  route: GOAL_ROUTES.spelunkUpgrade,
  list: ({ account }) => withUniqueNames(account?.spelunking?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.originalIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/CaveShopUpg${row.originalIndex}`,
  metrics: {
    // a level can be -1 in the save before the first purchase
    level: { label: 'Level', noun: 'level', value: (row) => Math.max(0, row.level ?? 0), max: (row) => realCap(row.x3, UNCAPPED_MAX_LEVEL) }
  }
};
