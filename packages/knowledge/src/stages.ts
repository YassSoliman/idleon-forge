// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The one file M2 owns inside this package (M11 TR-2 notes, M2 TR-4). M11 ships the ids and the type
// so the schema can validate Stage references; M2 fills `STAGE_DEFINITIONS` (labels are fixed here,
// the rules live in the Meta Path `stages` entry and its fact refs). `packages/engine` re-exports it.

/**
 * The Stages of the Leverage model (#26), oldest first. Order matters: ranges use it. M26 FR-3 added
 * `W4-mid` and `W4-late` (owner Q2); their rule is the Meta Path `stages` entry. An account past World 4
 * reads `W4-late` with `coverage: 'beyond'`.
 */
export const STAGES = [
  'W1-early',
  'W1-mid',
  'W1-late',
  'W2-early',
  'W2-mid',
  'W2-late',
  'W3-early',
  'W3-mid',
  'W3-late',
  'W4-entry',
  'W4-mid',
  'W4-late',
] as const;

export type StageId = (typeof STAGES)[number];

export interface StageDefinition {
  id: StageId;
  /** "World 2, late". */
  label: string;
  world: 1 | 2 | 3 | 4;
}

const PART: Record<string, string> = { early: 'early', mid: 'mid', late: 'late', entry: 'entry' };

/** Labels and worlds for every Stage. M2 owns the rules that place an account in one (M2 TR-5). */
export const STAGE_DEFINITIONS: Readonly<Record<StageId, StageDefinition>> = Object.fromEntries(
  STAGES.map((id) => {
    const [w, part] = id.split('-') as [string, string];
    const world = Number(w.slice(1)) as 1 | 2 | 3 | 4;
    return [id, { id, label: `World ${world}, ${PART[part] ?? part}`, world }];
  }),
) as Record<StageId, StageDefinition>;

/** Position of a Stage in `STAGES` (0-based); -1 for an unknown id. */
export const stageIndex = (id: string): number => (STAGES as readonly string[]).indexOf(id);

/** Every Stage from `from` to `to`, inclusive, in order. Empty when `to` comes before `from`. */
export function stagesBetween(from: StageId, to: StageId): StageId[] {
  const a = stageIndex(from);
  const b = stageIndex(to);
  return a < 0 || b < a ? [] : STAGES.slice(a, b + 1);
}

/**
 * The beyond policy (M26 FR-3): a range whose `to` is this Stage or later is open-ended. It stays live
 * through `W4-late` and for accounts past World 4, unless the entry sets `stopsAt`. Every entry written
 * before W4-mid existed said `to: W4-entry` and meant "and everything after", so it keeps that meaning.
 */
export const OPEN_ENDED_FROM: StageId = 'W4-entry';

/** One `appliesTo.stages` item: a Stage, or an inclusive range. */
export type StageSpan = StageId | { from: StageId; to: StageId };

export interface StageScope {
  stages: 'all' | readonly StageSpan[];
  /** The first Stage the entry no longer applies at (M26 FR-3); binds open-ended ranges too. */
  stopsAt?: StageId;
}

/** The Stages one span covers, with the beyond policy applied. */
export function spanStages(span: StageSpan): StageId[] {
  const { from, to } = typeof span === 'string' ? { from: span, to: span } : span;
  const last = stageIndex(to) >= stageIndex(OPEN_ENDED_FROM) ? (STAGES[STAGES.length - 1] as StageId) : to;
  return stagesBetween(from, last);
}

/** Every Stage an `appliesTo` covers (beyond policy and `stopsAt` applied), in order. */
export function stagesOf(scope: StageScope): StageId[] {
  const all =
    scope.stages === 'all'
      ? [...STAGES]
      : STAGES.filter((id) => scope.stages !== 'all' && scope.stages.some((s) => spanStages(s).includes(id)));
  const stop = scope.stopsAt === undefined ? -1 : stageIndex(scope.stopsAt);
  return stop < 0 ? all : all.filter((id) => stageIndex(id) < stop);
}

/**
 * Whether an entry's `appliesTo` covers `stage`. True when the Stage is unknown (no gate to apply), so a
 * missing Stage never hides advice. The one rule every module uses (M26 FR-3).
 */
export function appliesAtStage(scope: StageScope, stage: StageId | string | null): boolean {
  if (stage === null || stageIndex(stage) < 0) return true;
  return stagesOf(scope).includes(stage as StageId);
}
