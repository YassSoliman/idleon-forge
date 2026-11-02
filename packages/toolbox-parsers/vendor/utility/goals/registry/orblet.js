// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanText } from './names';

export default {
  system: 'orblet',
  label: 'Orblet market',
  entryLabel: 'orblet upgrade',
  scope: 'account',
  route: GOAL_ROUTES.orblet,
  list: ({ account }) => account?.royalGuardian?.orbletMarket ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  icon: () => 'data/Orblet',
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
