// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'dungeonItem',
  label: 'Dungeon items',
  entryLabel: 'dungeon item',
  scope: 'account',
  route: GOAL_ROUTES.dungeonItem,
  list: ({ account }) => account?.dungeons?.rngItems ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/DungItems${row.index}`,
  metrics: {
    // the game keeps -1 for an item you have not found yet; the page shows 0
    level: { label: 'Level', noun: 'level', value: (row) => Math.max(0, row.level ?? 0), max: (row) => realCap(row.maxLevel) }
  }
};
