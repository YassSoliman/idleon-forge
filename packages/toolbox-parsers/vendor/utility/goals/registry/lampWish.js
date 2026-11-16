// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 48cb4ee697988ec5eac14ba97142add6296505b2.
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
  list: ({ account }) => (account?.hole?.caverns?.theLamp?.wishes ?? []).map((row, index) => ({ ...row, index })),
  key: (row) => String(row.index),
  name: (row) => cleanText(row.name),
  // the cards have no art: The Lamp's cavern icon stands in
  icon: () => 'etc/Cavern_6',
  metrics: {
    // the card's "Times wished"
    wishes: { label: 'Times wished', value: (row) => row.timesWished ?? 0 }
  }
};
