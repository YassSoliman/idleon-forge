// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'god',
  label: 'Gods',
  entryLabel: 'god',
  scope: 'account',
  route: GOAL_ROUTES.god,
  list: ({ account }) => account?.divinity?.deities ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    level: {
      label: 'Blessing level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
