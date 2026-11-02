// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 80e811ff34cf1d14fcd72e32a977d7113221e7da.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// A goal icon is an image path under public/, or a colour for systems the game draws as a plain colour (palette
// colours); the colour rides in the same string so every place that passes an icon keeps working
const SWATCH = 'swatch:';

export const swatchIcon = (r, g, b) => `${SWATCH}rgb(${r}, ${g}, ${b})`;

export const swatchColor = (icon) => (typeof icon === 'string' && icon.startsWith(SWATCH) ? icon.slice(SWATCH.length) : null);
