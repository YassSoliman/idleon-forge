// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'gamingImport',
  label: 'Gaming imports',
  entryLabel: 'import',
  scope: 'account',
  route: GOAL_ROUTES.gamingImport,
  list: ({ account }) => account?.gaming?.imports ?? [],
  // the parser drops the empty box, so the position is not stable: the game index sits in the sprite name
  key: (row) => /\d+/.exec(row.rawName)?.[0] ?? row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
