// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

// The material types the character bags page shows a capacity for; bCraft is the crafting materials pouch
const typeName = (type) => (type === 'bCraft' ? 'Materials' : type);

export default {
  system: 'carryCapacity',
  label: 'Carry capacity',
  entryLabel: 'material type',
  scope: 'character',
  route: GOAL_ROUTES.carryCapacity,
  list: ({ character }) => character?.carryCapBags ?? [],
  key: (row) => row.Class,
  name: (row) => typeName(row.Class),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    // the number printed under each pouch on the bags view
    capacity: { label: 'Capacity per slot', value: (row) => row.capacityPerSlot ?? 0 }
  }
};
