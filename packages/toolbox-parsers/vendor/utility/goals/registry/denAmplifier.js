// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers } from './names';

export default {
  system: 'denAmplifier',
  label: 'Den amplifiers',
  entryLabel: 'amplifier',
  scope: 'account',
  route: GOAL_ROUTES.denAmplifier,
  list: ({ account }) => (account?.hole?.caverns?.theDen?.amplifiers ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => titleCaseTiers(row.ampName),
  icon: (row) => `data/HoleFightAmp${row.index}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
