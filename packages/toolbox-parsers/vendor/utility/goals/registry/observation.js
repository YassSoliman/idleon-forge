// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
import { GOAL_ROUTES } from '../routes';
import { stableText, withUniqueNames } from './names';

export default {
  system: 'observation',
  label: 'Research observations',
  entryLabel: 'observation',
  scope: 'account',
  route: GOAL_ROUTES.observation,
  // the parser skips the "Name" placeholders but keeps the game's observation index
  list: ({ account }) => withUniqueNames(account?.research?.observations ?? [], (row) => stableText(row.name)),
  key: (row) => String(row.index),
  name: (row) => row.goalName,
  icon: (row) => `data/ResObj${row.index}`,
  metrics: {
    insight: { label: 'Insight level', noun: 'level', value: (row) => row.insightLevel ?? 0 },
    // the card's "Insight EXP: x / y": done once the EXP covers what the next insight level needs
    next: { label: 'Next level', nextStep: true, value: (row) => row.insightExp ?? 0, threshold: (row) => row.insightExpREQ }
  }
};
