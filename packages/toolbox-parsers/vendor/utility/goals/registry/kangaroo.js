// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUpgradeName } from './names';

const LISTS = [
  { list: 'upgrades', letter: 'a' },
  { list: 'tarUpgrades', letter: 'b' }
];

export default {
  system: 'kangaroo',
  label: 'Poppy upgrades',
  entryLabel: 'Poppy upgrade',
  scope: 'account',
  route: GOAL_ROUTES.kangaroo,
  groups: {
    label: 'Page',
    of: (row) => row.list,
    names: { upgrades: 'Upgrades', tarUpgrades: 'Tar pit' }
  },
  // both lists are built 1:1 from their catalogs in the parser, so the position is the key
  list: ({ account }) => LISTS.flatMap(({ list, letter }) => (account?.kangaroo?.[list] ?? [])
    .map((upgrade, pos) => ({ ...upgrade, list, pos, letter }))),
  key: (row) => `${row.list}:${row.pos}`,
  name: (row) => cleanUpgradeName(row.name),
  icon: (row) => `etc/KUpg${row.letter}_${row.pos}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
