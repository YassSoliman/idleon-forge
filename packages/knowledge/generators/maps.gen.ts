// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `maps.fact.maps` (M5 TR-4, TR-6): every real map with its index, name, world, AFK type, target, the
// target's ExpGiven, and its doors (base requirement and destination map). The boss/colosseum/quest
// exclusion list comes from calling Toolbox's exported getFilteredPortals at generation time, so it
// re-syncs with the pin. World is floor(index / 50) + 1, the convention Toolbox's own parsers use
// (speedrun.ts, royalGuardian.ts: the game reads floor(CurrentMap / 50)).
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, PLACEHOLDER_MAP_NAMES } from './types';

export interface MapRow {
  index: number;
  name: string;
  rawName: string | null;
  world: number;
  /** The AFK type of the map's target ('FIGHTING', 'MINING', ...); null when the map has none. */
  afkType: string | null;
  target: string | null;
  expGiven: number | null;
  /** Door i: its base requirement (kills, or the skill level on a mining/fishing map) and destination. */
  doors: { requirement: number; destination: number | null }[];
  /** Whether Toolbox's getFilteredPortals (skilling maps included) lists it: false for bosses, colosseums, quest rooms. */
  listed: boolean;
}

type FilteredPortals = (opts?: { includeSkillingMaps?: boolean }) => { mapIndex: string }[];

/**
 * getFilteredPortals calls Array.prototype.toSimpleObject, one of Toolbox's prototype polyfills
 * (vendor/polyfills.js), which the Node-side constants bundle doesn't load. When it is missing, it is
 * defined for the duration of the call only, with the same behaviour as the polyfill
 * (each element becomes a key mapped to `val`), then removed.
 */
function callFiltered(fn: FilteredPortals): Set<number> {
  const proto = Array.prototype as unknown as Record<string, unknown>;
  const had = Object.hasOwn(proto, 'toSimpleObject');
  if (!had)
    Object.defineProperty(proto, 'toSimpleObject', {
      configurable: true,
      writable: true,
      value(this: unknown[], val: unknown = true) {
        const out: Record<string, unknown> = {};
        for (const el of this) out[String(el)] = val;
        return out;
      },
    });
  try {
    return new Set(fn({ includeSkillingMaps: true }).map((m) => Number(m.mapIndex)));
  } finally {
    if (!had) delete proto.toSimpleObject;
  }
}

const isPlaceholder = (name: string | undefined) =>
  name === undefined || PLACEHOLDER_MAP_NAMES.has(name) || /^Z+$/.test(name);

export function mapRows(
  data: {
    mapNames: Record<string, string>;
    rawMapNames: string[];
    mapEnemiesArray: string[];
    monsters: Record<string, { AFKtype?: string; ExpGiven?: number }>;
    mapPortals: Record<string, unknown[]>;
    mapPortalDestinations: Record<string, unknown[]>;
  },
  listed: Set<number>,
): MapRow[] {
  const rows: MapRow[] = [];
  for (const [key, name] of Object.entries(data.mapNames)) {
    const index = Number(key);
    if (!Number.isInteger(index) || isPlaceholder(name)) continue;
    const enemy = data.mapEnemiesArray[index];
    const monster = enemy && enemy !== 'Nothing' && enemy !== 'Z' ? data.monsters[enemy] : undefined;
    const reqs = (data.mapPortals[key] ?? []).map((r) => Number(r) || 0);
    const dests = data.mapPortalDestinations[key] ?? [];
    const doors = reqs.map((requirement, i) => {
      const d = dests[i];
      return { requirement, destination: typeof d === 'number' ? d : null };
    });
    rows.push({
      index,
      name,
      rawName: data.rawMapNames[index] ?? null,
      world: Math.floor(index / 50) + 1,
      afkType: monster?.AFKtype && monster.AFKtype !== 'Nothing' ? monster.AFKtype : null,
      target: monster ? (enemy as string) : null,
      expGiven: typeof monster?.ExpGiven === 'number' ? monster.ExpGiven : null,
      doors,
      listed: listed.has(index),
    });
  }
  return rows.sort((a, b) => a.index - b.index);
}

const generator = defineGenerator({
  name: 'maps',
  system: 'maps',
  inputs: [
    'website-data/shared-data.json#mapNames',
    'website-data/shared-data.json#rawMapNames',
    'website-data/shared-data.json#mapEnemiesArray',
    'website-data/monsters.json',
    'website-data/shared-data.json#mapPortals',
    'website-data/shared-data.json#mapPortalDestinations',
    'parsers/portals.ts#getFilteredPortals',
  ],
  constants: { getFilteredPortals: 'parsers/portals.ts' },
  run({ data, constants, pin }) {
    const fn = constants.getFilteredPortals;
    if (typeof fn !== 'function')
      throw new Error('maps: getFilteredPortals is not exported by parsers/portals.ts');
    const rows = mapRows(
      data as unknown as Parameters<typeof mapRows>[0],
      callFiltered(fn as FilteredPortals),
    );
    if (rows.length < 100) throw new Error(`maps: only ${rows.length} real maps; the data shape changed`);
    const fact: FactTableT = {
      id: 'maps.fact.maps',
      system: 'maps',
      origin: 'generated',
      title: 'Maps: world, AFK target, doors and destinations',
      rows: rows as unknown as FactTableT['rows'],
      sources: [
        generatedSource(pin, 'parsers/portals.ts', 'IdleOn Toolbox: map data and getFilteredPortals'),
      ],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
