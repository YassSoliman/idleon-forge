// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The pusher (M2 FR-11, FR-13, TR-10, D1): the one character that should open the next portal, by
// Toolbox's kill rate on the frontier door (computed in the worker, `account.frontier`), with an
// incumbent margin so the choice doesn't flip on noise. Needs no save history: a pure function of one
// Account State.
import type { AccountState, Frontier, FrontierFight } from '@idleon-forge/account-state';
import { pusherMargin } from './knowledge';
import type { FactLookup, PusherResult } from './types';

export interface Wall {
  /** The strongest candidate (FR-13 order). */
  characterIndex: number;
  reason: 'hit' | 'survivability';
  hitChance: number;
  survivability: number;
}

export type PusherSelection =
  | { kind: 'pusher'; pusher: PusherResult; frontier: Frontier }
  | { kind: 'wall'; wall: Wall; frontier: Frontier }
  | { kind: 'no-frontier' };

/** Full hit chance and survivability, in Toolbox's % unit. */
const FULL = 100;

/** TR-10 steps 2–4 over a frontier, with the D1 margin. */
export function choosePusher(
  frontier: Frontier,
  levelOf: (i: number) => number,
  margin: number,
): PusherSelection {
  const route = new Map(frontier.routeCleared.map((r) => [r.characterIndex, r]));
  const reaches = (f: FrontierFight) => route.get(f.characterIndex)?.reachesFrontier === true;
  const level = (f: FrontierFight) => levelOf(f.characterIndex);
  const fights = frontier.fights.filter((f) => level(f) > 0);
  const candidates = fights.filter((f) => f.finalKillsPerHour > 0 && reaches(f));

  if (candidates.length === 0) {
    // FR-13: finalKillsPerHour is floored, so "strongest" ranks by the unfloored rate, then hit chance,
    // survivability, level and lower index. Reachable characters first.
    const pool = fights.some(reaches) ? fights.filter(reaches) : fights;
    const best = [...pool].sort(
      (a, b) =>
        b.killsPerHour - a.killsPerHour ||
        b.hitChance - a.hitChance ||
        b.survivability - a.survivability ||
        level(b) - level(a) ||
        a.characterIndex - b.characterIndex,
    )[0];
    if (!best) return { kind: 'no-frontier' };
    return {
      kind: 'wall',
      frontier,
      wall: {
        characterIndex: best.characterIndex,
        reason: best.hitChance < FULL ? 'hit' : 'survivability',
        hitChance: best.hitChance,
        survivability: best.survivability,
      },
    };
  }

  // Step 3: the incumbent has walked the path furthest; ties on kills on the frontier door (killsLeft is
  // clamped at 0, so two characters past the door tie), then level, then lower index. Never on rate.
  const incumbent = [...candidates].sort(
    (a, b) =>
      (route.get(b.characterIndex)?.count ?? 0) - (route.get(a.characterIndex)?.count ?? 0) ||
      a.killsLeft - b.killsLeft ||
      level(b) - level(a) ||
      a.characterIndex - b.characterIndex,
  )[0] as FrontierFight;
  // Step 4: the challenger takes over only with at least `margin` x the incumbent's pace. Door kills are
  // per character, so the pace is the time to open the door (kills left over the floored kill rate), not
  // the rate alone: a character 864 kills from the door is not overtaken by one 7,998 away that kills
  // 1.3x faster (M24 fix). With equal kills left this is exactly the D1 rate rule; once the incumbent has
  // no kills left (it is through the door, a `hardest-cleared` frontier), the rate rule applies as before.
  const byRate = (a: FrontierFight, b: FrontierFight) =>
    b.finalKillsPerHour - a.finalKillsPerHour || level(b) - level(a) || a.characterIndex - b.characterIndex;
  let pick: FrontierFight;
  let challenger: FrontierFight;
  if (incumbent.killsLeft <= 0) {
    challenger = [...candidates].sort(byRate)[0] as FrontierFight;
    pick = challenger.finalKillsPerHour >= margin * incumbent.finalKillsPerHour ? challenger : incumbent;
  } else {
    // Soonest first: a.left / a.rate < b.left / b.rate, cross-multiplied so the boundary is exact.
    challenger = [...candidates].sort(
      (a, b) => a.killsLeft * b.finalKillsPerHour - b.killsLeft * a.finalKillsPerHour || byRate(a, b),
    )[0] as FrontierFight;
    pick =
      margin * challenger.killsLeft * incumbent.finalKillsPerHour <=
      incumbent.killsLeft * challenger.finalKillsPerHour
        ? challenger
        : incumbent;
  }
  return {
    kind: 'pusher',
    frontier,
    pusher: {
      index: pick.characterIndex,
      frontierMap: frontier.mapIndex,
      incumbent: incumbent.characterIndex,
      fastest: challenger.characterIndex,
    },
  };
}

/** M2 FR-11: the pusher from `account.frontier`. */
export function selectPusher(state: AccountState, kb: FactLookup): PusherSelection {
  const frontier = state.account.frontier ?? null;
  if (frontier === null) return { kind: 'no-frontier' };
  const levels = new Map(state.characters.map((c) => [c.index, c.level]));
  return choosePusher(frontier, (i) => levels.get(i) ?? 0, pusherMargin(kb));
}
