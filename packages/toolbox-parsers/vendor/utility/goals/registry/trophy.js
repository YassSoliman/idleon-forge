// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'trophy',
  label: 'Gallery trophies',
  entryLabel: 'trophy',
  scope: 'account',
  route: GOAL_ROUTES.trophy,
  // the page sorts owned trophies first, so the position moves; rawName is the key
  list: ({ account }) => withUniqueNames(
    account?.gallery?.allTrophies ?? [],
    (row) => stableText(row.displayName || row.rawName)
  ),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    acquired: { label: 'Acquired', value: (row) => (row.isAcquired ? 1 : 0), boolean: true, verb: 'own' }
  }
};
