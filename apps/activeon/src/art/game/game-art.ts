// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The typed lookup from the ids Account State and the engine already hold to a game sprite under
// /game-art/ (ADR 0009 as amended 2026-10-19). This file is GPL code; the images it points at are
// Legends of IdleOn art (c) LavaFlame2 and are NOT (public/game-art/NOTICE.md).
//
// /game-art/ mirrors IdleOn Toolbox's whole image set with Toolbox's own path scheme
// (scripts/game-art/sync.mjs): Toolbox's `<dir>/<name>.png` is our `/game-art/<dir>/<name>.webp`
// (lossless, pixel-identical). So a sprite is named exactly as Toolbox names it ("data/StampA4") and
// there is no hand mapping and no file list in the app: a missing file falls back to our own pixel
// sprite at render time. Images are static files on our own origin (CSP img-src 'self'), lazy-loaded,
// never in the JS bundle.

/** One game sprite: its Toolbox path without the extension, e.g. "data/StampA4". */
export interface GameArt {
  path: string;
}

/** Toolbox's image folders (its `${prefix}<dir>/` paths), which /game-art/ mirrors. */
export const GAME_ART_DIRS = ['data', 'etc', 'monsters', 'afk_targets', 'npcs', 'player-sprites'] as const;

/** A path segment: game identifiers, plus the few characters Toolbox's file names use. */
const SEGMENT = /^[A-Za-z0-9_()' -]{1,96}$/;
/** The game's empty-slot names. */
const EMPTY = new Set(['Blank', 'None', 'LockedInvSpace']);

/** The sprite's path on our origin, or null when the path can't name one. */
export function gameArtSrc(art: GameArt | null | undefined): string | null {
  if (!art) return null;
  const parts = art.path.split('/');
  const dir = parts[0] as (typeof GAME_ART_DIRS)[number];
  const rest = parts.slice(1);
  if (!GAME_ART_DIRS.includes(dir) || rest.length === 0) return null;
  if (rest.some((p) => !SEGMENT.test(p) || p.trim() !== p)) return null;
  if (EMPTY.has(rest[rest.length - 1] ?? '')) return null;
  return `/game-art/${dir}/${rest.map(encodeURIComponent).join('/')}.webp`;
}

const isName = (s: string | null | undefined): s is string => typeof s === 'string' && SEGMENT.test(s);
const isIndex = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0;

/** Any sprite in Toolbox's data/ folder by its file name ("PremiumGem", "ConTower2"). */
export const dataArt = (name: string | null | undefined): GameArt | null =>
  isName(name) ? { path: `data/${name}` } : null;
/** Any sprite in Toolbox's etc/ folder ("Owl", "Killroy_Skull"). */
export const etcArt = (name: string | null | undefined): GameArt | null =>
  isName(name) ? { path: `etc/${name}` } : null;
/** An item rawName: gear, materials, stamps ("StampA4"), statues ("EquipmentStatues1"), food... */
export const itemArt = dataArt;
/** A talent by its skillIndex (Account State talent `id`). */
export const talentArt = (id: number | null | undefined): GameArt | null =>
  isIndex(id) ? { path: `data/UISkillIcon${id}` } : null;
/** A bubble rawName, `aUpgrades<G|O|P|Y><index>`. */
export const bubbleArt = dataArt;
/** A vial's jar by its level (the game draws the jar from the level). */
export const vialArt = (level: number | null | undefined): GameArt | null =>
  isIndex(level) && level > 0 ? { path: `data/aVials${level}` } : null;
/** A class by its class index. */
export const classArt = (index: number | null | undefined): GameArt | null =>
  isIndex(index) ? { path: `data/ClassIcons${index}` } : null;
/** A monster by its rawName ("mushG"): its standing frame. */
export const monsterArt = (rawName: string | null | undefined): GameArt | null =>
  isName(rawName) ? { path: `monsters/${rawName}/static` } : null;
/** A card set's art by its rawName (Toolbox's `cardSet` variant draws `data/<rawName>`). */
export const cardSetArt = dataArt;

/**
 * A stamp's item from its Acquisition id ("stamps.acquisition.stamp-a4" -> StampA4); null for any
 * other id. Stamps are items in the game's catalogue.
 */
export function stampArtOfRef(ref: string | null | undefined): GameArt | null {
  const m = ref ? /^stamps\.acquisition\.stamp-([abc])(\d+)$/.exec(ref) : null;
  return m ? { path: `data/Stamp${(m[1] ?? '').toUpperCase()}${m[2]}` } : null;
}
