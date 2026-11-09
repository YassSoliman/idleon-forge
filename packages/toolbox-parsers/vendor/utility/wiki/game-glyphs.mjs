// Vendored from IdleOn Toolbox (https://github.com/Morta1/IdleonToolbox) @ 13f73ae61cc77989be4fd044ca6c2e923de87bb0.
// Copyright (C) Morta1 and IdleOn Toolbox contributors. GPL-3.0-only; see vendor/LICENSE.
// Copied unmodified by IdleOn Forge's scripts/sync.sh; UI-coupled imports are redirected to shims/ at build time.
// The game's font draws marks the site's can't. An end-of-line # or ^ is its own art (a button, a smile): the mark goes.
// 论 is its "+" in Sneaking's text ("Find a +50 Yellow Belt"). 尬 is art beside the Hounds schematic's list: it goes. A talent's name ends in a colour code its font reads
// ("Symbols Of Beyond ~r"). Scanned over every label and description in the graph: these are all of them. An .mjs with no
// imports, so the graph build, a page and a test all read one rule. The page's <title> keeps the graph's label (NextSeo).
export const gameGlyphs = (text) => `${text ?? ''}`.replace(/[_ ]?[#^]$/, '').replace(/论/g, '+').replace(/尬/g, '');
export const shownName = (label) => gameGlyphs(label).replace(/[_ ]~[a-z]$/, '');
