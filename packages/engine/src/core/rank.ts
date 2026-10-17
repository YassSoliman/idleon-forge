// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Merge, dedupe and rank one subject's Goals (M10 §2). Ranking is M2's `compareGoals` (TR-14) plus the
// subject key for the last tie; the contested rule (FR-20) is one move after the sort. Dedupe follows
// M11 §6: for the same `system` and subject a blocker wins over another module's Goal; otherwise two
// Goals with the same subject and rendered text are one.
import type { Goal } from '../result';
import type { RankHints } from './module';
import { compareGoals, type Rankable, type ResolvedPriorityList } from './stubs/compare-goals';

export interface TaggedGoal {
  goal: Goal;
  rank?: RankHints;
  /** The module that emitted it. */
  moduleId: string;
}

export function rankableOf({ goal, rank }: TaggedGoal): Rankable {
  return {
    entryId: goal.nextAction.entryId,
    category: goal.category,
    stale: goal.nextAction.stale,
    contested: goal.nextAction.contested !== null,
    cost: rank?.cost ?? null,
    milestoneEtaSeconds: rank?.milestoneEtaSeconds ?? goal.milestone?.etaSeconds ?? null,
    goalsServed: rank?.goalsServed ?? 0,
    urgency: rank?.urgency ?? null,
    deadline: rank?.deadline ?? null,
    framePosition: rank?.framePosition ?? null,
  };
}

/** Drops duplicates, keeping the first of each in `goals`' order (call after sorting). */
export function dedupe(goals: readonly TaggedGoal[]): TaggedGoal[] {
  const blockerSystems = new Map<string, string>();
  for (const g of goals) if (g.goal.category === 'blocker') blockerSystems.set(g.goal.system, g.moduleId);
  const seenKeys = new Set<string>();
  const seenText = new Set<string>();
  const out: TaggedGoal[] = [];
  for (const g of goals) {
    const owner = blockerSystems.get(g.goal.system);
    if (g.goal.category !== 'blocker' && owner !== undefined && owner !== g.moduleId) continue;
    const key = g.goal.nextAction.key;
    const text = g.goal.nextAction.text.trim().toLowerCase();
    if (seenKeys.has(key) || seenText.has(text)) continue;
    seenKeys.add(key);
    seenText.add(text);
    out.push(g);
  }
  return out;
}

/**
 * FR-20: a Contested Goal is never the first non-blocker. If it is, the first non-contested
 * non-blocker moves up to take its place (one move; the rest keep their order).
 */
export function applyContestedRule(goals: TaggedGoal[]): TaggedGoal[] {
  const firstIdx = goals.findIndex((g) => g.goal.category !== 'blocker');
  const first = goals[firstIdx];
  if (firstIdx < 0 || !first || first.goal.nextAction.contested === null) return goals;
  const swapIdx = goals.findIndex(
    (g, i) => i > firstIdx && g.goal.category !== 'blocker' && g.goal.nextAction.contested === null,
  );
  if (swapIdx < 0) return goals;
  const out = [...goals];
  const [moved] = out.splice(swapIdx, 1);
  if (moved) out.splice(firstIdx, 0, moved);
  return out;
}

/** Ranks one subject's Goals: sort, dedupe, then the contested move. Blockers come first. */
export function rankGoals(goals: readonly TaggedGoal[], list: ResolvedPriorityList): Goal[] {
  const keyed = goals.map((g) => ({ g, r: rankableOf(g) }));
  keyed.sort((a, b) => {
    const c = compareGoals(a.r, b.r, list);
    if (c !== 0) return c;
    const ka = a.g.goal.nextAction.key;
    const kb = b.g.goal.nextAction.key;
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
  return applyContestedRule(dedupe(keyed.map((k) => k.g))).map((g) => g.goal);
}
