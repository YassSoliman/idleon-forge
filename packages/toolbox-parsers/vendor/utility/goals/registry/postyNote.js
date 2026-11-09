// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'postyNote',
  label: 'Posty notes',
  entryLabel: 'posty note',
  scope: 'account',
  route: GOAL_ROUTES.postyNote,
  list: ({ account }) => account?.research?.postyNotes ?? [],
  key: (row) => String(row.index),
  name: (row) => `Posty Note #${row.index + 1}`,
  icon: (row) => `data/ResPosty${row.index}`,
  metrics: {
    unlocked: { label: 'Unlocked', value: (row) => (row.unlocked ? 1 : 0), boolean: true, verb: 'unlock' }
  }
};
