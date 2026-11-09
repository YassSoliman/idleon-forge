// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst, withUniqueNames } from './names';

export default {
  system: 'emperorBonus',
  label: 'Emperor bonuses',
  entryLabel: 'emperor bonus',
  scope: 'account',
  route: GOAL_ROUTES.emperorBonus,
  // the catalog name starts with the value placeholder ("}x_Ninja_Stealth"); the rest names the bonus
  list: ({ account }) => withUniqueNames(
    account?.emperor?.bonuses ?? [],
    (row) => capitalizeFirst(cleanUnderscore(row.rawName ?? '').split(' ').slice(1).join(' '))
  ),
  key: (row) => String(row.rawIndex),
  name: (row) => row.goalName,
  // two bonuses have no art on the page; the Emperor icon stands in
  icon: (row) => row.icon || 'data/Boss6',
  metrics: {
    levels: { label: 'Levels unlocked', value: (row) => row.levels ?? 0 }
  }
};
