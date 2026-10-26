// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { realCap } from '../caps';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'guildBonus',
  label: 'Guild bonuses',
  entryLabel: 'guild bonus',
  scope: 'account',
  route: GOAL_ROUTES.guildBonus,
  // the parser maps the catalog 1:1 (also for a locked guild), so the position is the game's bonus index
  list: ({ account }) => (account?.guild?.guildBonuses ?? []).map((bonus, index) => ({ ...bonus, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/Gbonus${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.maxLevel) }
  }
};
