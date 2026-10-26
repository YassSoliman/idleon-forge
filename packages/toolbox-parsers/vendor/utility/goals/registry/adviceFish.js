// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

const ADVICE_ART_COUNT = 6;

export default {
  system: 'adviceFish',
  label: 'Advice Fish upgrades',
  entryLabel: 'advice',
  scope: 'account',
  route: GOAL_ROUTES.adviceFish,
  list: ({ account }) => (account?.adviceFish?.upgrades ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => String(row.pos),
  name: (row) => cleanUnderscore(row.name ?? ''),
  // public/etc ships art for the first six advices only; later ones show the page icon
  icon: (row) => (row.pos < ADVICE_ART_COUNT ? `etc/Advice_Fish_${row.pos}` : 'data/W7_fish'),
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
