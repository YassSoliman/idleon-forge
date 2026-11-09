// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { realCap } from '../caps';
import { GOAL_ROUTES } from '../routes';
import { titleCaseTiers } from './names';

export default {
  system: 'zenithUpgrade',
  label: 'Zenith Market upgrades',
  entryLabel: 'zenith upgrade',
  scope: 'account',
  route: GOAL_ROUTES.zenithUpgrade,
  list: ({ account }) => (account?.zenith?.market ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => titleCaseTiers(row.name),
  // the market cards have no art; the page's Zenith Cluster icon stands in
  icon: () => 'etc/Cluster',
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0, max: (row) => realCap(row.x3) }
  }
};
