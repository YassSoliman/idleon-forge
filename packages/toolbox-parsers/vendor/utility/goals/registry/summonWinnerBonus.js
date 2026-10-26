// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { withUniqueNames } from './names';

// "<x Total DMG" is a multiplier the card prints as 1 + value / 100; "+{% Drop Rate" prints the value
const isMulti = (row) => String(row.bonus ?? '').startsWith('<');

export default {
  system: 'summonWinnerBonus',
  label: 'Winner bonuses',
  entryLabel: 'winner bonus',
  scope: 'account',
  route: GOAL_ROUTES.summonWinnerBonus,
  list: ({ account }) => withUniqueNames(account?.summoning?.winnerBonuses ?? [],
    (row) => String(row.bonus ?? '').replace(/^[<+{]+%?x?\s*/, '').trim()),
  key: (row) => String(row.bonusId),
  name: (row) => row.goalName,
  // the cards have no art: the Summoning page icon stands in
  icon: () => 'data/ClassIcons59',
  metrics: {
    bonus: { label: 'Bonus', value: (row) => (isMulti(row) ? 1 + (row.value ?? 0) / 100 : row.value ?? 0) }
  }
};
