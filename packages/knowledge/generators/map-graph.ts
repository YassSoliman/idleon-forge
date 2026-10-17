// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The map door graph shared by the portals, skill-doors and tools generators (not a generator itself:
// only *.gen.ts files are). A map's doors pair `mapPortals[map][door]` (the requirement: kills on a
// fighting map, the skill level on a mining or fishing one, Toolbox portals.ts getMapDoorRequirements)
// with `mapPortalDestinations[map][door]` (the map the door leads to). A map's world is
// floor(index / 50) + 1, the game's own rule (Toolbox damage.ts: "the game reads floor(CurrentMap / 50)").
import { PLACEHOLDER_MAP_NAMES } from './types';

export interface MapData {
  mapNames: Record<string, string>;
  mapPortals: Record<string, (number | string)[]>;
  mapPortalDestinations: Record<string, number[]>;
  mapEnemiesArray: string[];
  monsters: Record<string, { AFKtype?: string; Name?: string }>;
}

export interface Door {
  door: number;
  requirement: number;
  /** Destination map index, or null when the data lists none. */
  to: number | null;
}

export interface Step {
  mapIndex: number;
  /** null for the walk out of a town into the map after it, which no door lists (W3 at the pin). */
  door: number | null;
  requirement: number;
}

export const worldOf = (map: number) => Math.floor(map / 50) + 1;
export const townOf = (world: number) => (world - 1) * 50;

export function mapGraph(d: MapData) {
  const name = (m: number) => d.mapNames[String(m)] ?? '';
  const isReal = (m: number) => !PLACEHOLDER_MAP_NAMES.has(name(m)) && name(m) !== '';
  const afkType = (m: number) => d.monsters[d.mapEnemiesArray[m] ?? '']?.AFKtype ?? null;
  const doors = (m: number): Door[] => {
    const req = d.mapPortals[String(m)] ?? [];
    const dest = d.mapPortalDestinations[String(m)] ?? [];
    return Array.from({ length: Math.max(req.length, dest.length) }, (_, door) => {
      const to = dest[door];
      return {
        door,
        requirement: Number(req[door]) || 0,
        to: typeof to === 'number' && isReal(to) ? to : null,
      };
    });
  };
  /** Shortest door-by-door path from the world's town to every map reachable inside that world.
   *  Breadth-first in door order, so of two equal-length paths the one through lower doors wins. */
  const pathsIn = (world: number): Map<number, Step[]> => {
    const town = townOf(world);
    const out = new Map<number, Step[]>([[town, []]]);
    const queue = [town];
    // Each town opens onto the map after it (W1 0 -> 1, W2 50 -> 51, W4 150 -> 151 by a door). At the pin
    // W3's Frostbite Towndra lists no door to Steep Sheep Ledge, so that edge is added as a walk.
    const exitsOf = (m: number): { door: number | null; requirement: number; to: number | null }[] => {
      const ds: { door: number | null; requirement: number; to: number | null }[] = doors(m);
      const next = town + 1;
      if (m === town && isReal(next) && !ds.some((x) => x.to === next))
        ds.unshift({ door: null, requirement: 0, to: next });
      return ds;
    };
    while (queue.length) {
      const m = queue.shift() as number;
      for (const dr of exitsOf(m)) {
        if (dr.to === null || worldOf(dr.to) !== world || out.has(dr.to)) continue;
        out.set(dr.to, [...(out.get(m) ?? []), { mapIndex: m, door: dr.door, requirement: dr.requirement }]);
        queue.push(dr.to);
      }
    }
    return out;
  };
  const indices = Object.keys(d.mapNames)
    .map(Number)
    .filter((m) => Number.isInteger(m))
    .sort((a, b) => a - b);
  return { name, isReal, afkType, doors, pathsIn, indices };
}

export const MAP_INPUTS = [
  'website-data/shared-data.json#mapNames',
  'website-data/shared-data.json#mapPortals',
  'website-data/shared-data.json#mapPortalDestinations',
  'website-data/shared-data.json#mapEnemiesArray',
  'website-data/monsters.json',
] as const;

export const mapDataOf = (data: Readonly<Record<string, unknown>>): MapData => ({
  mapNames: data.mapNames as MapData['mapNames'],
  mapPortals: data.mapPortals as MapData['mapPortals'],
  mapPortalDestinations: data.mapPortalDestinations as MapData['mapPortalDestinations'],
  mapEnemiesArray: data.mapEnemiesArray as string[],
  monsters: data.monsters as MapData['monsters'],
});
