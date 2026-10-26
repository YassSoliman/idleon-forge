// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

export default {
  system: 'sneakUpgrade',
  label: 'Sneaking upgrades',
  entryLabel: 'sneaking upgrade',
  scope: 'account',
  route: GOAL_ROUTES.sneakUpgrade,
  // the page hides the "Name" placeholders; the key stays the catalog position
  list: ({ account }) => withUniqueNames(
    (account?.sneaking?.upgrades ?? []).map((row, pos) => ({ ...row, pos })).filter((row) => row.name !== 'Name'),
    (row) => cleanUnderscore(row.name ?? '')
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `data/NjUpgI${row.pos}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
