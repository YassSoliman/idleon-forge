// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'bribe',
  label: 'Bribes',
  entryLabel: 'bribe',
  scope: 'account',
  route: GOAL_ROUTES.bribe,
  list: ({ account }) => (account?.bribes ?? []).map((bribe, index) => ({ ...bribe, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: () => 'etc/Bribe',
  metrics: {
    purchased: {
      label: 'Purchased',
      value: (row) => (row.done ? 1 : 0),
      boolean: true,
      verb: 'buy',
      // the Bribes page prices each bribe in coins
      cost: {
        label: 'coins',
        display: 'coins',
        have: ({ account }) => account?.currencies?.rawMoney ?? 0,
        price: (row) => row.price
      }
    }
  }
};
