// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { withUniqueNames } from './names';

export default {
  system: 'landRank',
  label: 'Rank database',
  entryLabel: 'land rank upgrade',
  scope: 'account',
  route: GOAL_ROUTES.landRank,
  list: ({ account }) => withUniqueNames(
    (account?.farming?.ranks ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => cleanUnderscore(row.name ?? '')
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `data/RankUpg${row.pos}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.upgradeLevel ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
