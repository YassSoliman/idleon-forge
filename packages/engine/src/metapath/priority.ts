// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Priority Lists and the one ranking comparator (M2 FR-18 to FR-22, TR-13, TR-14). Every module's
// Goals are ranked with `compareGoals`, so the order is total and stable whatever order they arrive in.
// There are no numeric weights anywhere: a position is a tier index in an authored list.
import { STAGES, type StageId, stageIndex } from '@idleon-forge/knowledge';
import type { MetaPathKnowledge, Rankable, ResolvedPriorityList, StageResult } from './types';

/** The shared frame (TR-13): never-skip at 1, the push at 2, free-value fills at 3, Stage items from 4. */
export const FRAME = { neverSkip: 1, push: 2, freeValue: 3, firstStageItem: 4 } as const;
export const PUSH_GOAL_ID = 'metapath.goal.push';

/** No list at all (no Stage): everything is unlisted, so only TR-14's later steps order Goals. */
export const EMPTY_PRIORITY_LIST: ResolvedPriorityList = {
  stage: null,
  listId: null,
  positions: {},
  lastPosition: 0,
  byUrgency: [],
  carryForward: [],
  contested: [],
  frameOnly: false,
};

const listIdOf = (kb: Pick<MetaPathKnowledge, 'priorityByStage'>, stage: StageId) =>
  kb.priorityByStage[stage]?.goals ?? null;

/**
 * TR-13: the Stage's list after include resolution. An include is one position (the compiler already
 * flattened it into one tier). A Stage with no list file yet gets the frame alone: the push at 2.
 */
export function selectPriorityList(
  stage: Pick<StageResult, 'id' | 'coverage'>,
  kb: Pick<MetaPathKnowledge, 'lists' | 'priorityByStage' | 'entries'>,
): ResolvedPriorityList {
  const empty: ResolvedPriorityList = {
    stage: stage.id,
    listId: null,
    positions: {},
    lastPosition: FRAME.freeValue,
    byUrgency: [],
    carryForward: [],
    contested: [],
    frameOnly: stage.coverage === 'beyond',
  };
  if (stage.id === null) return { ...empty, lastPosition: 0 };
  const listId = listIdOf(kb, stage.id);
  const list = listId ? kb.lists[listId] : undefined;
  const positions: Record<string, number> = {};
  const byUrgency: string[] = [];
  const contested: string[] = [];
  if (!list) positions[PUSH_GOAL_ID] = FRAME.push;
  list?.positions.forEach((tier, i) => {
    for (const item of tier) {
      positions[item.id] ??= i + 1;
      if (item.byUrgency) byUrgency.push(item.id);
      if (item.contested) contested.push(item.id);
    }
  });
  const lastPosition = list ? Math.max(list.positions.length, FRAME.freeValue) : FRAME.freeValue;

  // Carry-forward (M8 D5): items an earlier Stage's list marks carryForward, still applying, not listed here.
  const carryForward: string[] = [];
  for (const earlier of STAGES.slice(0, stageIndex(stage.id))) {
    const id = listIdOf(kb, earlier);
    for (const tier of (id ? kb.lists[id]?.positions : undefined) ?? [])
      for (const item of tier)
        if (
          item.carryForward &&
          !(item.id in positions) &&
          !carryForward.includes(item.id) &&
          applies(kb, item.id, stage.id)
        )
          carryForward.push(item.id);
  }

  if (stage.coverage === 'beyond') {
    // FR-5, D2: only positions 1 and 3 rank.
    for (const [id, p] of Object.entries(positions))
      if (p !== FRAME.neverSkip && p !== FRAME.freeValue) delete positions[id];
    return { ...empty, listId, positions, byUrgency, contested, lastPosition: FRAME.freeValue };
  }
  return { ...empty, listId, positions, lastPosition, byUrgency, carryForward, contested };
}

/** Whether an entry's appliesTo names `stage` (unknown entries apply, so a missing entry never hides a Goal). */
function applies(kb: Pick<MetaPathKnowledge, 'entries'>, id: string, stage: StageId): boolean {
  const e = kb.entries[id.split('#')[0] as string];
  if (!e) return true;
  const s = e.appliesTo.stages;
  if (s === 'all') return true;
  return s.some((x) =>
    typeof x === 'string'
      ? x === stage
      : stageIndex(stage) >= stageIndex(x.from) && stageIndex(stage) <= stageIndex(x.to),
  );
}

