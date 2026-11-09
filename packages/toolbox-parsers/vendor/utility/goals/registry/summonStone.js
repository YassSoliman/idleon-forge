// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
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
