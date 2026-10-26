// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanText } from './names';

export default {
  system: 'statueFlair',
  label: 'Statue flair',
  entryLabel: 'statue flair',
  scope: 'account',
  route: GOAL_ROUTES.statueFlair,
  list: ({ account }) => account?.royalGuardian?.statueFlair?.statues ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  // the page draws no picture per statue: the marble the flair costs
  icon: (row) => `data/${row.costItem}`,
  metrics: {
    // maxLevel is the current cap, raised by a Menagerie unlock
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
