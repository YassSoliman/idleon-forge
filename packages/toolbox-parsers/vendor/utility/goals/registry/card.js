// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

const STAR_TIERS = ['None', ...Array.from({ length: 7 }, (_, i) => `${i + 1}★`)];

// a few saves hold the count as a numeric string
const copies = (row) => Number(row.amount) || 0;

export default {
  system: 'card',
  label: 'Cards',
  entryLabel: 'card',
  scope: 'account',
  route: GOAL_ROUTES.card,
  list: ({ account }) => Object.values(account?.cards ?? {}),
  key: (row) => String(row.cardIndex),
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/2Cards${row.cardIndex}`,
  metrics: {
    // stars is 0-indexed and meaningless while no copy is owned
    stars: {
      label: 'Stars',
      value: (row) => (copies(row) > 0 ? (row.stars ?? 0) + 1 : 0),
      tiers: STAR_TIERS
    },
    amount: { label: 'Copies', value: copies, steps: [10, 100] }
  }
};
