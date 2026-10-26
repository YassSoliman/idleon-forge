// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers, withoutValue } from './names';

export default {
  system: 'bellUpgrade',
  label: 'Bell upgrades',
  entryLabel: 'bell upgrade',
  scope: 'account',
  route: GOAL_ROUTES.bellUpgrade,
  groups: {
    label: 'Type',
    of: (row) => row.type,
    names: { method: 'Improvement methods', ring: 'Ring bonuses' }
  },
  list: ({ account }) => {
    const bell = account?.hole?.caverns?.theBell;
    return [
      // several methods share the same text, so the method number tells them apart
      ...(bell?.improvementMethods ?? []).map((row, pos) => ({
        ...row, type: 'method', pos, goalName: `Method ${pos + 1}: ${withoutValue(row.description)}`
      })),
      ...(bell?.bellBonuses ?? []).map((row, pos) => ({
        ...row, type: 'ring', pos, goalName: titleCaseTiers(withoutValue(row.description))
      }))
    ];
  },
  key: (row) => `${row.type}:${row.pos}`,
  name: (row) => row.goalName,
  // the cards have no art: The Bell's cavern icon stands in
  icon: () => 'etc/Cavern_4',
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
