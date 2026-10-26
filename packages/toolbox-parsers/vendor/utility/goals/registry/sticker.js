// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { cleanUnderscore } from '@utility/helpers';

export default {
  system: 'sticker',
  label: 'Stickers',
  entryLabel: 'sticker',
  scope: 'account',
  route: GOAL_ROUTES.sticker,
  // the parser has already dropped Nonexistent_Sticker; the page draws FarmStickerB<position in that list>
  list: ({ account }) => (account?.farming?.stickers ?? []).map((row, pos) => ({ ...row, pos })),
  key: (row) => row.name,
  name: (row) => cleanUnderscore(row.name),
  icon: (row) => `data/FarmStickerB${row.pos}`,
  metrics: {
    count: { label: 'Found', value: (row) => row.count ?? 0 }
  }
};
