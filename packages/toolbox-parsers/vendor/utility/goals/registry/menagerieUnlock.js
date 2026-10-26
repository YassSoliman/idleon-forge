// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { getMenagerieUnlockText } from '@parsers/world-7/menagerie';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'menagerieUnlock',
  label: 'Menagerie unlocks',
  entryLabel: 'Menagerie unlock',
  scope: 'account',
  route: GOAL_ROUTES.menagerieUnlock,
  // the parser's name has the live drop chance filled in, so the name comes from the catalog text
  list: ({ account }) => withUniqueNames(
    account?.menagerie?.unlocks ?? [],
    (row) => stableText(getMenagerieUnlockText(row.index))
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MenaIconO${row.index}`,
  metrics: {
    owned: {
      label: 'Owned',
      value: (row) => (row.owned ? 1 : 0),
      boolean: true,
      verb: 'buy',
      cost: { label: 'lumi', icon: () => 'etc/Lumi', have: ({ account }) => account?.menagerie?.lumi ?? 0, price: (row) => row.cost }
    }
  }
};
