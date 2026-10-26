// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';
import { ARTIFACT_TIERS } from '@components/account/Worlds/World5/Sailing/sailing.consts';

export const ARTIFACT_TIER_LABELS = ['None', ...ARTIFACT_TIERS.map(({ level, full }) => `Tier ${level}: ${full}`)];

export default {
  system: 'artifact',
  label: 'Artifacts',
  entryLabel: 'artifact',
  scope: 'account',
  route: GOAL_ROUTES.artifact,
  list: ({ account }) => account?.sailing?.artifacts ?? [],
  key: (row) => row.rawName,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/${row.rawName}`,
  metrics: {
    tier: { label: 'Tier', noun: 'rank', value: (row) => row.acquired ?? 0, tiers: ARTIFACT_TIER_LABELS }
  }
};
