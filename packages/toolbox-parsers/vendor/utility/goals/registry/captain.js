// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'captain',
  label: 'Captains',
  entryLabel: 'captain',
  scope: 'account',
  route: GOAL_ROUTES.captain,
  list: ({ account }) => account?.sailing?.captains ?? [],
  key: (row) => String(row.captainIndex),
  name: (row) => `Captain ${row.captainIndex}`,
  // an empty slot draws the type 0 portrait, as on the page
  icon: (row) => `etc/Captain_${row.captainType === -1 ? 0 : row.captainType}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
