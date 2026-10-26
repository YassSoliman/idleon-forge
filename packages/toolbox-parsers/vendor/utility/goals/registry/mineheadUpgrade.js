// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'mineheadUpgrade',
  label: 'Minehead upgrades',
  entryLabel: 'Minehead upgrade',
  scope: 'account',
  route: GOAL_ROUTES.mineheadUpgrade,
  // the catalog has one row with no max level; the key stays the catalog index
  list: ({ account }) => withUniqueNames(
    (account?.minehead?.upgrades ?? []).filter((row) => row.maxLevel > 0),
    (row) => stableText(row.name)
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MineUpg${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel, 999) }
  }
};
