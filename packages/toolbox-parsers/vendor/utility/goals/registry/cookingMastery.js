// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'cookingMastery',
  label: 'Cooking mastery',
  entryLabel: 'mastery category',
  scope: 'account',
  route: GOAL_ROUTES.cookingMastery,
  list: ({ account }) => account?.cooking?.cookingMastery?.categories ?? [],
  key: (row) => String(row.index),
  name: (row) => capitalizeFirst(cleanUnderscore(String(row.name ?? '').toLowerCase())),
  // the category cards have no art: the Cooking page icon stands in
  icon: () => 'data/ClassIcons51',
  metrics: {
    // the card's "Lv." is the points spent in it
    level: { label: 'Level', noun: 'level', value: (row) => row.points ?? 0 }
  }
};
