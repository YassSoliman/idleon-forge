// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { HIDDEN_INVENTORY_BAG } from '@parsers/character';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'bag',
  label: 'Inventory bags',
  entryLabel: 'bag',
  scope: 'character',
  route: GOAL_ROUTES.bag,
  list: ({ character }) => (character?.invBagsUsed ?? []).filter(({ displayName }) => displayName !== HIDDEN_INVENTORY_BAG),
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.displayName),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => (row.acquired ? 1 : 0), boolean: true, verb: 'own' }
  }
};
