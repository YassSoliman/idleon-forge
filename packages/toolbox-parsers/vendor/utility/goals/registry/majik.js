// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

const TREES = ['Hole', 'Village', 'Idleon'];
const TREE_LETTERS = ['A', 'B', 'C'];

export default {
  system: 'majik',
  label: 'Majiks',
  entryLabel: 'majik',
  scope: 'account',
  route: GOAL_ROUTES.majik,
  groups: {
    label: 'Tree',
    of: (row) => String(row.tree),
    names: { 0: 'Hole', 1: 'Village', 2: 'Idleon' }
  },
  list: ({ account }) => (account?.hole?.majiks ?? []).flatMap((majiks, tree) =>
    (majiks ?? []).map((majik, pos) => ({ ...majik, tree, pos }))),
  key: (row) => `${row.tree}:${row.pos}`,
  // unreleased slots all share the name "Confused Bonus"
  name: (row) => {
    const name = cleanUnderscore(row.name);
    return name === 'Confused Bonus' ? `${name} (${TREES[row.tree]} ${row.pos + 1})` : name;
  },
  icon: (row) => `data/HoleUIcosmoUpg${TREE_LETTERS[row.tree]}1`,
  metrics: {
    level: {
      label: 'Points invested',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
