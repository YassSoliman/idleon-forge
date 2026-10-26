// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';

// Myriad Crate's catalog max is a 100000 sentinel, not a level anyone reaches
const BOX_PLACEHOLDER = 100000;

export default {
  system: 'postOffice',
  label: 'Post office',
  entryLabel: 'box',
  scope: 'character',
  route: GOAL_ROUTES.postOffice,
  // The box index is its position in the full catalog, taken before the Filler slots are dropped
  list: ({ character }) => (character?.postOffice?.boxes ?? [])
    .map((box, index) => ({ ...box, index }))
    .filter(({ name }) => name !== 'Filler'),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/UIboxUpg${row.index}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel, BOX_PLACEHOLDER),
      steps: [10, 50]
    }
  }
};
