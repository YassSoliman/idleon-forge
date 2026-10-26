// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

export default {
  system: 'coveUpgrade',
  label: 'Crystal Glunko Cove upgrades',
  entryLabel: 'Cove upgrade',
  scope: 'account',
  route: GOAL_ROUTES.coveUpgrade,
  groups: {
    label: 'Section',
    of: (row) => row.group,
    names: { crystal: 'Crystal upgrades', jeweled: 'Jeweled upgrades' }
  },
  list: ({ account }) => account?.hole?.caverns?.crystalGlunkoCove?.upgrades ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  // the gooey shape the upgrade is paid in, as on its card
  icon: (row) => `data/${row.shapeName}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
