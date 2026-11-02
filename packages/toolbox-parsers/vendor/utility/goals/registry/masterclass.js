// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
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
