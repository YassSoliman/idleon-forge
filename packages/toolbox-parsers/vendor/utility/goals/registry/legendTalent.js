// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { LEGEND_TALENT_MAX_LEVEL_GROUPS } from '@parsers/world-7/legendTalents';
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

const NO_FEVER = 'none';

export default {
  system: 'legendTalent',
  label: 'Legend talents',
  entryLabel: 'legend talent',
  scope: 'account',
  route: GOAL_ROUTES.legendTalent,
  // the page's colour filter: the Legendary Fever square that raises the talent's max level
  groups: {
    label: 'Colour',
    of: (row) => row.fever?.color ?? NO_FEVER,
    names: {
      ...Object.fromEntries(LEGEND_TALENT_MAX_LEVEL_GROUPS.map(({ color }) => [color, `${color} Fever`])),
      [NO_FEVER]: 'No fever'
    }
  },
  // the page sorts by display index and drops the filler rows; originalIndex is the game's talent index
  list: ({ account }) => withUniqueNames(account?.legendTalents?.talents ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.originalIndex),
  name: (row) => row.goalName,
  icon: (row) => `data/LegendTalentIcon${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
