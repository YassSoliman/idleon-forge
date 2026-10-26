// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'sushiKnowledge',
  label: 'Sushi knowledge',
  entryLabel: 'sushi',
  scope: 'account',
  route: GOAL_ROUTES.sushiKnowledge,
  // one entry per sushi type, no filter: the position is the tier the page draws Sushi<pos> for
  list: ({ account }) => withUniqueNames(
    (account?.sushiStation?.knowledge ?? []).map((row, pos) => ({ ...row, pos })),
    (row) => stableText(row.name) || `Sushi ${row.pos}`
  ),
  key: (row) => row.rawName,
  name: (row) => row.goalName,
  icon: (row) => `data/Sushi${row.pos}`,
  metrics: {
    level: { label: 'Knowledge level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
