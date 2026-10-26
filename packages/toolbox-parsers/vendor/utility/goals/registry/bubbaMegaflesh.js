// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

export default {
  system: 'bubbaMegaflesh',
  label: 'Megaflesh',
  entryLabel: 'Megaflesh',
  scope: 'account',
  route: GOAL_ROUTES.bubbaMegaflesh,
  list: ({ account }) => (account?.bubba?.megaFlesh ?? []).map((megaflesh, index) => ({ ...megaflesh, index })),
  key: (row) => String(row.index),
  // the first line of the catalog text; the second one prints the live bonus
  name: (row) => stableText(String(row.description ?? '').split('\n')[0]),
  icon: (row) => `data/BubbaMF${row.index}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
