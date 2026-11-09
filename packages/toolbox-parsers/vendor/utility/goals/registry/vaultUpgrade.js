// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanUpgradeName } from './names';

export default {
  system: 'vaultUpgrade',
  label: 'Upgrade vault',
  entryLabel: 'vault upgrade',
  scope: 'account',
  route: GOAL_ROUTES.vaultUpgrade,
  list: ({ account }) => account?.upgradeVault?.upgrades ?? [],
  key: (row) => String(row.index),
  name: (row) => cleanUpgradeName(row.name),
  icon: (row) => `data/VaultUpg${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
