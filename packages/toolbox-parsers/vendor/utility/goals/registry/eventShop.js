// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getEventShopBonus, getEventShopItems } from '@parsers/misc';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';
import { OPT } from '@parsers/accountOptions';

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
      cost: { label: 'stars', icon: () => 'etc/Event_Currency', have: ({ account }) => account?.accountOptions?.[OPT.eventShopCurrency] ?? 0, price: (row) => row.price }
    }
  }
};
