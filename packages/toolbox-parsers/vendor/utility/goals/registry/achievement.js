// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { isRealAchievement } from '@parsers/achievements';

export default {
  system: 'achievement',
  label: 'Achievements',
  entryLabel: 'achievement',
  scope: 'account',
  route: GOAL_ROUTES.achievement,
  // built 1:1 from the catalog, so the position is the key; the page hides the unreleased slots
  list: ({ account }) => (account?.achievements ?? [])
    .map((achievement, index) => ({ ...achievement, index }))
    .filter(isRealAchievement),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    completed: { label: 'Completed', value: (row) => (row.completed ? 1 : 0), boolean: true }
  }
};
