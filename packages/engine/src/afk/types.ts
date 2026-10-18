// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's engine API (M3 TR-3). The shapes other modules own come from them: M10's
// EngineResult types (../result) and M2's StageResult (../metapath). M4's PurposeStatus is not on
// main yet, so a minimal local copy stays, marked TODO(M4).
import type { StageResult } from '../metapath/types';
import type { Fill, NextAction, Subject } from '../result';

export type {
  Category,
  Fill,
  Goal,
  NextAction,
  Provenance,
  SourceRef,
  Subject,
  Verdict,
  VerdictKind,
} from '../result';

/** The part of M2's StageResult M3 reads: the Stage id, for `appliesTo.stages`. */
export type StageLike = Pick<StageResult, 'id'>;

/** TODO(M4): M4 TR-3 `PurposeStatus`. Until M4 ships the engine passes 'not-implemented' (D4). */
export type PurposeStatus = 'serving' | 'not-covered' | 'exhausted' | 'none' | 'no-activity' | 'cannot-tell';

// ---------- M3 TR-3 ----------

export interface ExpectedReturn {
  usedMs: number;
  learnedMs: number | null;
  source: 'player' | 'learned' | 'default';
}

export type Safety = 'safe' | 'unsafe' | 'unknown' | 'not-covered';

export type DemotedBecause = 'not-quick' | 'not-fillable' | 'fix-does-not-hold' | 'effect-next-action';

export interface SafetyFinding {
  /** `${entryId}@${subject}`, as M10 NextAction.key. */
  key: string;
  entryId: string;
  subject: Subject;
  role: 'blocker' | 'next-action';
  /** When it bites; null for present-state Checks. */
  at: number | null;
  fixHolds: boolean;
  demotedBecause: DemotedBecause | null;
  nextAction: NextAction;
}

/**
 * A quick-collect cap shown as a pill, not a Finding (Final rulings R-PILL-1): an entry with a
 * `values.pill` label (the anvil, worship charge, traps finishing early). It never sets Safety, never
 * blocks and is never a Goal.
 */
export interface CapPill {
  /** `${entryId}@${subject}`, the same key the old Next Action had, so a Skip today carries over. */
  key: string;
  entryId: string;
  subject: Subject;
  /** When the cap is reached; at or before `now` is full now. */
  at: number | null;
  fullNow: boolean;
  /** "Anvil full · collect", "Anvil full in about 3h · collect". */
  label: string;
  /** The entry's full text (with the refill time), its Why and Sources. */
  nextAction: NextAction;
}

export interface SubjectResult {
  safety: Safety;
  /** Blockers first (FR-10), then Next Actions. */
  findings: SafetyFinding[];
  /** R-PILL-1: full now first, then soonest, then entry id. */
  caps: CapPill[];
  firstFill: Fill | null;
}

export interface AfkSafetyResult {
  expectedReturn: ExpectedReturn;
  returnAt: number;
  characters: Array<SubjectResult & { index: number }>;
  account: SubjectResult;
  firstFill: Fill | null;
  /** Findings already at cap that are Next Actions whose fix holds (FR-11, RT-13), plus cap pills full now (R-PILL-1). */
  alreadyFull: number;
  /** Detectors that threw (M11 FR-13): their entries count as `unknown`. */
  failedDetectors: Array<{ detectorId: string; entryIds: string[]; message: string }>;
}
