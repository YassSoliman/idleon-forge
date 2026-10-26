// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { PAGES } from '@components/constants';
import { getTabs } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

// The Explore tab's nested cavern tabs, in game order (the cavern index)
const cavernTabs = () => getTabs(PAGES.ACCOUNT['world 5'].categories, 'hole', 'Explore');
const titleCase = (str) => str.split(' ').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');

export default {
  system: 'cavern',
  label: 'Caverns',
  entryLabel: 'cavern',
  scope: 'account',
  route: GOAL_ROUTES.cavern,
  list: ({ account }) => cavernTabs().map((tab, index) => ({
    index,
    name: titleCase(tab),
    opals: account?.hole?.holesObject?.opalsPerCavern?.[index] || 0
  })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: (row) => `etc/Cavern_${row.index}`,
  metrics: {
    opals: { label: 'Opals found', value: (row) => row.opals }
  }
};
