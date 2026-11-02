// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'starSign',
  label: 'Star signs',
  entryLabel: 'star sign',
  scope: 'account',
  route: GOAL_ROUTES.starSign,
  // the page hides the Unknown and Filler signs
  list: ({ account }) => withUniqueNames(
    (account?.starSigns ?? []).filter(({ indexedStarName }) => !/Filler|Unknown/.test(indexedStarName)),
    (row) => cleanUnderscore(row.starName)
  ),
  key: (row) => row.starName,
  name: (row) => row.goalName,
  // the page draws no picture per sign: the star icon it puts next to infinite stars
  icon: () => 'data/SignStarInf0',
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
