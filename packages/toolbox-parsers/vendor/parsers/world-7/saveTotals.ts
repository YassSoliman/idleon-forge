// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Mirrors the leaderboard worker's MongoDB `$sum` over a save array: non-numeric entries are
// skipped and negative placeholders (-1 = locked) are kept, so the page shows the ranked number.
export const sumSaveArray = (values: unknown): number => {
  if (!Array.isArray(values)) return 0;
  return values.reduce((sum: number, value) => sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0), 0);
};
