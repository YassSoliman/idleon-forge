// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'emperor',
  label: 'Emperor',
  entryLabel: 'emperor',
  scope: 'account',
  route: GOAL_ROUTES.emperor,
  list: ({ account }) => (account?.emperor ? [account.emperor] : []),
  key: () => 'emperor',
  name: () => 'Emperor showdown',
  // the page's own icon for its attempts cards
  icon: () => 'data/GemP45',
  metrics: {
    showdown: { label: 'Highest showdown', value: (row) => row.highestEmperorShowdown ?? 0 }
  }
};
