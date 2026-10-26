// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { constructionMasteryThresholds } from '@parsers/world-3/construction';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'constructMastery',
  label: 'Construct mastery',
  entryLabel: 'construct mastery',
  scope: 'account',
  route: GOAL_ROUTES.constructMastery,
  list: ({ account }) => (account?.towers ? [{ totalLevels: account.towers.totalLevels ?? 0 }] : []),
  key: () => 'construct',
  name: () => 'Construct mastery',
  // the tab has no art of its own; the Construction skill icon stands in
  icon: () => 'data/ClassIcons49',
  metrics: {
    level: { label: 'Construct LV', value: (row) => row.totalLevels, steps: constructionMasteryThresholds },
    rank: {
      label: 'Mastery',
      value: (row) => constructionMasteryThresholds.filter((lv) => row.totalLevels >= lv).length,
      tiers: ['None', ...constructionMasteryThresholds.map((lv) => `Lv. ${lv}`)]
    }
  }
};
