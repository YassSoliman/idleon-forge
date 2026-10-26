// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

export default {
  system: 'jar',
  label: 'Jars',
  entryLabel: 'jar',
  scope: 'account',
  route: GOAL_ROUTES.jar,
  list: ({ account }) => (account?.hole?.caverns?.theJars?.jars ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => stableText(row.name),
  icon: (row) => `etc/Jar_${row.index}`,
  metrics: {
    // the card's "Jars destroyed"
    destroyed: { label: 'Jars destroyed', value: (row) => row.destroyed ?? 0 }
  }
};
