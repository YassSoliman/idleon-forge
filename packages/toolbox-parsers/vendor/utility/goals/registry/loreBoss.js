// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { MAX_GRAND_DISCOVERIES } from '@parsers/world-7/spelunking';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'loreBoss',
  label: 'Lore bosses',
  entryLabel: 'lore boss',
  scope: 'account',
  route: GOAL_ROUTES.loreBoss,
  // the parser drops the numeric placeholder rows; index is the cave
  list: ({ account }) => withUniqueNames(account?.spelunking?.loreBosses ?? [], (row) => stableText(row.description)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/CaveBoss${row.index}`,
  metrics: {
    defeated: { label: 'Defeated', value: (row) => (row.defeated ? 1 : 0), boolean: true },
    grandDiscoveries: {
      label: 'Grand discoveries',
      value: (row) => row.grandDiscoveriesFound ?? 0,
      max: () => MAX_GRAND_DISCOVERIES
    }
  }
};
