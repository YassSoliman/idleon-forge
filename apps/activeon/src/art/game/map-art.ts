// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Map's game sprites (M25, ADR 0009 as amended 2026-10-19): a world boss, a constellation, an AFK
// target. Toolbox paths, like everything in game-art.ts; our own sprite is always the fallback.
import { type GameArt, monsterArt } from './game-art';

/**
 * The world bosses by world: the boss gate's fact names the boss ("Amarok"), Toolbox's monsters.json
 * names its sprite (wolfA = Amarok, Boss2A = Efaunt, Boss3A = Chizoar, Boss4A = Massive_Troll).
 */
const WORLD_BOSS: Readonly<Record<number, string>> = { 1: 'wolfA', 2: 'Boss2A', 3: 'Boss3A', 4: 'Boss4A' };

/** A world boss's standing frame, by the world its gate closes. */
export const bossArt = (world: number): GameArt | null => monsterArt(WORLD_BOSS[world]);

/** A constellation's picture by its game index (Toolbox's etc/Constellation_<n>). */
export const constellationArt = (rawIndex: number | null | undefined): GameArt | null =>
  typeof rawIndex === 'number' && Number.isInteger(rawIndex) && rawIndex >= 0
    ? { path: `etc/Constellation_${rawIndex}` }
    : null;
