// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getEventShopBonus, getEventShopItems } from '@parsers/misc';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'eventShop',
  label: 'Event shop bonuses',
  entryLabel: 'event shop bonus',
  scope: 'account',
  route: GOAL_ROUTES.eventShop,
  // the catalog position is the bonus id
  list: ({ account }) => withUniqueNames(getEventShopItems().map(({ text, price }, index) => ({
    index,
    price: Number(price),
    title: cleanUnderscore(String(text).split('@')[0]).trim(),
    owned: getEventShopBonus(account, index)
  })), (row) => row.title),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/EventShopBuy${row.index}`,
  metrics: {
    owned: {
      label: 'Owned',
      value: (row) => row.owned,
      boolean: true,
      verb: 'buy',
      // bought with the stars the event shop page counts
      cost: { label: 'stars', icon: () => 'etc/Event_Currency', have: ({ account }) => account?.accountOptions?.[310] ?? 0, price: (row) => row.price }
    }
  }
};
