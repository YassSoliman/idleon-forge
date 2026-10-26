// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { spelunkingRocks } from '@website-data';
import { number2letter } from '@utility/helpers';
import { stableText, withUniqueNames } from './names';

const CAVE_NAMES = Object.fromEntries(spelunkingRocks.map((_, cave) => [String(cave), `Cave ${cave + 1}`]));

export default {
  system: 'discovery',
  label: 'Discoveries',
  entryLabel: 'discovery',
  scope: 'account',
  route: GOAL_ROUTES.discovery,
  groups: {
    label: 'Cave',
    of: (row) => String(row.cave),
    names: CAVE_NAMES
  },
  // each cave's last rock is its lore boss, which has its own system
  list: ({ account }) => withUniqueNames(
    (account?.spelunking?.discoveries ?? []).flatMap((rocks, cave) =>
      (rocks ?? []).slice(0, -1).map((row) => ({ ...row, cave }))),
    (row) => stableText(row.name)
  ),
  key: (row) => `${row.cave}:${row.name}`,
  name: (row) => row.goalName,
  icon: (row) => `data/CaveRock${number2letter[row.cave]}${row.index}`,
  metrics: {
    found: { label: 'Found', value: (row) => (row.acquired ? 1 : 0), boolean: true }
  }
};
