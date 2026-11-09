// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { REEF_IMAGE_LETTERS } from '@parsers/world-7/coralReef';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'reefUpgrade',
  label: 'Reef upgrades',
  entryLabel: 'reef upgrade',
  scope: 'account',
  route: GOAL_ROUTES.reefUpgrade,
  // row.name is the catalog text; the parser's description has the live numbers filled in
  list: ({ account }) => withUniqueNames(account?.coralReef?.reefUpgrades ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/Reef${REEF_IMAGE_LETTERS[row.index] || 'A'}1`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.x1) }
  }
};
