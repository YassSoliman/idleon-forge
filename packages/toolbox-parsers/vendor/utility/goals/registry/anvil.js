// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { getPlayerAnvil } from '@parsers/world-1/anvil';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'anvil',
  label: 'Anvil',
  entryLabel: 'anvil',
  scope: 'character',
  route: GOAL_ROUTES.anvil,
  // the Anvil page card of this character: its points and where they went
  list: ({ account, characters, character }) => {
    if (!character) return [];
    const { stats } = getPlayerAnvil(character, characters, account) ?? {};
    return stats ? [{ ...stats, smithingLevel: character?.skillsInfo?.smithing?.level ?? 0 }] : [];
  },
  key: () => 'anvil',
  name: () => 'Anvil',
  icon: () => 'data/ClassIcons43',
  metrics: {
    // the card's "Points x / y": y is every point earned
    points: { label: 'Points', value: (row) => (row.pointsFromCoins ?? 0) + (row.pointsFromMats ?? 0) + row.smithingLevel },
    xpPoints: { label: 'Exp points', value: (row) => row.xpPoints ?? 0 },
    speedPoints: { label: 'Speed points', value: (row) => row.speedPoints ?? 0 },
    capPoints: { label: 'Capacity points', value: (row) => row.capPoints ?? 0 }
  }
};
