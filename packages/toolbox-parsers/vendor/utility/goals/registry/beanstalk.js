// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { BEANSTALK_BREAKPOINTS, getBeanstalkFoods } from '@parsers/misc';
import { cleanUnderscore, notateNumber } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'beanstalk',
  label: 'Beanstalk',
  entryLabel: 'golden food',
  scope: 'account',
  route: GOAL_ROUTES.beanstalk,
  list: ({ account }) => getBeanstalkFoods(account?.sneaking?.beanstalkData),
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName ?? row.rawName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // one rank per breakpoint the page shows ("2.22K / 10K"); the last one maxes the food
    rank: { label: 'Rank', noun: 'rank', value: (row) => row.rank ?? 0, tiers: ['None', ...BEANSTALK_BREAKPOINTS.map((amount) => notateNumber(amount))] }
  }
};
