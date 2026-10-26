// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { getMineheadOpponentSpriteId } from '@parsers/world-7/minehead';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'mineheadOpponent',
  label: 'Minehead opponents',
  entryLabel: 'Minehead opponent',
  scope: 'account',
  route: GOAL_ROUTES.mineheadOpponent,
  list: ({ account }) => withUniqueNames(account?.minehead?.opponents ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/MineH${getMineheadOpponentSpriteId(row.index)}`,
  metrics: {
    beaten: { label: 'Beaten', value: (row) => (row.beaten ? 1 : 0), boolean: true }
  }
};
