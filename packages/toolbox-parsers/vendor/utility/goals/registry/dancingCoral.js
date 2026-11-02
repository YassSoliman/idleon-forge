// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'dancingCoral',
  label: 'Dancing coral',
  entryLabel: 'dancing coral',
  scope: 'account',
  route: GOAL_ROUTES.dancingCoral,
  list: ({ account }) => account?.coralReef?.dancingCoral ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.coralName) || `Dancing coral ${row.index + 1}`,
  icon: (row) => `data/Coral${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
