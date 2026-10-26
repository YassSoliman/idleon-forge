// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'riftBonus',
  label: 'Rift bonuses',
  entryLabel: 'rift bonus',
  scope: 'account',
  route: GOAL_ROUTES.riftBonus,
  // the Bonuses tab: the rift rows that carry a bonus; the key is the rift index
  list: ({ account }) => (account?.rift?.list ?? []).map((row, pos) => ({ ...row, pos })).filter((row) => row.riftBonus),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.riftBonus),
  icon: (row) => `etc/${row.riftBonusIcon}`,
  metrics: {
    unlocked: {
      label: 'Unlocked',
      value: (row, { account }) => (row.pos <= (account?.rift?.currentRift ?? 0) ? 1 : 0),
      boolean: true,
      verb: 'unlock'
    }
  }
};
