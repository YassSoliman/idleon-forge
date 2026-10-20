// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55: the game sprites Poppy's page draws, by the names the game's Poppy menu uses (Toolbox's
// data/Roo* and etc/Kangaroob_* images). Paths only: <GameIcon> loads them and falls back to our sprite.
import type { GameArt } from './game-art';

const isIndex = (n: number) => Number.isInteger(n) && n >= 0;

/** Poppy on her fishing line. */
export const POPPY_ART: GameArt = { path: 'data/RooA' };
/** The three fish: bluefin, the shiny fish, Tartar fish. */
export const FISH_ART: Readonly<Record<'bluefin' | 'shiny' | 'tar', GameArt>> = {
  bluefin: { path: 'etc/KFish' },
  shiny: { path: 'etc/KShiny' },
  tar: { path: 'etc/KTar' },
};
/** Megafish n (1-based), its portrait in the Greatest Catch panel (data/RooMG0..11). */
export const megafishArt = (n: number): GameArt | null =>
  isIndex(n - 1) && n <= 12 ? { path: `data/RooMG${n - 1}` } : null;
/** Reset spiral i (0 bluefin .. 4 Tartar), data/RooReset<i>. */
export const spiralArt = (i: number): GameArt | null => (isIndex(i) ? { path: `data/RooReset${i}` } : null);
/** Shiny fish i (0..5), data/RooFishS<i>. */
export const shinyArt = (i: number): GameArt | null => (isIndex(i) ? { path: `data/RooFishS${i}` } : null);
/** Bonus i of Toolbox's bonuses list (0 Fish/minute, 1 Fishing Eff .. 7 Cash), etc/Kangaroob_<i>. */
export const poppyBonusArt = (i: number): GameArt | null =>
  isIndex(i) ? { path: `etc/Kangaroob_${i}` } : null;
