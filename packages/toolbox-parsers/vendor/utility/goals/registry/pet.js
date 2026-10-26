// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getMaxShinyLevel, MAX_BREEDABILITY_LEVEL } from '@parsers/world-4/breeding';
import { cleanUnderscore, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'pet',
  label: 'Pets',
  entryLabel: 'pet',
  scope: 'account',
  route: GOAL_ROUTES.pet,
  groups: {
    label: 'World',
    of: (row) => row.world,
    names: Object.fromEntries([1, 2, 3, 4].map((n) => [`World${n}`, `World ${n}`]))
  },
  list: ({ account }) => (account?.breeding?.pets ?? []).flat(),
  key: (row) => row.monsterRawName,
  name: (row) => cleanUnderscore(row.monsterName),
  // Mface icons are placeholders: the breeding page draws the monster sprite for those pets instead
  icon: (row) => row.icon?.startsWith('Mface')
    ? monsterImage(row.monsterRawName).slice(prefix.length).replace(/\.\w+$/, '')
    : `data/${row.icon}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0
    },
    shiny: {
      label: 'Shiny level',
      noun: 'level',
      value: (row) => row.shinyLevel ?? 0,
      max: (row, { account }) => getMaxShinyLevel(account)
    },
    breedability: {
      label: 'Breedability',
      value: (row) => row.breedingLevel ?? 0,
      max: () => MAX_BREEDABILITY_LEVEL
    }
  }
};
