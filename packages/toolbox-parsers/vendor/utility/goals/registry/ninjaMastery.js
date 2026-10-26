// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

// The game fills the mastery levels that have no bonus yet with this text
const PLACEHOLDER = /no_bonus_here_yet/i;

export default {
  system: 'ninjaMastery',
  label: 'Ninja mastery',
  entryLabel: 'mastery bonus',
  scope: 'account',
  route: GOAL_ROUTES.ninjaMastery,
  list: ({ account }) => (account?.sneaking?.ninjaMasteryBonuses ?? []).filter(({ description }) => !PLACEHOLDER.test(description ?? '')),
  key: (row) => String(row.index),
  name: (row) => stableText(`${row.description ?? ''} ${row.bonus ?? ''}`.replace('#', 'x')),
  // the Mastery cards have no art; the Sneaking skill icon stands in
  icon: () => 'data/ClassIcons58',
  metrics: {
    // the Mastery tab: a bonus is on once the mastery level reaches its position
    unlocked: {
      label: 'Unlocked',
      value: (row, { account }) => ((account?.sneaking?.ninjaMastery ?? 0) >= row.index + 1 ? 1 : 0),
      boolean: true,
      verb: 'unlock'
    }
  }
};
