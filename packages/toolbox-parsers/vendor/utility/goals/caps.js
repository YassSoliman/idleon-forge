// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
export const MASTERCLASS_PLACEHOLDER = 999999;
export const ARMORY_PLACEHOLDER = 999;

// null = uncapped: the game stores 0 / nothing / a huge sentinel where an entry has no real cap.
export const realCap = (n, placeholderAtLeast = Infinity) =>
  n == null || !(n > 0) || n >= placeholderAtLeast ? null : n;
