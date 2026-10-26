// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const CATEGORIES = ['combat', 'skills', 'misc'];

export default {
  system: 'stamp',
  label: 'Stamps',
  entryLabel: 'stamp',
  scope: 'account',
  route: GOAL_ROUTES.stamp,
  groups: {
    label: 'Category',
    of: (row) => row.category,
    names: { combat: 'Combat', skills: 'Skills', misc: 'Misc' }
  },
  list: ({ account }) => CATEGORIES.flatMap((category) =>
    // the Stamps page marks a stamp exalted by its position in the category
    (account?.stamps?.[category] ?? []).map((stamp, index) => ({
      ...stamp,
      category,
      exalted: account?.compass?.exaltedStamps?.[category]?.[index] ? 1 : 0
    }))),
  key: (row) => `${row.category}:${row.rawName}`,
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // No max: maxLevel is only the gold cap, which materials raise without limit
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level,
      steps: [10, 50]
    },
    exalted: { label: 'Exalted', value: (row) => row.exalted, boolean: true }
  }
};
