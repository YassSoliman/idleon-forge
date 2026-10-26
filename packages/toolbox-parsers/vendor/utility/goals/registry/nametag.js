// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'nametag',
  label: 'Gallery nametags',
  entryLabel: 'nametag',
  scope: 'account',
  route: GOAL_ROUTES.nametag,
  // the page sorts owned nametags first, so the position moves; rawName is the key
  list: ({ account }) => withUniqueNames(
    account?.gallery?.allNametags ?? [],
    (row) => stableText(row.displayName || row.rawName)
  ),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // only owned nametags carry a level
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
