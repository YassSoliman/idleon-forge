// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'boat',
  label: 'Boats',
  entryLabel: 'boat',
  scope: 'account',
  route: GOAL_ROUTES.boat,
  list: ({ account }) => account?.sailing?.boats ?? [],
  key: (row) => String(row.boatIndex),
  name: (row) => `Boat ${row.boatIndex + 1}`,
  icon: (row) => `etc/${row.rawName}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 },
    loot: { label: 'Loot level', noun: 'level', value: (row) => row.lootLevel ?? 0 },
    speed: { label: 'Speed level', noun: 'level', value: (row) => row.speedLevel ?? 0 }
  }
};
