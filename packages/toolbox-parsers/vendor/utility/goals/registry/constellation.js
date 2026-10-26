// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'constellation',
  label: 'Constellations',
  entryLabel: 'constellation',
  scope: 'account',
  route: GOAL_ROUTES.constellation,
  list: ({ account }) => withUniqueNames(account?.constellations ?? [], (row) => cleanUnderscore(row.name)),
  // the parser reads the save by rawIndex, falling back to the map
  key: (row) => String(row.rawIndex ?? row.mapIndex),
  name: (row) => row.goalName,
  icon: (row) => `etc/Constellation_${row.rawIndex ?? row.mapIndex}`,
  metrics: {
    done: { label: 'Completed', value: (row) => (row.done ? 1 : 0), boolean: true }
  }
};
