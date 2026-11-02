// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'chip',
  label: 'Lab chips',
  entryLabel: 'chip',
  scope: 'account',
  route: GOAL_ROUTES.chip,
  list: ({ account }) => account?.lab?.chips ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/ConsoleChip${row.index}`,
  metrics: {
    owned: { label: 'Owned', value: (row) => row.totalAmount ?? 0 }
  }
};
