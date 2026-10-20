// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A card's game sprite by its rawName. Toolbox draws a card from data/2Cards<cardIndex>, so this is
// the one lookup with a table (generated from the pinned cards.json, card-index.gen.ts). Its own module
// so only the views that draw cards carry the table.
import { CARD_INDEX } from './card-index.gen';
import type { GameArt } from './game-art';

/** A card by its rawName (Toolbox `cards.json` key, e.g. "mushG"). */
export function cardArt(rawName: string | null | undefined): GameArt | null {
  const index = rawName ? CARD_INDEX[rawName] : undefined;
  return index ? { path: `data/2Cards${index}` } : null;
}
