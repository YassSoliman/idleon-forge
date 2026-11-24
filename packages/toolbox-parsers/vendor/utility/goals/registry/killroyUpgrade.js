// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'killroyUpgrade',
  label: 'Killroy upgrades',
  entryLabel: 'Killroy upgrade',
  scope: 'account',
  route: GOAL_ROUTES.killroyUpgrade,
  // built 1:1 from a fixed array in the parser, so the position is the key
  list: ({ account }) => (account?.killroy?.upgrades ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => row.upgrade ?? row.description,
  icon: (row) => `etc/Killroy_${row.index}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
