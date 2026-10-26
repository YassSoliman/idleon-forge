// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { cleanUnderscore } from '@utility/helpers';
import { GOAL_ROUTES } from '../routes';

export default {
  system: 'compassAbomination',
  label: 'Abominations',
  entryLabel: 'abomination',
  scope: 'account',
  route: GOAL_ROUTES.compassAbomination,
  // the parser maps the abomination catalog 1:1, so the position is the abomination index
  list: ({ account }) => (account?.compass?.abominations ?? []).map((abomination, index) => ({ ...abomination, index })),
  key: (row) => String(row.index),
  name: (row) => cleanUnderscore(row.name),
  // the page's CompassUpg art exists for the first abomination only; the card's weakness element stands in
  icon: (row) => `data/WWeffect${row.weakness?.index ?? 0}`,
  metrics: {
    killed: { label: 'Killed', value: (row) => (row.unlocked > 0 ? 1 : 0), boolean: true }
  }
};
