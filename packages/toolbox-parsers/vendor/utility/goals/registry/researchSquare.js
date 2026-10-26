// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { stableText, withUniqueNames } from './names';

// The game ships unreleased grid squares as "Name"
const PLACEHOLDER_NAME = 'Name';

export default {
  system: 'researchSquare',
  label: 'Research grid',
  entryLabel: 'grid square',
  scope: 'account',
  route: GOAL_ROUTES.researchSquare,
  // the parser indexes the whole catalog, then this drops the placeholders: index is the grid cell
  list: ({ account }) => withUniqueNames(
    (account?.research?.gridSquares ?? []).filter((row) => row.name !== PLACEHOLDER_NAME),
    (row) => stableText(row.name)
  ),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  // the grid draws squares as plain boxes, so the page's own icon stands in
  icon: () => 'data/ClassIcons61',
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLv) }
  }
};
