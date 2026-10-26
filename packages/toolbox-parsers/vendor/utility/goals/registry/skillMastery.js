// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { SKILL_MASTERY_THRESHOLDS, SKILLS_WITHOUT_MASTERY } from '@parsers/misc';
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst } from './names';

export default {
  system: 'skillMastery',
  label: 'Skill mastery',
  entryLabel: 'skill',
  scope: 'account',
  route: GOAL_ROUTES.skillMastery,
  list: ({ account }) => Object.entries(account?.totalSkillsLevels ?? {})
    .filter(([skill]) => !SKILLS_WITHOUT_MASTERY.includes(skill))
    .map(([skill, row]) => ({ ...row, skill })),
  key: (row) => row.skill,
  name: (row) => capitalizeFirst(cleanUnderscore(row.skill)),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    level: { label: 'Total level', noun: 'level', value: (row) => row.level ?? 0, steps: SKILL_MASTERY_THRESHOLDS },
    // the Skill Mastery tab thresholds, one bonus each
    rank: { label: 'Mastery', value: (row) => row.rank ?? 0, tiers: ['None', ...SKILL_MASTERY_THRESHOLDS.map((lv) => `Lv. ${lv}`)] }
  }
};
