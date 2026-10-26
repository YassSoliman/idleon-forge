// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getAllItems } from '@parsers/items';

// getAllItems walks every inventory, storage and the forge. Goal resolving, the material tracker and the dashboard
// alerts all ask for it with the same parsed objects, so one list is kept per (account, characters) pair.
const cache = new WeakMap();

export const getCachedAllItems = (characters, account) => {
  if (!account || typeof account !== 'object') return getAllItems(characters, account);
  const cached = cache.get(account);
  if (cached?.characters === characters) return cached.items;
  const items = getAllItems(characters, account);
  cache.set(account, { characters, items });
  return items;
};

export const ownedItemsOf = ({ account, characters }) => getCachedAllItems(characters, account);
