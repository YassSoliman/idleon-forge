// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// ActiveOn's sprite kit (M24): our own IdleOn-style 16x16 pixel sprites (ADR 0009, GPL-3.0-only).
// Every sprite is a named grid of palette materials (grids/*.ts) baked by house rules (bake.ts).
import type { SpriteDef } from './bake';
import { alchemy } from './grids/alchemy';
import { classes } from './grids/classes';
import { gear } from './grids/gear';
import { items } from './grids/items';
import { places } from './grids/places';
import { skills } from './grids/skills';
import { status } from './grids/status';
import { systems } from './grids/systems';
import { talents } from './grids/talents';

export type { Pixels, SpriteDef } from './bake';
export { bake, GRID, pathsOf } from './bake';
export type { Material } from './palette';
export { MATERIALS } from './palette';

/** The groups in catalogue order. */
export const SPRITE_GROUPS = {
  places,
  systems,
  skills,
  gear,
  classes,
  alchemy,
  items,
  status,
  talents,
} as const satisfies Record<string, Record<string, SpriteDef>>;

export type SpriteGroup = keyof typeof SPRITE_GROUPS;

/** Every drawn sprite by name. */
export const SPRITES: Readonly<Record<string, SpriteDef>> = Object.assign(
  {},
  ...Object.values(SPRITE_GROUPS),
);

/**
 * Names that draw another sprite: one drawing, two meanings (a System and its item, a skill and its
 * System, a gear slot and its tool). Every target is a drawn sprite (sprites.test.ts).
 */
export const SPRITE_ALIASES: Readonly<Record<string, string>> = {
  // Systems drawn by their item.
  'sys-gem-shop': 'item-gem',
  'sys-stamps': 'item-stamp',
  'sys-statues': 'item-statue',
  'sys-boss-keys': 'item-key',
  'sys-alchemy-bubbles': 'item-bubble',
  'sys-alchemy-vials': 'item-vial',
  'sys-refinery': 'item-salt',
  'sys-prayers': 'item-prayer',
  'sys-shrines': 'item-shrine',
  'sys-meals': 'item-meal',
  'sys-spices': 'item-spice',
  // Skills drawn by their System.
  'skill-trapping': 'sys-trapping',
  'skill-construction': 'sys-construction',
  'skill-worship': 'sys-worship',
  'skill-cooking': 'sys-cooking',
  'skill-breeding': 'sys-breeding',
  'skill-laboratory': 'sys-lab',
  // Gear slots drawn by their tool or item.
  'gear-pickaxe': 'skill-mining',
  'gear-hatchet': 'skill-chopping',
  'gear-rod': 'skill-fishing',
  'gear-net': 'skill-catching',
  'gear-trap': 'sys-trapping',
  'gear-card': 'item-card-frame',
  'gear-obol': 'sys-obols',
};

/** Every sprite name, aliases included. */
export const spriteNames = (): string[] => [...Object.keys(SPRITES), ...Object.keys(SPRITE_ALIASES)];

/** The sprite a name draws (following an alias), or undefined. */
export const spriteOf = (name: string): SpriteDef | undefined =>
  SPRITES[name] ?? SPRITES[SPRITE_ALIASES[name] ?? ''];
