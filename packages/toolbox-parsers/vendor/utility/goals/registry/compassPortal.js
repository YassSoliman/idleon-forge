// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { portalsDescriptor } from './portals';

export default portalsDescriptor({
  system: 'compassPortal',
  label: 'Compass portals',
  route: GOAL_ROUTES.compassPortal,
  list: ({ account }) => account?.compass?.maps ?? []
});
