// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'jellyUpgrade',
  label: 'Jelly Operator upgrades',
  entryLabel: 'Jelly Operator upgrade',
  scope: 'account',
  route: GOAL_ROUTES.jellyUpgrade,
  // the page lists by display order; id is the game's upgrade id
  list: ({ account }) => withUniqueNames(account?.jellyOperator?.upgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.id),
  name: (row) => row.goalName,
  icon: (row) => `data/JellyUpg${row.id}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
