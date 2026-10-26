// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'tachyon',
  label: 'Tachyons',
  entryLabel: 'tachyon',
  scope: 'account',
  route: GOAL_ROUTES.tachyon,
  // the parser builds one entry per tachyon color, in order
  list: ({ account }) => (account?.tesseract?.tachyons ?? []).map((tachyon, index) => ({ ...tachyon, index })),
  key: (row) => String(row.index),
  name: (row) => `${row.name} tachyon`,
  icon: (row) => `data/Tach${row.index}_x1`,
  metrics: {
    amount: { label: 'Held', value: (row) => Number(row.value) || 0 }
  }
};
