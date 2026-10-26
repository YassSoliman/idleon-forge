// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'talent',
  label: 'Talents',
  entryLabel: 'talent',
  scope: 'character',
  route: GOAL_ROUTES.talent,
  // A character with no class has no flatTalents
  list: ({ character }) => character?.flatTalents ?? [],
  key: (row) => String(row.talentId),
  name: (row) => cleanUnderscore(row.name ?? ''),
  icon: (row) => `data/UISkillIcon${row.talentId}`,
  metrics: {
    // baseLevel: the points invested; level adds the account-wide added levels on top
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.baseLevel ?? 0,
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
