// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'lootPile',
  label: 'Loot pile',
  entryLabel: 'loot',
  scope: 'account',
  route: GOAL_ROUTES.lootPile,
  list: ({ account }) => account?.sailing?.lootPile ?? [],
  key: (row) => row.rawName,
  name: (row) => `Loot ${Number(row.rawName.replace(/\D/g, '')) + 1}`,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    amount: { label: 'Amount', value: (row) => row.amount ?? 0 }
  }
};
