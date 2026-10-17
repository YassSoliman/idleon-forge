// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 TR-2: every character's kill rate on one map, from Toolbox's own `getMaxDamage` on a shallow clone
// moved to that map (the clone verified in research/hypothetical-math §2, and the one Toolbox's speedrun
// page uses). It swaps mapIndex, targetMonster, afkType, afkTarget and currentMap; everything else (talent
// preset, attack bar, cards, obols, gear, food) stays as saved, so rates are "as each character is
// currently equipped". Runs only in the parse worker (ADR 0006), inside the parse's frozen clock.
import { mapEnemiesArray, mapNames, monsters } from '@website-data';
import { getMaxDamage } from '../vendor/parsers/damage';
import { withFrozenClock } from './frozen-clock';
import type { MapKillRate, ParsedSave } from './types';

type Any = Record<string, unknown>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** The character as Toolbox would see it parked on `mapIndex`. */
export function onMap(character: Any, mapIndex: number): Any {
  const target = (mapEnemiesArray as string[])[mapIndex];
  const monster =
    target === undefined
      ? undefined
      : (monsters as Record<string, { Name: string; AFKtype: string }>)[target];
  return {
    ...character,
    mapIndex,
    currentMap: (mapNames as Record<string, string>)[String(mapIndex)],
    targetMonster: target,
    afkTarget: monster?.Name,
    afkType: monster?.AFKtype,
  };
}

/**
 * Kill rates of every character with a level on `mapIndex`, at `parsed.meta.now`. Throws if Toolbox does
 * (the caller reports it and leaves the frontier unknown; a fallback is never used for a kill rate).
 */
export function frontierRates(parsed: ParsedSave, mapIndex: number): MapKillRate[] {
  // biome-ignore lint/suspicious/noExplicitAny: Toolbox's own character and account types are untyped.
  const characters = parsed.characters as any[];
  // biome-ignore lint/suspicious/noExplicitAny: see above.
  const account = parsed.account as any;
  return withFrozenClock(parsed.meta.now, () =>
    characters.flatMap((c, characterIndex) => {
      if (!c?.level) return [];
      const p = getMaxDamage(onMap(c, mapIndex) as never, characters, account) as Any;
      return [
        {
          characterIndex,
          finalKillsPerHour: num(p.finalKillsPerHour),
          killsPerHour: num(p.killsPerHour),
          hitChance: num(p.hitChance),
          survivability: num(p.survivability),
        },
      ];
    }),
  );
}
