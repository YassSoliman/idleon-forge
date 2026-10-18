// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Shared pieces of M4's Purpose Detectors (M4 TR-5): the slots the engine adds when it renders a
// Purpose line, the generated Goal a concrete Contribution points at, and who feeds a counter. Pure;
// re-exported from helpers.ts, the one module Detectors may import besides types.
import type { AccountState, CharacterState } from '@idleon-forge/account-state';
import { isKnown } from '@idleon-forge/account-state';
import { z } from 'zod';
import type { Entry, FactTable } from './schema';
import type { DetectorContext } from './types';

/**
 * Slots M4's engine fills before rendering a Purpose line or a stop-here (M4 TR-3), declared on every
 * Purpose Detector so `kb check` accepts them in templates: the counter now ("~2,995"), the next and
 * following Milestones ("10k", "100k") and their ETAs ("about 5h"). Never set by a Detector.
 */
export const PURPOSE_ENGINE_SLOTS = {
  now: z.string(),
  at: z.string(),
  later: z.string(),
  etaText: z.string(),
  laterEtaText: z.string(),
} as const;

/** The `goal` param the engine passes to a concrete Contribution's Detector (M4 TR-4 expansion). */
export const purposeGoalParam = { goal: z.string().optional() } as const;

type GoalLike = Extract<Entry, { type: 'goal' }> & { data?: Record<string, unknown> };

/** The generated Goal a concrete Contribution names, or null when it is not in the Knowledge Base. */
export function purposeGoal(ctx: Pick<DetectorContext, 'facts'>, id: string | undefined): GoalLike | null {
  if (!id) return null;
  const e = ctx.facts.get(id) as Readonly<Entry | FactTable> | undefined;
  return e && 'type' in e && e.type === 'goal' ? (e as GoalLike) : null;
}

/** The Milestone `at` values of a Goal, ascending. */
export const ladderOf = (g: Pick<GoalLike, 'milestones'> | null): number[] =>
  [...(g?.milestones ?? []).map((m) => m.at)].sort((a, b) => a - b);

/** A Goal `values` entry as a number or a string, or null. */
export const valueNum = (g: GoalLike | null, k: string): number | null => {
  const v = g?.values?.[k];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
};
export const valueStr = (g: GoalLike | null, k: string): string | null => {
  const v = g?.values?.[k];
  return typeof v === 'string' ? v : null;
};

/** `characters[3].fighting` etc. are known and present for character `c`. */
export const knownOn = (state: AccountState, c: CharacterState, ...fields: string[]): boolean =>
  fields.every((f) => isKnown(state, `characters[${c.index}].${f}`));

/**
 * The characters AFK fighting `target` (the saved target, never re-derived from the map, M4 §6), with
 * their current-map kill rate. A fighter whose rate is unknown is listed with `rate: null`.
 */
export function fightersOf(
  state: AccountState,
  match: (c: CharacterState) => boolean,
): { c: CharacterState; rate: number | null }[] {
  return state.characters
    .filter((c) => c.afkType === 'FIGHTING' && match(c))
    .map((c) => ({
      c,
      rate: knownOn(state, c, 'fighting') && c.fighting ? c.fighting.finalKillsPerHour : null,
    }));
}

/** The feeders' summed rate and their indices ("0,3"), for an account-wide counter (M4 FR-4). */
export function feederSlots(feeders: readonly { c: CharacterState; rate: number | null }[]): {
  rate: number;
  feeders: string;
} {
  return {
    rate: feeders.reduce((n, f) => n + (f.rate ?? 0), 0),
    feeders: feeders.map((f) => f.c.index).join(','),
  };
}

/** The AFK types M4 calls gathering (M4 TR-4: tools, stamp materials, first-copy cards). */
export const GATHERING = ['MINING', 'CHOPPIN', 'FISHING', 'CATCHING'] as const;
/** Toolbox `skillsInfo` key per gathering AFK type. */
export const SKILL_OF_AFK: Readonly<Record<string, string>> = {
  MINING: 'mining',
  CHOPPIN: 'chopping',
  FISHING: 'fishing',
  CATCHING: 'catching',
};

export interface PortalDoor {
  door: number;
  requirement: number;
}

/** A generated portal Goal's doors (`data.doors`), in door order. */
export const portalDoors = (g: GoalLike | null): PortalDoor[] =>
  (Array.isArray(g?.data?.doors) ? (g.data.doors as PortalDoor[]) : []).filter(
    (d) => typeof d.door === 'number' && typeof d.requirement === 'number',
  );

/**
 * Kills toward each door from the raw kills left on the map (requirement minus kills left, never
 * below 0), and the first door not yet open (`next`, null once every door is open). `current` is the
 * kills toward `next`, or toward the last door once all are open.
 */
export function doorKills(
  doors: readonly PortalDoor[],
  killsLeft: readonly number[],
): { kills: number[]; next: number | null; current: number } {
  const kills = doors.map((d) =>
    Math.max(0, Math.floor(d.requirement - (killsLeft[d.door] ?? d.requirement))),
  );
  const i = doors.findIndex((d, k) => (kills[k] ?? 0) < d.requirement);
  return { kills, next: i === -1 ? null : i, current: kills[i === -1 ? kills.length - 1 : i] ?? 0 };
}