/** Position of an entry in the resolved list, or null when unlisted (ranks at +∞, FR-21). */
export function positionOf(list: ResolvedPriorityList, entryId: string): number | null {
  return Object.hasOwn(list.positions, entryId) ? (list.positions[entryId] as number) : null;
}

/** TR-13 by urgency: position 1 while value is being lost before the return, else position 3. */
export function framePositionOf(urgency: Rankable['urgency']): 1 | 3 {
  return urgency === 'losing-now' || urgency === 'lost-before-return' ? FRAME.neverSkip : FRAME.freeValue;
}

/** The position a Goal ranks at (TR-14 step 2): carried-forward items just after the last authored position. */
export function rankPosition(
  x: Pick<Rankable, 'entryId' | 'framePosition' | 'atLastPosition'>,
  list: ResolvedPriorityList,
): number {
  if (x.framePosition !== null) return x.framePosition;
  if (x.atLastPosition) return list.lastPosition;
  const p = positionOf(list, x.entryId);
  if (p !== null) return p;
  if (list.carryForward.includes(x.entryId)) return list.lastPosition + 0.5;
  return Number.POSITIVE_INFINITY;
}

const URGENCY = { 'losing-now': 0, 'lost-before-return': 1, banked: 2 } as const;
const COST_UNIT = { none: 0, hours: 1, coins: 2, gems: 3 } as const;
const NULL_LAST = Number.POSITIVE_INFINITY;
const cmp = (a: number, b: number) => (a === b ? 0 : a < b ? -1 : 1);
const str = (a: string, b: string) => (a === b ? 0 : a < b ? -1 : 1);

/** TR-14: the one total order for every Goal. */
export function compareGoals(a: Rankable, b: Rankable, list: ResolvedPriorityList): number {
  return (
    // 1. Verdict blockers first.
    cmp(a.category === 'blocker' ? 0 : 1, b.category === 'blocker' ? 0 : 1) ||
    // 2. Lower list position.
    cmp(rankPosition(a, list), rankPosition(b, list)) ||
    // 3. Urgency, then deadline (soonest first, none last).
    cmp(a.urgency === null ? 3 : URGENCY[a.urgency], b.urgency === null ? 3 : URGENCY[b.urgency]) ||
    cmp(a.deadline ?? NULL_LAST, b.deadline ?? NULL_LAST) ||
    // 4. Fresh before Stale.
    cmp(Number(a.stale), Number(b.stale)) ||
    // 5. Cheaper first: a fixed unit order (null cost after gems), then the amount.
    cmp(a.cost === null ? 4 : COST_UNIT[a.cost.unit], b.cost === null ? 4 : COST_UNIT[b.cost.unit]) ||
    cmp(a.cost?.amount ?? 0, b.cost?.amount ?? 0) ||
    // 6. Closest Milestone.
    cmp(a.milestoneEtaSeconds ?? NULL_LAST, b.milestoneEtaSeconds ?? NULL_LAST) ||
    // 7. Most Goals per activity.
    cmp(b.goalsServed, a.goalsServed) ||
    // 8. Entry id, then subject.
    str(a.entryId, b.entryId) ||
    str(a.subjectKey ?? '', b.subjectKey ?? '')
  );
}

/** M6 `effortSeconds` as a cost (TR-14 step 5). */
export const effortCost = (effortSeconds: number): Rankable['cost'] => ({
  unit: 'hours',
  amount: effortSeconds / 3600,
});

/**
 * Sorts with `compareGoals`, then applies FR-20 as a single move: a Contested entry never ranks first,
 * so when the top item is contested the first non-contested item moves above it.
 */
export function rankGoals<T extends Rankable>(items: readonly T[], list: ResolvedPriorityList): T[] {
  const sorted = [...items].sort((a, b) => compareGoals(a, b, list));
  if (sorted[0]?.contested) {
    const i = sorted.findIndex((x) => !x.contested);
    if (i > 0) sorted.unshift(...sorted.splice(i, 1));
  }
  return sorted;
}
