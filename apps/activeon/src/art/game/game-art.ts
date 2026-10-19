// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The typed lookup from the ids Account State and the engine already hold to a game sprite under
// /game-art/ (ADR 0009 as amended 2026-10-19). This file is GPL code; the images it points at are
// Legends of IdleOn art (c) LavaFlame2 and are NOT (public/game-art/NOTICE.md). The images are
// static files on our own origin (CSP img-src 'self'), lazy-loaded, never in the JS bundle, and this
// module holds no list of them: a missing file falls back to our own pixel sprite at render time.

/** One game sprite, by the id ActiveOn already has for it. */
export type GameArt =
  /** An item rawName: gear, materials, stamps ("StampA4"), statues ("EquipmentStatues1"), food... */
  | { kind: 'item'; id: string }
  /** A card rawName (Toolbox `cards.json` key, e.g. "mushG"). */
  | { kind: 'card'; id: string }
  /** A talent's skillIndex (Account State talent `id`). */
  | { kind: 'talent'; id: number }
  /** A bubble rawName, `aUpgrades<G|O|P|Y><index>`. */
  | { kind: 'bubble'; id: string }
  /** A vial's level (the jar the game draws for it). */
  | { kind: 'vial'; id: number }
  /** A class index. */
  | { kind: 'class'; id: number }
  /** A monster rawName ("mushG"). */
  | { kind: 'monster'; id: string };

export type GameArtKind = GameArt['kind'];

/** The folder under /game-art/ per kind (scripts/game-art/sync.mjs writes them). */
export const GAME_ART_DIR: Readonly<Record<GameArtKind, string>> = {
  item: 'items',
  card: 'cards',
  talent: 'talents',
  bubble: 'bubbles',
  vial: 'vials',
  class: 'classes',
  monster: 'monsters',
};

/** rawNames are game identifiers: letters, digits, underscores. Anything else never becomes a URL. */
const SAFE = /^[A-Za-z0-9_]{1,64}$/;
/** The game's empty-slot names. */
const EMPTY = new Set(['Blank', 'None', 'LockedInvSpace']);

/** The sprite's path on our origin, or null when the id can't name one. */
export function gameArtSrc(art: GameArt | null | undefined): string | null {
  if (!art) return null;
  const id = String(art.id);
  if (typeof art.id === 'number' ? !Number.isInteger(art.id) || art.id < 0 : !SAFE.test(id) || EMPTY.has(id))
    return null;
  return `/game-art/${GAME_ART_DIR[art.kind]}/${id}.png`;
}

export const itemArt = (rawName: string | null | undefined): GameArt | null =>
  rawName ? { kind: 'item', id: rawName } : null;
export const cardArt = (rawName: string | null | undefined): GameArt | null =>
  rawName ? { kind: 'card', id: rawName } : null;
export const talentArt = (id: number | null | undefined): GameArt | null =>
  typeof id === 'number' ? { kind: 'talent', id } : null;
export const bubbleArt = (rawName: string | null | undefined): GameArt | null =>
  rawName ? { kind: 'bubble', id: rawName } : null;
export const classArt = (index: number | null | undefined): GameArt | null =>
  typeof index === 'number' ? { kind: 'class', id: index } : null;
export const monsterArt = (rawName: string | null | undefined): GameArt | null =>
  rawName ? { kind: 'monster', id: rawName } : null;

/**
 * A stamp's item from its Acquisition id ("stamps.acquisition.stamp-a4" -> StampA4); null for any
 * other id. Stamps are items in the game's catalogue, so they draw from items/.
 */
export function stampArtOfRef(ref: string | null | undefined): GameArt | null {
  const m = ref ? /^stamps\.acquisition\.stamp-([abc])(\d+)$/.exec(ref) : null;
  return m ? { kind: 'item', id: `Stamp${(m[1] ?? '').toUpperCase()}${m[2]}` } : null;
}
