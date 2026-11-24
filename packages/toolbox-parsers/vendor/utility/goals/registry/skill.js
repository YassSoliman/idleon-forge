// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';
import { isGlobalSkill } from '../../consts';

export default {
  system: 'skill',
  label: 'Skills',
  entryLabel: 'skill',
  scope: 'character',
  route: GOAL_ROUTES.skill,
  // 'character' is the class level riding in skillsInfo; the skills page skips it too
  list: ({ character }) => Object.entries(character?.skillsInfo ?? {})
    .filter(([skillName]) => skillName !== 'character')
    .map(([skillName, info]) => ({ ...info, skillName })),
  key: (row) => row.skillName,
  name: (row) => capitalizeFirst(row.skillName),
  icon: (row) => `data/${row.icon}`,
  entryTag: (row) => (isGlobalSkill(row.skillName) ? 'Global' : null),
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      steps: [10, 50]
    }
  }
};
