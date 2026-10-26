// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'royalStatue',
  label: 'Royal statues',
  entryLabel: 'royal statue',
  scope: 'account',
  route: GOAL_ROUTES.royalStatue,
  // the unreleased statues have only a number for a name; the page marks them "Unreleased"
  list: ({ account }) => withUniqueNames(
    (account?.royalGuardian?.royalStatues ?? []).filter(({ named }) => named),
    // the name text starts with the bonus value placeholder
    (row) => stableText(row.rawName).replace(/^N /, '')
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/${row.costItem}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
