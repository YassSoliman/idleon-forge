// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'labBonus',
  label: 'Lab bonuses',
  entryLabel: 'lab bonus',
  scope: 'account',
  route: GOAL_ROUTES.labBonus,
  list: ({ account }) => account?.lab?.labBonuses ?? [],
  key: (row) => String(row.index),
  name: (row) => capitalizeFirst(cleanUnderscore(String(row.name ?? '').toLowerCase())),
  icon: (row) => `data/LabBonus${row.index}`,
  metrics: {
    // the Main frame lights a bonus up while a player connects to it
    active: { label: 'Active', value: (row) => (row.active ? 1 : 0), boolean: true }
  }
};
