// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'tome',
  label: 'Tome',
  entryLabel: 'Tome entry',
  scope: 'account',
  route: GOAL_ROUTES.tome,
  list: ({ account }) => account?.tome?.tome ?? [],
  key: (row) => String(row.tomeIndex),
  name: (row) => cleanUnderscore((row.name ?? '').replace('(Tap_for_more_info)', '')),
  // the page draws no picture per entry: the Tome page's own icon
  icon: () => 'etc/Tome_0',
  metrics: {
    quantity: { label: 'Quantity', value: (row) => row.quantity ?? 0 },
    points: {
      label: 'Points',
      value: (row) => row.points ?? 0,
      max: (row) => realCap(row.maxPoints)
    }
  }
};
