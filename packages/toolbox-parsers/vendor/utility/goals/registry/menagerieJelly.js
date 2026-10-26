// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'menagerieJelly',
  label: 'Jellyfish',
  entryLabel: 'jellyfish',
  scope: 'account',
  route: GOAL_ROUTES.menagerieJelly,
  list: ({ account }) => (account?.menagerie?.jellies?.sideUnlocked ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => `${row.name} Jellyfish`,
  icon: (row) => `data/MenaJelly${row.index + 1}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
