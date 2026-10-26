// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { masterclassDescriptor } from './masterclass';
import { GOAL_ROUTES } from '../routes';

export default masterclassDescriptor({
  system: 'tesseract',
  label: 'Tesseract',
  route: GOAL_ROUTES.tesseract,
  list: ({ account }) => account?.tesseract?.upgrades ?? [],
  icon: (row) => `data/ArcaneUpg${row.index}`
});
