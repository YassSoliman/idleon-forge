// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The frontier step (M2 TR-2, TR-10 step 1): which door on the current world's route path the account
// should open next, how far each character has walked that path, and each character's kill rate there.
// The kill rates come from Toolbox (`getMaxDamage` on a clone moved to the frontier map, ADR 0005), so
// this file never computes one: the parse worker passes them in through `rates`. Everything else is
// read from the raw save's `KillsLeft2Advance` (`KLA_<i>`): a door is cleared when its value is <= 0.
import type { ParsedSave, RawSaveEnvelope } from '@idleon-forge/toolbox-parsers';
import { FRONTIER_SECTIONS } from './fields';
import type { Frontier, FrontierFight, RouteDoor } from './types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** One character's raw kills left per map and door, or null when the key is missing or unparseable. */
export function killsLeftTable(data: Dict, slot: number): unknown[] | null {
  const raw = data[`KLA_${slot}`];
  let v: unknown = raw;
  if (typeof raw === 'string') {
    try {
      v = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return Array.isArray(v) ? v : null;
}

/** Kills left on one door: the raw value, or the requirement when the character never reached the map. */
export function killsLeftOn(table: unknown[] | null, door: RouteDoor): number {
  const row = table?.[door.mapIndex];
  const v = Array.isArray(row) ? finite(row[door.door]) : null;
  return v === null ? door.requirement : v;
}

/**
 * Toolbox `getMaxDamage` for every character on `mapIndex` (the TR-2 clone, `toolboxCalls.frontierRates`),
 * or null when the call failed. Called once, after the frontier door is chosen.
 */
export type FrontierRates = (mapIndex: number) => Array<Omit<FrontierFight, 'killsLeft'>> | null;

export interface FrontierInput {
  /** The account's current world (1-based). */
  world: number;
  /** The world's route path from `portals.fact.world-routes`, town first, in path order. */
  route: readonly RouteDoor[];
  rates: FrontierRates;
}

/**
 * The frontier, or null when it can't be trusted: a damage-relevant parser section failed (Toolbox's `{}`
 * fallbacks are never used for a kill rate), the route is empty, or the kill-rate call threw.
 */
export function computeFrontier(
  parsed: ParsedSave,
  envelope: RawSaveEnvelope,
  input: FrontierInput,
): Frontier | null {
  if (parsed.failedSections.some((s) => FRONTIER_SECTIONS.includes(s))) return null;
  // Town doors with no requirement (and W3's door-less town exit) are open to everyone: not path doors.
  const path = input.route.filter((d) => Number.isInteger(d.door) && d.requirement > 0);
  if (path.length === 0) return null;
  const data: Dict = isDict(envelope.data) ? envelope.data : {};

  const people = parsed.characters.flatMap((c, slot) => {
    const level = isDict(c) ? finite(c.level) : null;
    return level !== null && level > 0 ? [{ slot, level, table: killsLeftTable(data, slot) }] : [];
  });
  if (people.length === 0) return null;
  const cleared = (t: unknown[] | null, d: RouteDoor) => killsLeftOn(t, d) <= 0;

  // TR-10 step 1: the first path door nobody has cleared; else the path door with the highest requirement.
  let at = path.findIndex((d) => !people.some((p) => cleared(p.table, d)));
  let kind: Frontier['kind'] = 'uncleared';
  if (at < 0) {
    kind = 'hardest-cleared';
    at = path.reduce((best, d, i) => (d.requirement > (path[best]?.requirement ?? -1) ? i : best), 0);
  }
  const door = path[at] as RouteDoor;

  const routeCleared = people.map((p) => {
    let count = 0;
    while (count < path.length && cleared(p.table, path[count] as RouteDoor)) count++;
    return {
      characterIndex: p.slot,
      count,
      of: path.length,
      reachesFrontier: path.slice(0, at).every((d) => cleared(p.table, d)),
    };
  });

  let rates: ReturnType<FrontierRates>;
  try {
    rates = input.rates(door.mapIndex);
  } catch {
    rates = null;
  }
  if (!rates) return null;
  const fights: FrontierFight[] = people.map((p) => {
    const r = rates.find((x) => x.characterIndex === p.slot);
    return {
      characterIndex: p.slot,
      finalKillsPerHour: r?.finalKillsPerHour ?? 0,
      killsPerHour: r?.killsPerHour ?? 0,
      hitChance: r?.hitChance ?? 0,
      survivability: r?.survivability ?? 0,
      killsLeft: Math.ceil(Math.max(0, killsLeftOn(p.table, door))),
    };
  });

  return {
    world: input.world,
    mapIndex: door.mapIndex,
    mapName: door.mapName,
    door: door.door,
    kind,
    requirement: door.requirement,
    routeCleared,
    fights,
  };
}
