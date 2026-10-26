// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { findQuantityOwned } from '@parsers/items';
import { itemsArray } from '@website-data';
import { cleanUnderscore } from '@utility/helpers';
import { isTrackableItem } from '@utility/materialTracker';
import { GOAL_ROUTES } from '../routes';
import { itemIcon } from './itemIcon';
import { ownedItemsOf } from './ownedItems';
import { withUniqueNames } from './names';

const owned = (row, ctx) => findQuantityOwned(ownedItemsOf(ctx), row.displayName).amount ?? 0;

// Built once: the catalog does not change, and the search lists every row
let rows;
const trackableItems = () => {
  rows ??= withUniqueNames(itemsArray.filter(isTrackableItem), (row) => cleanUnderscore(row.displayName));
  return rows;
};

export default {
  system: 'item',
  label: 'Items',
  entryLabel: 'item',
  scope: 'account',
  route: GOAL_ROUTES.item,
  list: () => trackableItems(),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => itemIcon(row.rawName),
  // The catalog has items without art, so only owned ones are checked for an icon
  iconRows: (rows, ctx) => rows.filter((row) => owned(row, ctx) > 0),
  metrics: {
    quantity: {
      label: 'Quantity',
      value: owned,
      steps: [1000, 1000000]
    }
  }
};
