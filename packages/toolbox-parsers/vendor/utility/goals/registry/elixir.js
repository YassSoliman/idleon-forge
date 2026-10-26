// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 01c6e0adcb10378d3de3b48ea61b9de48d3a007f.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'elixir',
  label: 'Spelunking elixirs',
  entryLabel: 'elixir',
  scope: 'account',
  route: GOAL_ROUTES.elixir,
  // one entry per catalog line, no filter: the position is the elixir id
  list: ({ account }) => withUniqueNames(
    (account?.spelunking?.elixirs ?? []).map((row, pos) => ({ ...row, pos })),
    // the page fills the "{" with the elixir's fixed bonus
    (row) => stableText(String(row.description ?? '').replace('{', row.bonus))
  ),
  key: (row) => String(row.pos),
  name: (row) => row.goalName,
  icon: (row) => `data/CaveElix${row.pos}`,
  metrics: {
    quantity: { label: 'Owned', value: (row) => row.quantity ?? 0 }
  }
};
