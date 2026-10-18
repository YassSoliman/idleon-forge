// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 TR-1: the two seeded schedules the Daily & Weekly Checklist reads, through Toolbox's own functions.
// `getKillRoyClasses` with `ignoreSkipConditions` gives a week's room classes (iteration 0 is this account
// week, 1 the next); `getRandomEvents` lists the server's hourly Random Events. Each event's world is the
// RANDOlist (68 W1, 69 W2, 70 W3) its map is drawn from, the same lists Toolbox's `getEventMaps` reads.
// Call both inside `withFrozenClock`: they read the clock (`isPast`).
import { mapNames, randomList, rawMapNames } from '@website-data';
import { getKillRoyClasses, getRandomEvents } from '../vendor/parsers/misc';

export interface KillroyWeek {
  /** "Beginner", "Warrior", "Archer", "Mage", one per room in room order. */
  classes: string[];
}

/** Room classes for this account week and the next (TR-2 `roomClasses`). */
export function killroyWeeks(account: unknown, characters: unknown[], rooms: number): KillroyWeek[] {
  const a = account as { serverVars?: unknown };
  return [0, 1].map((iteration) => {
    const out = getKillRoyClasses(rooms, account, a?.serverVars, true, iteration, characters) as {
      classes?: { className?: string }[];
    };
    return { classes: (out?.classes ?? []).map((c) => String(c?.className ?? '')) };
  });
}

export interface RandomEventSlot {
  /** Start of the event hour (epoch ms). */
  at: number;
  /** Toolbox display map name, e.g. "Spore_Meadows". */
  map: string;
  /** "Meteorite", "Mega_Grumblo", "Glacial_Guild", "Snake_Swarm", "Angry_Frogs". */
  event: string;
  /** 1, 2 or 3: the world list the map comes from; 0 when not found. */
  world: number;
}

/** The next Random Events (the current hour onward), with each map's world. */
export function randomEventSchedule(account: unknown): RandomEventSlot[] {
  const events = getRandomEvents(account) as { mapName?: string; eventName?: string; date?: number }[];
  const names = mapNames as Record<string, string>;
  return (events ?? []).flatMap((e) => {
    if (typeof e?.mapName !== 'string' || typeof e.date !== 'number') return [];
    const index = Object.keys(names).find((k) => names[k] === e.mapName);
    const rawName = index === undefined ? undefined : rawMapNames[Number(index)];
    const w = [68, 69, 70].findIndex((i) => randomList[i]?.includes(rawName ?? ''));
    return [{ at: e.date, map: e.mapName, event: String(e.eventName ?? ''), world: w + 1 }];
  });
}
