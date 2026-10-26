// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

const base = (row) => row.rawName.replace(/\.png$/, '');

export default {
  system: 'logBook',
  label: 'Log book',
  entryLabel: 'log book plant',
  scope: 'account',
  route: GOAL_ROUTES.logBook,
  list: ({ account }) => account?.gaming?.logBook ?? [],
  key: base,
  // GamingPlant<row letter><column>: row letter a is the first row
  name: (row) => {
    const [, letter, column] = /^GamingPlant([a-z])(\d+)$/.exec(base(row)) ?? [];
    return letter ? `Plant ${letter.charCodeAt(0) - 96}-${Number(column) + 1}` : base(row);
  },
  icon: (row) => `data/${base(row)}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' },
    crowned: { label: 'Crowned', value: (row) => (row.crowned ? 1 : 0), boolean: true }
  }
};
