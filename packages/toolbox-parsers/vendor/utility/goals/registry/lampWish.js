// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanText } from './names';

export default {
  system: 'lampWish',
  label: 'Lamp wishes',
  entryLabel: 'wish',
  scope: 'account',
  route: GOAL_ROUTES.lampWish,
  list: ({ account }) => (account?.hole?.caverns?.theLamp?.wishes ?? []).map((row, index) => ({
    ...row,
    index,
    // the times a wish was made, which sets its cost on the page
    wishes: Number(account?.hole?.holesObject?.wishesUsed?.[index]) || 0
  })),
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  // the cards have no art: The Lamp's cavern icon stands in
  icon: () => 'etc/Cavern_6',
  metrics: {
    wishes: { label: 'Times wished', value: (row) => row.wishes }
  }
};
