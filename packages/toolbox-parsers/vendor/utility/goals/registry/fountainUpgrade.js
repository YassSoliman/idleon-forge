// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { FOUNTAIN_WATER_NAMES } from '@parsers/world-5/caverns/the-fountain';
import { cleanText } from './names';

export default {
  system: 'fountainUpgrade',
  label: 'Fountain upgrades',
  entryLabel: 'fountain upgrade',
  scope: 'account',
  route: GOAL_ROUTES.fountainUpgrade,
  groups: {
    label: 'Water',
    of: (row) => String(row.tier),
    names: { ...FOUNTAIN_WATER_NAMES }
  },
  // the waters the page draws (placeholder waters are left out); the key is water:upgrade
  list: ({ account }) => (account?.hole?.caverns?.theFountain?.waters ?? [])
    .filter(({ implemented }) => implemented)
    .flatMap(({ tier, upgrades }) => (upgrades ?? []).map((row) => ({ ...row, tier }))),
  key: (row) => `${row.tier}:${row.index}`,
  name: (row) => cleanText(row.name),
  icon: (row) => `data/HoleFountainUpg${row.tier}_${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
