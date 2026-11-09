// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'glimbo',
  label: 'Glimbo trades',
  entryLabel: 'Glimbo trade',
  scope: 'account',
  route: GOAL_ROUTES.glimbo,
  // a trade is named after the vault upgrade it raises
  list: ({ account }) => withUniqueNames(
    account?.minehead?.glimbo ?? [],
    (row) => stableText(row.upgradeName) || stableText(row.itemName) || `Trade ${row.index + 1}`
  ),
  key: (row) => String(row.vaultIdx),
  name: (row) => row.goalName,
  icon: (row) => `data/VaultUpg${row.vaultIdx}`,
  metrics: {
    trades: { label: 'Trades', value: (row) => row.trades ?? 0 }
  }
};
