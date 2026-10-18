// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Map area's view words (area M). They live in `../../map/words.ts` (`MAP_WORDS`), beside
// the view that uses them: only the lazy Map place draws them, and this file is reached from the `now`
// barrel, which ships in the first load (TR-12). The nav's words are in `./shell.ts`.
export {};
