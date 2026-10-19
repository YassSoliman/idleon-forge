// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Merge, dedupe and rank one subject's Goals (M10 §2). Ranking is M2's `compareGoals` (TR-14) plus the
// subject key for the last tie; the contested rule (FR-20) is one move after the sort. Dedupe follows
// M11 §6: for the same `system` and subject a blocker wins over another module's Goal; otherwise two
// Goals with the same subject and rendered text are one.

import { compareGoals } from '../metapath/priority';
import type { Rankable, ResolvedPriorityList } from '../metapath/types';
import type { Goal, Subject } from '../result';
import type { RankHints } from './module';

export interface TaggedGoal {
  goal: Goal;
  rank?: RankHints;
  /** ModuleGoal.slots: the finding's slots (M15 F5 `when` rows). */
  slots?: Readonly<Record<string, string | number>>;
  /** The module that emitted it. */
  moduleId: string;
}

export function rankableOf({ goal, rank }: TaggedGoal): Rankable {
  return {
    entryId: rank?.rankAs ?? goal.nextAction.entryId,
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

/** One claimed thing (M26 FR-5): `${system}:${key}`, owned by `system`. */
export interface ClaimRef {
  system: string;
  key: string;
}

/**
 * M26 FR-5: one card per claimed thing. Among one subject's Goals whose entries claim the same key, the
 * one from the entry of the owning System stays (else the first in `goals`' order) and each other
 * one's `why` becomes a detail line on it. Goals without claims pass through untouched, in order.
 */
export function applyClaims(
  goals: readonly TaggedGoal[],
  claimsOf: (entryId: string) => readonly ClaimRef[] | undefined,
  subject: Subject,
): TaggedGoal[] {
  const groups = new Map<string, { system: string; members: TaggedGoal[] }>();
  for (const g of goals)
    for (const c of claimsOf(g.goal.nextAction.entryId) ?? []) {
      const id = `${c.system}:${c.key}`;
      const group = groups.get(id) ?? { system: c.system, members: [] };
      if (!group.members.includes(g)) group.members.push(g);
      groups.set(id, group);
    }
  const dropped = new Set<TaggedGoal>();
  const extra = new Map<TaggedGoal, string[]>();
  for (const { system, members } of groups.values()) {
    const live = members.filter((m) => !dropped.has(m));
    if (live.length < 2) continue;
    const owner = live.find((m) => m.goal.system === system) ?? (live[0] as TaggedGoal);
    for (const m of live) {
      if (m === owner) continue;
      dropped.add(m);
      const lines = extra.get(owner) ?? [];
      const why = m.goal.nextAction.why.trim() || m.goal.nextAction.text;
      if (!lines.includes(why)) lines.push(why);
      extra.set(owner, lines);
    }
  }
  return goals
    .filter((g) => !dropped.has(g))
    .map((g) => {
      const lines = extra.get(g);
      if (!lines) return g;
      const details = [...(g.goal.details ?? []), ...lines.map((text) => ({ subject, text }))];
      return { ...g, goal: { ...g.goal, details } };
    });
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
  return applyContestedRule(dedupe(keyed.map((k) => k.g))).map(withUrgency);
}

/** M17 TR-2: the module's ranking urgency rides on the Goal, for the Systems hub's "wasting". */
const withUrgency = ({ goal, rank }: TaggedGoal): Goal =>
  rank?.urgency ? { ...goal, urgency: rank.urgency } : goal;
