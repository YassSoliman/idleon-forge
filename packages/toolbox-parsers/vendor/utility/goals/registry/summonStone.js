// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'summonStone',
  label: 'Summoning stones',
  entryLabel: 'stone',
  scope: 'account',
  route: GOAL_ROUTES.summonStone,
  list: ({ account }) => account?.summoning?.summoningStones ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name ?? row.stoneName ?? ''),
  icon: (row) => `etc/SumStone_${row.index}`,
  metrics: {
    kills: { label: 'Kills', value: (row) => row.kills ?? 0 }
  }
};
