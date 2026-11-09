// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'kitchen',
  label: 'Kitchens',
  entryLabel: 'kitchen',
  scope: 'account',
  route: GOAL_ROUTES.kitchen,
  list: ({ account }) => account?.cooking?.kitchens ?? [],
  key: (row) => String(row.kitchenIndex),
  name: (row) => `Kitchen ${row.kitchenIndex + 1}`,
  // the page draws no picture per kitchen: the Cooking page's own icon
  icon: () => 'data/ClassIcons51',
  metrics: {
    speed: { label: 'Speed', value: (row) => row.speedLv ?? 0, steps: [10, 50] },
    fire: { label: 'Fire', value: (row) => row.fireLv ?? 0, steps: [10, 50] },
    luck: { label: 'Luck', value: (row) => row.luckLv ?? 0, steps: [10, 50] }
  }
};
