// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const titleCase = (str) => str.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

export default {
  system: 'armorSet',
  label: 'Armor Smithy',
  entryLabel: 'armor set',
  scope: 'account',
  route: GOAL_ROUTES.armorSet,
  list: ({ account }) => account?.armorSmithy?.sets ?? [],
  key: (row) => row.setName,
  name: (row) => titleCase(cleanUnderscore(row.setName)),
  icon: (row) => `data/${row.armors?.[0]}`,
  // Only unlocking counts: equipped depends on the logged-in character's gear, so the goal would flip between characters
  metrics: {
    unlocked: {
      label: 'Unlocked',
      value: (row) => (row.unlocked ? 1 : 0),
      boolean: true,
      verb: 'unlock'
    }
  }
};
