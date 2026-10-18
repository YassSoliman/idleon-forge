// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The self-hosted fonts (M21 FR-F2, D-4). All three families are OFL-1.1 and served from our own
// origin, so the CSP's `font-src 'self'` is unchanged and no font request leaves for Google (M10 TR-13).
// Only the latin subset files are imported: one woff2 per face, downloaded only when text uses it.
// None of these files has "→", "←" or "✓" (V-5, checked 2026-10-18 on the 5.3.0 cmaps), so those are
// drawn as 16-grid art glyphs (`arrow-right`, `arrow-left`, `check`), never left to a fallback font.
import '@fontsource/atkinson-hyperlegible-next/latin-400.css';
import '@fontsource/atkinson-hyperlegible-next/latin-600.css';
import '@fontsource/atkinson-hyperlegible-next/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-600.css';
// Pixelify Sans: the 400 master only. Its "c", "C" and "e" mouths are one art pixel tall (81 of 1000
// units at 400) and the heavier instances close them (65 at 500, 35 at 700), so from 500 up the mouth
// rasterises shut at heading sizes on a 1x screen and "Account" reads "Aooount". With only this face
// loaded and weight synthesis off (tokens.css), every pixel heading draws the 400 outlines, whatever
// weight a rule asks for. Sizes start at 20 px (css-guard.test.ts).
import '@fontsource/pixelify-sans/latin-400.css';
