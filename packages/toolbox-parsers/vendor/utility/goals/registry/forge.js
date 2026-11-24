// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';

export default {
  system: 'forge',
  label: 'Forge upgrades',
  entryLabel: 'forge upgrade',
  scope: 'account',
  route: GOAL_ROUTES.forge,
  // the parser builds this 1:1 from its upgrade catalog, so the position is the key
  list: ({ account }) => (account?.forge?.upgrades ?? []).map((upgrade, index) => ({ ...upgrade, index })),
  key: (row) => String(row.index),
  name: (row) => row.name,
  icon: () => 'data/ForgeA',
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
