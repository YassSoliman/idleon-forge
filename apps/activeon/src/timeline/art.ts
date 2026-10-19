// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Which of our own pixel motifs (ADR 0009) signifies each Timeline bar, Parallel Slot and Daily & Weekly
// row (M21 DS-12: art says what kind, never wallpaper). By System first, then by the bar's kind.
import type { TimelineBarView } from '@idleon-forge/engine/now';
import type { SlotKind } from '@idleon-forge/engine/result';
import { dataArt, type GameArt } from '../art/game/game-art';
import { systemGameArt } from '../art/game/system-art';
import type { ArtName } from '../design/art/names';

const BY_SYSTEM: Record<string, ArtName> = {
  anvil: 'now-cap-anvil',
  worship: 'now-cap-worship',
  trapping: 'now-cap-trap',
  arcade: 'v2-time-ball',
  alchemy: 'v2-time-flask',
  refinery: 'v2-time-salt',
  'boss-keys': 'v2-time-key',
  colosseum: 'v2-time-ticket',
  killroy: 'v2-time-skull-wax',
  equinox: 'v2-time-moon',
  'talent-presets': 'now-glyph-wrench',
};

const BY_KIND: Record<TimelineBarView['kind'], ArtName> = {
  storage: 'now-hourglass',
  production: 'now-hourglass',
  food: 'v2-time-drumstick',
  'time-cap': 'now-hourglass',
  bank: 'v2-time-key',
  timer: 'now-hourglass',
};

export const barArt = (b: Pick<TimelineBarView, 'system' | 'kind'>): ArtName =>
  b.kind === 'food' && b.system === 'afk' ? 'v2-time-drumstick' : (BY_SYSTEM[b.system] ?? BY_KIND[b.kind]);

/** The Lab's bar families: production and storage caps, banks, timers, food and fuel. */
export const barFamily = (kind: TimelineBarView['kind']): 'prod' | 'store' | 'timer' | 'food' =>
  kind === 'bank'
    ? 'store'
    : kind === 'food'
      ? 'food'
      : kind === 'timer' || kind === 'time-cap'
        ? 'timer'
        : 'prod';

export const SLOT_ART: Record<SlotKind, ArtName> = {
  cauldron: 'v2-time-cauldron',
  trap: 'now-cap-trap',
  worship: 'now-cap-worship',
  cog: 'v2-time-cog',
  printer: 'v2-time-printer',
};

const ROW_ART: Record<string, ArtName> = {
  'pet-mart': 'v2-time-paw',
  'pet-pull': 'v2-time-paw',
  'pet-tournament': 'v2-time-paw',
  'minigame-plays': 'v2-time-dart',
  spiketrap: 'v2-time-dart',
  'liquid-shop-gem': 'v2-time-flask', // our flask stays the fallback; ROW_GAME draws the game's
  'vial-attempts': 'v2-time-flask',
  'post-office': 'v2-time-mailbox',
  'boss-keys': 'v2-time-key',
  tickets: 'v2-time-ticket',
  ballot: 'v2-time-ticket',
  'killroy-rooms': 'v2-time-skull-wax',
  'killroy-skulls': 'v2-time-skull-wax',
  'weekly-battle': 'v2-time-skull-wax',
};

export const rowArt = (id: string): ArtName => ROW_ART[id] ?? 'now-hourglass';

/**
 * M25 (ADR 0009 as amended): the game's own sprite for a Daily & Weekly row, by the System or thing it
 * counts; our motif above stays the fallback. Toolbox paths (SYSTEM_ART for a System).
 */
const ROW_GAME: Record<string, GameArt | null> = {
  'pet-mart': systemGameArt('pets'),
  'pet-pull': systemGameArt('pets'),
  'pet-tournament': systemGameArt('pet-tournament'),
  'minigame-plays': systemGameArt('minigames'),
  spiketrap: dataArt('MGfsh1'),
  'liquid-shop-gem': dataArt('PremiumGem'),
  'vial-attempts': systemGameArt('alchemy-vials'),
  'post-office': systemGameArt('post-office'),
  'boss-keys': systemGameArt('boss-keys'),
  tickets: systemGameArt('colosseum'),
  ballot: systemGameArt('ballot'),
  'killroy-rooms': systemGameArt('killroy'),
  'killroy-skulls': systemGameArt('killroy'),
  'weekly-battle': systemGameArt('weekly-battles'),
  'daily-tasks': systemGameArt('task-board'),
  'guild-daily': systemGameArt('guild'),
  'guild-weekly': systemGameArt('guild'),
};

/** A Daily & Weekly row's game sprite, or null (our motif draws). */
export const rowGameArt = (id: string): GameArt | null => ROW_GAME[id] ?? systemGameArt(id);

/** A Timeline bar's game sprite: its System's (SYSTEM_ART), or null (our motif draws). */
export const barGameArt = (b: Pick<TimelineBarView, 'system' | 'kind'>): GameArt | null =>
  b.kind === 'food' && b.system === 'afk' ? null : systemGameArt(b.system);
