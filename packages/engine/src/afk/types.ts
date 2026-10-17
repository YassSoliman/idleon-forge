// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's engine API (M3 TR-3), plus minimal local copies of the shapes other modules own and
// that are not on main yet. Each copy is marked with its owner so the rebase is a swap of imports:
//   TODO(M10): `packages/engine/src/result.ts` (EngineResult's NextAction, Verdict, Fill, SourceRef, ...).
//   TODO(M2):  `StageResult` (only its Stage id is read here).
//   TODO(M4):  `PurposeStatus`.
import type { StageId } from '@idleon-forge/knowledge';

// ---------- M10 TR-2 shapes (TODO(M10): import from '../result') ----------

/** 'account' or `c<index>`, where index is CharacterState.index. Never a name. */
export type Subject = 'account' | `c${number}`;
export type Category = 'blocker' | 'compounding' | 'spendable' | 'nice';
export type VerdictKind = 'ready' | 'fix' | 'unknown';

export interface SourceRef {
  label: string;
  url: string;
  tier: 1 | 2 | 3 | 4;
  verifiedOn: string;
  gameVersion: string;
}
export interface Provenance {
  entryIds: string[];
  fields: string[];
}
export interface NextAction {
  /** `${entryId}@${subject}`. */
  key: string;
  entryId: string;
  text: string;
  why: string;
  sources: SourceRef[];
  stale: boolean;
  contested: null | { sides: { text: string; sources: SourceRef[] }[] };
  confidence: 'H' | 'M' | 'L';
  provenance: Provenance;
}
export interface Goal {
  id: string;
  title: string;
  system: string;
  category: Category;
  nextAction: NextAction;
  milestone: null;
}
export interface Verdict {
  kind: VerdictKind;
  blockerKeys: string[];
  unknownReason: null | 'no-purpose' | 'cannot-tell' | 'not-covered';
  suggestion: NextAction | null;
}
export interface Fill {
  label: string;
  at: number;
  subject: Subject;
}

// ---------- M2 / M4 (TODO(M2), TODO(M4)) ----------

/** TODO(M2): M2 TR-4 `StageResult`; M3 reads only the Stage id, for `appliesTo.stages`. */
export interface StageLike {
  id: StageId | null;
}

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

export interface SubjectResult {
  safety: Safety;
  /** Blockers first (FR-10), then Next Actions. */
  findings: SafetyFinding[];
  firstFill: Fill | null;
}

export interface AfkSafetyResult {
  expectedReturn: ExpectedReturn;
  returnAt: number;
  characters: Array<SubjectResult & { index: number }>;
  account: SubjectResult;
  firstFill: Fill | null;
  /** Findings already at cap that are Next Actions whose fix holds (FR-11, RT-13). */
  alreadyFull: number;
  /** Detectors that threw (M11 FR-13): their entries count as `unknown`. */
  failedDetectors: Array<{ detectorId: string; entryIds: string[]; message: string }>;
}
