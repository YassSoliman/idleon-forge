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
  // Step 4: the fastest candidate takes over only with at least `margin` x the incumbent's rate.
  const fastest = [...candidates].sort(
    (a, b) =>
      b.finalKillsPerHour - a.finalKillsPerHour || level(b) - level(a) || a.characterIndex - b.characterIndex,
  )[0] as FrontierFight;
  const pick = fastest.finalKillsPerHour >= margin * incumbent.finalKillsPerHour ? fastest : incumbent;
  return {
    kind: 'pusher',
    frontier,
    pusher: {
      index: pick.characterIndex,
      frontierMap: frontier.mapIndex,
      incumbent: incumbent.characterIndex,
      fastest: fastest.characterIndex,
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
