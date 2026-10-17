// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared reading of Toolbox map data for the collection generators (stamps, quests, obols, cards).
// A map index belongs to world 1 + floor(index / 50): Toolbox's own rule (parsers/class-specific/
// royalGuardian.ts, `world: 1 + Math.floor(mapIndex / 50)`). NPC worlds come from `npcPlacements`
// (the maps the NPC stands on), never from Toolbox's quest-grouping key (M8 TR-8 rule 2).
import { PLACEHOLDER_MAP_NAMES } from './types';

export const worldOfMap = (mapIndex: number): number => 1 + Math.floor(mapIndex / 50);

/** The lowest world an NPC stands in, from npcPlacements; null when Toolbox has no placement. */
export function npcWorld(
  placements: Record<string, number[]>,
  npc: string,
): { world: number; map: number } | null {
  const maps = placements[npc];
  if (!Array.isArray(maps) || maps.length === 0) return null;
  const map = [...maps].sort((a, b) => a - b)[0] as number;
  return { world: worldOfMap(map), map };
}

/** monster rawName -> the map indices it spawns on (mapEnemiesArray), placeholders excluded. */
export function mapsOfMonsters(
  mapEnemiesArray: readonly string[],
  mapNames: Record<string, string>,
): Map<string, number[]> {
  const out = new Map<string, number[]>();
  mapEnemiesArray.forEach((monster, i) => {
    if (!monster || monster === 'Nothing' || PLACEHOLDER_MAP_NAMES.has(mapNames[String(i)] ?? '')) return;
    out.set(monster, [...(out.get(monster) ?? []), i]);
  });
  return out;
}

/** Map index of a town by its name (mapNames), for shop towns; null when no map has that name. */
export function mapOfName(mapNames: Record<string, string>, name: string): number | null {
  const hit = Object.entries(mapNames)
    .filter(([, v]) => v === name)
    .map(([k]) => Number(k))
    .sort((a, b) => a - b)[0];
  return hit ?? null;
}

/** "Copper_Chopper" -> "Copper Chopper". */
export const humanName = (s: string): string => s.replace(/_/g, ' ').trim();
