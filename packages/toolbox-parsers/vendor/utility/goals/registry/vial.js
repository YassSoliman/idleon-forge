// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { MAX_VIAL_LEVEL } from '@parsers/world-2/alchemy';
import { cleanUnderscore, pascalCase } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'vial',
  label: 'Vials',
  entryLabel: 'vial',
  scope: 'account',
  route: GOAL_ROUTES.vial,
  list: ({ account }) => account?.alchemy?.vials ?? [],
  key: (row) => row.mainItem,
  name: (row) => pascalCase(cleanUnderscore(row.name)),
  icon: (row) => `data/${row.mainItem}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: () => MAX_VIAL_LEVEL
    }
  }
};
