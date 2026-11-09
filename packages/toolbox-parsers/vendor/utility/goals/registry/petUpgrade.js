// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { joinedText } from './names';

export default {
  system: 'petUpgrade',
  label: 'Pet upgrades',
  entryLabel: 'pet upgrade',
  scope: 'account',
  route: GOAL_ROUTES.petUpgrade,
  // built 1:1 from the save, so the position is the key; the page hides the filler slots
  list: ({ account }) => (account?.breeding?.petUpgrades ?? [])
    .map((upgrade, index) => ({ ...upgrade, index }))
    .filter(({ name }) => name && name !== 'Filler'),
  key: (row) => String(row.index),
  name: (row) => joinedText(row.name),
  // slot 0 has no picture on the page, so it borrows the first upgrade's
  icon: (row) => `data/PetUpg${Math.max(0, row.index - 1)}`,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.maxLevel)
    }
  }
};
