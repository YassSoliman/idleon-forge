// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The one file M2 owns inside this package (M11 TR-2 notes, M2 TR-4). M11 ships the ids and the type
// so the schema can validate Stage references; M2 fills `STAGE_DEFINITIONS` (labels are fixed here,
// the rules live in the Meta Path `stages` entry and its fact refs). `packages/engine` re-exports it.

/** The 10 Stages of the Leverage model (#26), oldest first. Order matters: ranges use it. */
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
