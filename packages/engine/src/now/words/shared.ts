// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the shared view words (owned by Phase F, frozen). A new shared word is a cross-module
// request for Integration. Nothing here is advice (P6); `view-words.test` lints every words file.
import type { TileStatus } from '../view';

export const PLACE_WORDS = {
  now: 'Now',
  characters: 'Characters',
  systems: 'Systems',
  timeline: 'Timeline',
  map: 'Map',
} as const;

export const STATUS_WORDS: Record<TileStatus, string> = {
  locked: 'Locked',
  wasting: 'Wasting',
  behind: 'Behind',
  'cant-tell': "Can't tell",
  'not-covered': 'Not covered yet',
  ok: 'Nothing to fix',
};

/** World group headings (FR-16), in game order. */
export const WORLD_NAMES: Record<number, string> = {
  0: 'Across worlds',
  1: 'World 1 · Blunder Hills',
  2: 'World 2 · Yum-Yum Desert',
  3: 'World 3 · Frostbite Tundra',
  4: 'World 4 · Hyperion Nebula',
};

export const LINK_WORDS = {
  seeIt: (name: string) => `See it: ${name}`,
  /** The back link's word; its arrow is the `ui-arrow-left` glyph beside it (V-5), never a text arrow. */
  back: 'Back',
  /** M21 FR-M7: a link to the map's sheet on the Map place (`#map-<n>`). */
  seeOnMap: 'See it on the map',
  toSystems: '→ Systems',
  toCharacters: 'Builds and cards → Characters',
  go: 'go',
  skipToContent: 'Skip to content',
} as const;
