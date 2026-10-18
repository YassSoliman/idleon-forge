// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M16's shared context: who can reach which map (FR-0, M14's rule), who can reach the Telescope (F-e,
// F-f), who may be moved (M14 FR-18 via `isMoveExcluded`), and the Time Candies held (FR-9, D-4).
import type { AccountState, CharacterState, StarSignsState } from '@idleon-forge/account-state';
import type { MetaPathResult } from '../metapath/types';
import { holdingsOf } from '../walkthrough/holdings';
import { isMoveExcluded } from '../walkthrough/plan';
import { chartNodes, type MapRow, mapRows, type StarKnowledge, type StarRules, starRules } from './knowledge';

export interface StarContext {
  state: AccountState;
  kb: StarKnowledge;
  meta: MetaPathResult | null;
  rules: StarRules;
  maps: Map<number, MapRow>;
  signs: StarSignsState;
  /** The Stage's world (1–4). */
  world: number;
  /** Judgment values (TR-4). */
  values: StarValues;
}

export interface StarValues {
  maxM16Goals: number;
  maxCandyHours: number;
  levelGap: number;
  maxChallenges: number;
  talkSeconds: number;
  visitSeconds: number;
  claimSeconds: number;
  candySeconds: number;
}

export const DEFAULT_VALUES: StarValues = {
  maxM16Goals: 2,
  maxCandyHours: 4,
  levelGap: 5,
  maxChallenges: 1,
  talkSeconds: 180,
  visitSeconds: 180,
  claimSeconds: 60,
  candySeconds: 60,
};

export function contextOf(
  state: AccountState,
  kb: StarKnowledge,
  meta: MetaPathResult | null,
  world: number,
  values: StarValues,
): StarContext | null {
  const rules = starRules(kb);
  const signs = state.account.starSigns;
  if (!rules || !signs) return null;
  return { state, kb, meta, rules, maps: mapRows(kb), signs, world, values };
}

export const characterOf = (ctx: StarContext, index: number): CharacterState | undefined =>
  ctx.state.characters.find((c) => c.index === index);

/** A StarSigns id as its chart name ("The_Fuzzy_Dice"); null outside the Chronus and Hydron charts. */
export function signName(ctx: StarContext, id: number): string | null {
  return chartNodes(ctx.kb).find((n) => n.id === id)?.sign ?? null;
}
const names = (ctx: StarContext, ids: readonly number[]) =>
  ids.flatMap((id) => {
    const n = signName(ctx, id);
    return n ? [n] : [];
  });
/** The unlocked Chronus and Hydron signs, by name. */
export const unlockedNames = (ctx: StarContext): string[] => names(ctx, ctx.signs.unlocked);
/** The signs a character wears, by name. */
export const wornOf = (ctx: StarContext, c: CharacterState): string[] => names(ctx, c.starSigns ?? []);

/** A constellation's state (F-i, F-j): claimed, the letters' count and the decoded slots. */
export function progressOf(ctx: StarContext, rawIndex: number) {
  const p = ctx.signs.progress.find((x) => x.rawIndex === rawIndex);
  return {
    done: ctx.signs.claimed.includes(rawIndex),
    letterCount: p?.letterCount ?? 0,
    recorded: p?.recorded ?? [],
  };
}

/** A town map (index 0, 50, 100, …) of a world up to `currentWorld` (M14's reach rule). */
const isTown = (ctx: StarContext, m: number) => {
  const row = ctx.maps.get(m);
  return !!row && m % 50 === 0 && row.world <= (ctx.state.account.currentWorld ?? 1);
};

/**
 * FR-0: whether a character can walk to a map today: M14's `supplyRates.reachable`, its current map, a
 * town, and the boss arenas and colosseums a constellation names (entered with a key or tickets, V7).
 * null when the supply step didn't run (reach unknown: never claimed done).
 */
export function canReach(ctx: StarContext, c: CharacterState, mapIndex: number): boolean | null {
  if (c.mapIndex === mapIndex) return true;
  if (isTown(ctx, mapIndex)) return true;
  const rates = ctx.state.account.supplyRates;
  if (!rates) return null;
  if (rates.status === 'unavailable' && !(c.index in rates.reachable)) return null;
  return (rates.reachable[c.index] ?? []).includes(mapIndex);
}

