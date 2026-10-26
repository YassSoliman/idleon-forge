// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { SUMMONING_COLOURS as COLOURS } from '@parsers/world-6/summoning';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

// allBattles[9] is the endless list, which the Battles tab builds into the shared array when it renders
const BATTLE_WORLDS = 9;

export default {
  system: 'summonBattle',
  label: 'Summoning battles',
  entryLabel: 'battle',
  scope: 'account',
  route: GOAL_ROUTES.summonBattle,
  groups: {
    label: 'Colour',
    of: (row) => String(row.world),
    names: COLOURS
  },
  list: ({ account }) => withUniqueNames(
    (account?.summoning?.allBattles ?? []).slice(0, BATTLE_WORLDS).flatMap((battles, world) =>
      (battles ?? []).map((battle) => ({ ...battle, world }))),
    (row) => cleanUnderscore(row.territoryName ?? row.enemyId ?? '')
  ),
  key: (row) => row.enemyId,
  name: (row) => row.goalName,
  // the page renders row.icon, a prefixed .png path
  icon: (row) => String(row.icon ?? '').replace(/^\//, '').replace(/\.png$/, ''),
  metrics: {
    won: { label: 'Won', value: (row) => (row.won ? 1 : 0), boolean: true }
  }
};
