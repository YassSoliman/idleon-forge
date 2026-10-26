// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { capitalizeFirst, withUniqueNames } from './names';
import { cleanUnderscore } from '@utility/helpers';

// "+{%_BELL_RING|访_PING_RATE": drop the value markers, the glyph is the game's ampersand
const label = (description) => capitalizeFirst(cleanUnderscore(String(description ?? '')
  .replace('访', '&').replace(/[+{}%]/g, '').replace('|', '_').toLowerCase()).trim());

export default {
  system: 'measurement',
  label: 'Measurements',
  entryLabel: 'measurement',
  scope: 'account',
  route: GOAL_ROUTES.measurement,
  // the page hides the "i" placeholder rows, the key stays the catalog position
  list: ({ account }) => withUniqueNames(
    (account?.hole?.measurements ?? []).map((row, pos) => ({ ...row, pos })).filter((row) => row.description !== 'i'),
    (row) => label(row.description)
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `etc/Measure_${row.pos}`,
  metrics: {
    level: { label: 'Level', noun: 'level', value: (row) => row.level ?? 0 }
  }
};
