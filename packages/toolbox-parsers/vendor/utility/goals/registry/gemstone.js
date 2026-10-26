// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GEMSTONE_MAX_VALUE } from '@parsers/world-6/sneaking';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'gemstone',
  label: 'Gemstones',
  entryLabel: 'gemstone',
  scope: 'account',
  route: GOAL_ROUTES.gemstone,
  list: ({ account }) => account?.sneaking?.gemStones ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    value: { label: 'Gems', value: (row) => row.baseValue ?? 0, max: () => GEMSTONE_MAX_VALUE }
  }
};
