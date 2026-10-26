// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
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
