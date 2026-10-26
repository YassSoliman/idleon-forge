// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore, prefix } from '@utility/helpers';
import { monsterImage } from '@utility/spriteImages';
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

export default {
  system: 'compassMedallion',
  label: 'Medallions',
  entryLabel: 'medallion',
  scope: 'account',
  route: GOAL_ROUTES.compassMedallion,
  list: ({ account }) => withUniqueNames(account?.compass?.medallions ?? [], (row) => cleanUnderscore(row.Name)),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  // the Medallions tab draws monsterImage(imageName); icons here are paths without prefix and extension
  icon: (row) => monsterImage(row.imageName).slice(prefix.length).replace(/\.\w+$/, ''),
  metrics: {
    acquired: { label: 'Acquired', value: (row) => (row.acquired ? 1 : 0), boolean: true, verb: 'own' }
  }
};