/** Kills left on each of the three tree doors (F-f): the save's KillsLeft, or the door's requirement. */
export function doorsLeft(ctx: StarContext, c: CharacterState): { mapIndex: number; left: number }[] | null {
  if (!c.telescopeRoute) return null;
  return ctx.rules.route.map((d, i) => {
    const left = c.telescopeRoute?.[i] ?? null;
    const req = ctx.maps.get(d.mapIndex)?.doors[d.door]?.requirement ?? 0;
    return { mapIndex: d.mapIndex, left: Math.ceil(left ?? req) };
  });
}

/** F-e, F-f: the character can walk to the Telescope (every tree door open, or it stands there). */
export function reachesTelescope(ctx: StarContext, c: CharacterState): boolean | null {
  if (c.mapIndex === ctx.rules.telescope.mapIndex) return true;
  if (ctx.state.account.supplyRates?.reachable[c.index]?.includes(ctx.rules.telescope.mapIndex)) return true;
  const d = doorsLeft(ctx, c);
  if (!d) return null;
  return d.every((x) => x.left <= 0);
}

/** Kills left to reach the Telescope (FR-18's "after about N kills"); 0 when it can. */
export function killsToTelescope(ctx: StarContext, c: CharacterState): number | null {
  if (reachesTelescope(ctx, c) === true) return 0;
  const d = doorsLeft(ctx, c);
  return d ? d.reduce((n, x) => n + Math.max(0, x.left), 0) : null;
}

/** F-k: the character has the Telescope dialogue, so its star clicks count. */
export const hasDialogue = (ctx: StarContext, c: CharacterState) =>
  (c.npcDialog?.[ctx.rules.telescope.npc as 'Telescope'] ?? 0) >= 1;

export const excluded = (ctx: StarContext, c: CharacterState) => isMoveExcluded(c, ctx.meta);

/** A character that can use a Time Candy (F-h): not Lab, Cooking or no AFK Target. */
export const canUseCandy = (ctx: StarContext, c: CharacterState) =>
  c.afkType !== null && !ctx.rules.noCandy.includes(c.afkType);

/** FR-9: free characters first, then the playing character, then the lower index. */
export function assignOrder(ctx: StarContext, cs: CharacterState[]): CharacterState[] {
  const playing = ctx.state.lastPlayedCharacterIndex;
  return [...cs].sort(
    (a, b) =>
      Number(excluded(ctx, a)) - Number(excluded(ctx, b)) ||
      Number(b.index === playing) - Number(a.index === playing) ||
      a.index - b.index,
  );
}

/** One held Time Candy unit (FR-9: from a bag or storage). */
export interface CandyUnit {
  rawName: string;
  hours: number;
  place: string;
}

/** The small Time Candies held (D-4), plus `extra` (the quest's reward candies, as storage). */
export function candyPool(ctx: StarContext, extra: Record<string, number> = {}): CandyUnit[] {
  const out: CandyUnit[] = [];
  for (const { rawName, hours } of ctx.rules.candies) {
    if (hours > ctx.values.maxCandyHours) continue;
    for (const h of holdingsOf(ctx.state, rawName))
      for (let i = 0; i < h.amount; i++) out.push({ rawName, hours, place: h.place });
    for (let i = 0; i < (extra[rawName] ?? 0); i++) out.push({ rawName, hours, place: 'storage' });
  }
  return out;
}

/** FR-9: the smallest candy of at least `hours`, the character's own bag before storage. Removed from the pool. */
export function takeCandy(pool: CandyUnit[], hours: number, index: number): CandyUnit | null {
  const fits = pool
    .map((u, i) => ({ u, i }))
    .filter(({ u }) => u.hours >= hours && (u.place === 'storage' || u.place === `inv:c${index}`))
    .sort(
      (a, b) =>
        a.u.hours - b.u.hours ||
        Number(b.u.place === `inv:c${index}`) - Number(a.u.place === `inv:c${index}`) ||
        a.i - b.i,
    );
  const pick = fits[0];
  if (!pick) return null;
  pool.splice(pick.i, 1);
  return pick.u;
}

/** Kills per hour of a character on a map, from M14's supply rates (Toolbox `finalKillsPerHour`). */
export function killRate(ctx: StarContext, c: CharacterState, mapIndex: number): number | null {
  const r = ctx.state.account.supplyRates?.maps
    .find((m) => m.mapIndex === mapIndex)
    ?.rates.find((x) => x.characterIndex === c.index)?.finalKillsPerHour;
  return r && r > 0 ? r : null;
}
