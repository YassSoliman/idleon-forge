// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Mirrors the leaderboard worker's MongoDB `$sum` over a save array: non-numeric entries are
// skipped and negative placeholders (-1 = locked) are kept, so the page shows the ranked number.
export const sumSaveArray = (values: unknown): number => {
  if (!Array.isArray(values)) return 0;
  return values.reduce((sum: number, value) => sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0), 0);
};
