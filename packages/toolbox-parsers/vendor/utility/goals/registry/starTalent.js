// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'starTalent',
  label: 'Star talents',
  entryLabel: 'star talent',
  scope: 'character',
  route: GOAL_ROUTES.starTalent,
  list: ({ character }) => character?.flatStarTalents ?? [],
  key: (row) => String(row.talentId),
  name: (row) => cleanUnderscore(row.name ?? ''),
  icon: (row) => `data/UISkillIcon${row.talentId}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      // -1 when the save has no max for it
      max: (row) => realCap(row.maxLevel),
      steps: [10, 50]
    }
  }
};
