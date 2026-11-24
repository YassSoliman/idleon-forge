// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 899b5a0dc7456c686e94e58ea410195744c9f82a.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// Free of data imports: the guild pages read this and nothing else from the parsers, and reaching it through guild.ts
// drags the website data barrel (1.67 MB) onto both pages for a guest.

export const getGuildLevel = (points: number): number => {
  for (let e = 0; 100 > e;) {
    const n = e++;
    if (!(points >= 100 * (n + 1) * Math.pow(1.21, n))) {
      return Math.min(n + 1, 45);
    }
  }
  return 1;
}
