// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'sushiUpgrade',
  label: 'Sushi Station upgrades',
  entryLabel: 'Sushi Station upgrade',
  scope: 'account',
  route: GOAL_ROUTES.sushiUpgrade,
  // the page lists by display order; upgradeIndex is the game's upgrade id
  list: ({ account }) => withUniqueNames(account?.sushiStation?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.upgradeIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/SushiUpg${row.upgradeIndex}`,
  metrics: {
    // endless upgrades carry Infinity
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(Number.isFinite(row.maxLevel) ? row.maxLevel : null) }
  }
};
