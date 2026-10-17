// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
//
// STUB FOR M2 TO REPLACE. The one ranking comparator and the Priority List frame are M2's (M2 TR-13,
// TR-14, `packages/engine/src/meta-path/priority.ts`). M2 isn't merged, so the engine core ranks with
// this minimal copy behind M2's documented interface (`Rankable`, `ResolvedPriorityList`,
// `compareGoals(a, b, list)`, `positionOf(list, entryId)`). It implements TR-14's eight steps over a
// list that only knows positions; it resolves no Stage list (that is M2's `selectPriorityList`).
// When M2 lands, delete this file and import `compareGoals`, `positionOf`, `Rankable`,
// `ResolvedPriorityList` and `VisitHint` from `../../meta-path/priority` and `../../meta-path/roles`.
import type { Category, Provenance } from '../../result';

export interface Rankable {
  entryId: string;
  /** M10: 'blocker' | 'compounding' | 'spendable' | 'nice'. */
  category: Category;
  stale: boolean;
  contested: boolean;
  cost: { unit: 'coins' | 'gems' | 'hours' | 'none'; amount: number } | null;
  milestoneEtaSeconds: number | null;
  /** Contributions count for its activity (M4). */
  goalsServed: number;
  /** From an M6 finding (M11 CheckFinding.urgency); null for every other module. */
  urgency: 'losing-now' | 'lost-before-return' | 'banked' | null;
  /** Epoch ms when the value starts to be lost (M6 TR-6); null when none. */
  deadline: number | null;
  /** By-urgency items only (TR-13): 1 while urgency is losing-now or lost-before-return, else 3. */
  framePosition: 1 | 3 | null;
}

/** The part of M2's resolved Stage list the comparator reads. */
export interface ResolvedPriorityList {
  /** `metapath.priority.<stage>`, or 'none' before M2 resolves one. */
  id: string;
  /** Entry id -> tier index (= position). Unlisted entries are absent (+∞). */
  positions: Readonly<Record<string, number>>;
  /** The last authored position, the tie of Class XP and friends (M2 TR-13). */
  lastPosition: number;
  /** Entries that carry forward from an earlier Stage list: they rank right after `lastPosition`. */
  carriedForward: readonly string[];
}

/** M2 TR-12: Visit Order hints. */
export interface VisitHint {
  characterIndex: number;
  kind: 'pool-after' | 'cooldown-ready' | 'skip-trap-stop';
  after?: number[];
  roleId: string;
  provenance: Provenance;
}

/** An empty list: everything unlisted, so only TR-14's later steps order Goals. */
export const EMPTY_PRIORITY_LIST: ResolvedPriorityList = {
  id: 'none',
  positions: {},
  lastPosition: 0,
  carriedForward: [],
};

/** Position of an entry in the resolved list, or null when unlisted (ranks at +∞, M2 FR-21). */
export function positionOf(list: ResolvedPriorityList, entryId: string): number | null {
  return list.positions[entryId] ?? null;
}

const URGENCY = { 'losing-now': 0, 'lost-before-return': 1, banked: 2 } as const;
const COST_UNIT = { none: 0, hours: 1, coins: 2, gems: 3 } as const;

const effectivePosition = (r: Rankable, list: ResolvedPriorityList): number => {
  if (r.framePosition !== null) return r.framePosition;
  const p = positionOf(list, r.entryId);
  if (p !== null) return p;
  if (list.carriedForward.includes(r.entryId)) return list.lastPosition + 0.5;
  return Number.POSITIVE_INFINITY;
};

const nullLast = (a: number | null, b: number | null): number =>
  a === b ? 0 : a === null ? 1 : b === null ? -1 : a - b;

/**
 * M2 TR-14's total order, steps 1–8 (the subject-key half of step 8 is the caller's: Rankable has no
 * subject). The contested rule (FR-20) is applied after sorting, by the caller, as a single move.
 */
export function compareGoals(a: Rankable, b: Rankable, list: ResolvedPriorityList): number {
  // 1. blocker first
  const blocker = Number(b.category === 'blocker') - Number(a.category === 'blocker');
  if (blocker !== 0) return blocker;
  // 2. lower list position
  const pa = effectivePosition(a, list);
  const pb = effectivePosition(b, list);
  if (pa !== pb) return pa < pb ? -1 : 1;
  // 3. urgency, then deadline (soonest first, null last)
  const ua = a.urgency === null ? 3 : URGENCY[a.urgency];
  const ub = b.urgency === null ? 3 : URGENCY[b.urgency];
  if (ua !== ub) return ua - ub;
  const deadline = nullLast(a.deadline, b.deadline);
  if (deadline !== 0) return deadline;
  // 4. fresh before Stale
  if (a.stale !== b.stale) return a.stale ? 1 : -1;
  // 5. cheaper first: fixed unit order, then amount; null cost after gems
  const ca = a.cost === null ? 4 : COST_UNIT[a.cost.unit];
  const cb = b.cost === null ? 4 : COST_UNIT[b.cost.unit];
  if (ca !== cb) return ca - cb;
  if (a.cost && b.cost && a.cost.amount !== b.cost.amount) return a.cost.amount - b.cost.amount;
  // 6. smaller milestone ETA first (null last)
  const eta = nullLast(a.milestoneEtaSeconds, b.milestoneEtaSeconds);
  if (eta !== 0) return eta;
  // 7. more Goals served first
  if (a.goalsServed !== b.goalsServed) return b.goalsServed - a.goalsServed;
  // 8. entry id
  return a.entryId < b.entryId ? -1 : a.entryId > b.entryId ? 1 : 0;
}
