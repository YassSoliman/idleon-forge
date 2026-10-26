// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { stableText } from './names';

export default {
  system: 'merit',
  label: 'Merits',
  entryLabel: 'merit',
  scope: 'account',
  route: GOAL_ROUTES.merit,
  list: ({ account }) => (account?.meritsDescriptions ?? []).flatMap((merits, world) =>
    (merits ?? [])
      .map((merit, i) => ({ ...merit, world, i }))
      .filter(({ descLine1, meritCost }) => descLine1 !== 'IDK_YET' && meritCost !== null)),
  key: (row) => `${row.world}:${row.i}`,
  // the catalog lines, not the parsed description, which fills in the bonus at the current level
  name: (row) => stableText(`${row.descLine1}${row.descLine2 !== 'Descline2' ? `_${row.descLine2}` : ''}`),
  icon: (row) => `data/${row.icon}`,
  metrics: {
    level: {
      label: 'Purchases',
      value: (row) => row.level ?? 0,
      max: (row) => realCap(row.totalLevels)
    }
  }
};
