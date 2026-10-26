// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUpgradeName } from './names';
import { MASTERCLASS_PLACEHOLDER, realCap } from '../caps';

// Grimoire, compass and tesseract share one upgrade shape; only the list, route and icon differ.
export const masterclassDescriptor = ({ system, label, route, list, icon }) => ({
  system,
  label,
  entryLabel: 'upgrade',
  scope: 'account',
  route,
  list,
  key: (row) => String(row.index),
  name: (row) => cleanUpgradeName(row.name),
  icon,
  metrics: {
    level: {
      label: 'Level',
      noun: 'level',
      value: (row) => row.level,
      max: (row) => realCap(row.x4, MASTERCLASS_PLACEHOLDER),
      steps: [5, 10]
    }
  }
});
