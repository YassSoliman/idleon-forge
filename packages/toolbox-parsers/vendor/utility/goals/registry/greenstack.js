// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { findQuantityOwned } from '@parsers/items';
import { isCountedGreenstack } from '@parsers/misc';
import { createGoal, MAX_TARGET } from '../store';
import { GOAL_ROUTES } from '../routes';
import { itemIcon } from './itemIcon';
import { ownedItemsOf } from './ownedItems';

export const GREENSTACK_AMOUNT = 10e6;

export const greenstackGoal = () =>
  createGoal({ system: 'greenstack', kind: 'all', metric: 'quantity', target: MAX_TARGET });

export default {
  system: 'greenstack',
  label: 'Greenstacks',
  entryLabel: 'greenstack',
  scope: 'account',
  route: GOAL_ROUTES.greenstack,
  list: ({ account }) => (account?.looty?.slabItems ?? []).filter(isCountedGreenstack),
  key: (row) => row.itemRawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => itemIcon(row.rawName),
  metrics: {
    quantity: {
      label: 'Quantity',
      // The game keeps an item greenstacked after the stack drops below 10M
      value: (row, ctx) => row.greenStacked
        ? GREENSTACK_AMOUNT
        : Math.min(findQuantityOwned(ownedItemsOf(ctx), row.name).amount ?? 0, GREENSTACK_AMOUNT),
      max: () => GREENSTACK_AMOUNT,
      steps: [1000000, GREENSTACK_AMOUNT]
    }
  }
};
