// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const ADVICE_ART_COUNT = 7;

export default {
  system: 'adviceFish',
  label: 'Advice Fish upgrades',
  entryLabel: 'advice',
  scope: 'account',
  route: GOAL_ROUTES.adviceFish,
  list: ({ account }) => (account?.adviceFish?.upgrades ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.name ?? ''),
  // public/etc ships art for the first seven advices only; later ones show the page icon
  icon: (row) => (row.pos < ADVICE_ART_COUNT ? `etc/Advice_Fish_${row.pos}` : 'data/W7_fish'),
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
