// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { seedInfo } from '@website-data';
import { cleanUnderscore, createRange } from '@utility/helpers';

const SEED_NAMES = Object.fromEntries(seedInfo.map(({ seedId, name }) => [String(seedId),
  cleanUnderscore(name.toLowerCase()).replace(/^./, (c) => c.toUpperCase())]));

export default {
  system: 'crop',
  label: 'Crops',
  entryLabel: 'crop',
  scope: 'account',
  route: GOAL_ROUTES.crop,
  groups: {
    label: 'Seed',
    of: (row) => String(row.seedId),
    names: SEED_NAMES
  },
  // the Crop tab loops every seed's id range; the game names no crop, so the name is the seed plus its place in the range
  list: ({ account }) => seedInfo.flatMap(({ seedId, cropIdMin, cropIdMax }) =>
    createRange(cropIdMin, cropIdMax).map((id) => ({
      id,
      seedId,
      goalName: `${SEED_NAMES[String(seedId)]} crop ${id - cropIdMin + 1}`,
      count: account?.farming?.crop?.[id] ?? 0
    }))),
  key: (row) => String(row.id),
  name: (row) => row.goalName,
  icon: (row) => `data/FarmCrop${row.id}`,
  metrics: {
    count: { label: 'Stock', value: (row) => (Number.isFinite(row.count) ? row.count : 0) }
  }
};
