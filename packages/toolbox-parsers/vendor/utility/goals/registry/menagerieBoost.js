// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { getMenagerieBoostText } from '@parsers/world-7/menagerie';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'menagerieBoost',
  label: 'Menagerie boosts',
  entryLabel: 'Menagerie boost',
  scope: 'account',
  route: GOAL_ROUTES.menagerieBoost,
  // the parser's description has the live value filled in, so the name comes from the catalog text
  list: ({ account }) => withUniqueNames(
    account?.menagerie?.boosts ?? [],
    (row) => stableText(getMenagerieBoostText(row.index))
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MenaIconP${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
