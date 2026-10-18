// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-S2: each System's own 16 px glyph and ramp (the Design Lab's world-band tiles), from our own
// pixel art (ADR 0009). A System the registry adds later gets the generic tile glyph until it has one
// (spec §8 "Patch day").
import type { ArtName, Ramp } from '../design/art/PixelArt';

export interface SystemArt {
  name: ArtName;
  ramp: Ramp;
}

const A = (name: ArtName, ramp: Ramp): SystemArt => ({ name, ramp });

const ART: Readonly<Record<string, SystemArt>> = {
  classes: A('v2-systems-arch', 'stone'),
  talents: A('v2-systems-book', 'plat'),
  'talent-presets': A('v2-systems-book', 'silver'),
  'talent-resets': A('v2-systems-scroll', 'wood'),
  'upgrade-vault': A('v2-systems-vault', 'silver'),
  'gem-shop': A('v2-systems-gem', 'ruby'),
  'merit-shop': A('v2-systems-coin', 'gold'),
  'task-unlocks': A('v2-systems-scroll', 'wood'),
  pets: A('v2-systems-paw', 'wood'),
  minigames: A('v2-systems-ball', 'ruby'),
  cards: A('v2-systems-card', 'gold'),
  obols: A('v2-systems-obol', 'silver'),
  portals: A('v2-systems-portal', 'majestic'),
  skills: A('v2-systems-pickaxe', 'stone'),
  gear: A('v2-systems-anvil', 'stone'),
  'random-events': A('v2-systems-star', 'gold'),
  'pet-tournament': A('v2-systems-paw', 'gold'),
  'task-board': A('v2-systems-scroll', 'wood'),
  guild: A('v2-systems-shrine', 'stone'),
  stamps: A('v2-systems-stamp', 'bronze'),
  'star-signs': A('v2-systems-star', 'gold'),
  anvil: A('v2-systems-anvil', 'stone'),
  forge: A('v2-systems-forge', 'stone'),
  bribes: A('v2-systems-coin', 'gold'),
  statues: A('v2-systems-statue', 'stone'),
  'post-office': A('v2-systems-post', 'wood'),
  owl: A('v2-systems-owl', 'wood'),
  quests: A('v2-systems-quest', 'plat'),
  'boss-keys': A('v2-systems-key', 'gold'),
  colosseum: A('v2-systems-arch', 'stone'),
  poppy: A('v2-systems-fish', 'leaf'),
  alchemy: A('v2-systems-cauldron', 'stone'),
  'alchemy-bubbles': A('v2-systems-cauldron', 'leaf'),
  'alchemy-vials': A('v2-systems-vial', 'silver'),
  'alchemy-p2w': A('v2-systems-coin', 'bronze'),
  arcade: A('v2-systems-ball', 'ruby'),
  islands: A('v2-systems-island', 'leaf'),
  killroy: A('v2-systems-dart', 'ruby'),
  'weekly-battles': A('v2-systems-dart', 'stone'),
  ballot: A('v2-systems-scroll', 'gold'),
  refinery: A('v2-systems-salt', 'ruby'),
  construction: A('v2-systems-cog', 'silver'),
  library: A('v2-systems-book', 'plat'),
  printer: A('v2-systems-printer', 'silver'),
  worship: A('v2-systems-totem', 'wood'),
  trapping: A('v2-systems-trap', 'wood'),
  'death-note': A('v2-systems-deathnote', 'stone'),
  'armor-smithy': A('v2-systems-anvil', 'bronze'),
  'salt-lick': A('v2-systems-lick', 'fire'),
  prayers: A('v2-systems-candle', 'gold'),
  shrines: A('v2-systems-shrine', 'stone'),
  equinox: A('v2-systems-moon', 'majestic'),
  'atom-collider': A('v2-systems-atom', 'stone'),
  lab: A('v2-systems-flask', 'leaf'),
  cooking: A('v2-systems-pan', 'stone'),
  breeding: A('v2-systems-egg', 'leaf'),
};

const GENERIC: SystemArt = A('v2-systems-board', 'wood');

export const systemArt = (id: string): SystemArt => ART[id] ?? GENERIC;
