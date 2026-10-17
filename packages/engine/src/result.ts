// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine output the Now screen consumes (M10 TR-2): the contract M2–M9 produce, assembled by the
// engine core. Plain data only, so it survives `structuredClone` across the worker boundary (TR-6):
// no functions, Maps, class instances or Dates. All times are epoch ms, all durations seconds.
// A change here needs a note on M10's spec and on the producer module's spec.
import type { SpendPlan } from './core/stubs/spend-plan';

export type { SpendLine, SpendPlan, SpendSink, SpendStatus, SpendStep } from './core/stubs/spend-plan';

export type VerdictKind = 'ready' | 'fix' | 'unknown';
export type Category = 'blocker' | 'compounding' | 'spendable' | 'nice';
/** 'account' or `c<index>`, where index is CharacterState.index. Never a name. */
export type Subject = 'account' | `c${number}`;

export interface SourceRef {
  /** "wiki", "game data", "Iacchus's class setups". */
  label: string;
  /** Rendered as a link only when its protocol is https: (TR-13). */
  url: string;
  /** ADR 0004. */
  tier: 1 | 2 | 3 | 4;
  /** ISO date. */
  verifiedOn: string;
  /** "2.3.540". */
  gameVersion: string;
}
export interface Provenance {
  entryIds: string[];
  fields: string[];
}

export interface NextAction {
  /**
   * Stable across saves for the same entry and subject: `${entryId}@${subject}`. Keys done, skip and
   * dismiss. A stop-here suggestion adds `#${milestone}` (M4 TR-3, TR-8).
   */
  key: string;
  entryId: string;
  /** Template already filled by the engine. */
  text: string;
  why: string;
  /** Ordered by ADR 0004 precedence; at least 1. */
  sources: SourceRef[];
  stale: boolean;
  contested: null | { sides: { text: string; sources: SourceRef[] }[] };
  confidence: 'H' | 'M' | 'L';
  provenance: Provenance;
}
export interface Milestone {
  /** "Poop kills". */
  unit: string;
  current: number;
  next: number;
  /** Fighting only (ADR 0005); null for skilling. */
  etaSeconds: number | null;
  stopHere: boolean;
}
export interface Goal {
  /** Goal entry id. */
  id: string;
  /** "Talents", "AFK Setup". */
  title: string;
  system: string;
  /** Display label only; never orders anything (M2 TR-14, M6 D1). */
  category: Category;
  /** Exactly one (glossary). */
  nextAction: NextAction;
  milestone: Milestone | null;
}
export interface PurposeLine {
  goalId: string;
  title: string;
  worthwhile: boolean;
  milestone: Milestone | null;
  /** M4 GoalInstance badges; 'parser-behind' renders "may be out of date" next to the ETA (FR-11). */
  badges: ('contested' | 'stale' | 'parser-behind')[];
  sources: SourceRef[];
  provenance: Provenance;
}
export interface Verdict {
  kind: VerdictKind;
  /** Keys of the Goals (category 'blocker') that make this 'fix', in rank order. */
  blockerKeys: string[];
  unknownReason: null | 'no-purpose' | 'cannot-tell' | 'not-covered';
  /** For 'no-purpose': the single suggestion (M5 `unknown-purpose` option, or M4's Role fallback). */
  suggestion: NextAction | null;
}
/** M5 TR-2 `HigherLeverageOption` plus rendered strings. An 'unknown-purpose' option renders as Verdict.suggestion. */
export interface HigherLeverage {
  kind: 'move' | 'handoff' | 'role-fit';
  /** M5 `hl:<kind>:<characterIndex>:<destKey>[:<partnerIndex>]`. */
  optionId: string;
  /** E.g. leverage.check.move. */
  textEntryId: string;
  /** `${textEntryId}@${optionId}` (M5 FR-17); the same on both characters of a pair. */
  key: string;
  text: string;
  why: string;
  /** CharacterState.index of the other character (handoff, role-fit). */
  partnerIndex: number | null;
  decidedBy: 'position' | 'milestone-eta' | 'goal-count';
  stale: boolean;
  /** At most 2 (M5 FR-15). */
  alsoConsidered: { text: string; reason: string }[];
  sources: SourceRef[];
  provenance: Provenance;
}
export interface ActivePlay {
  key: string;
  text: string;
  estimateSeconds: number;
  subject: Subject;
  sources: SourceRef[];
}
export interface Done {
  key: string;
  text: string;
  confirmedAt: number;
}
export interface Fill {
  label: string;
  at: number;
  subject: Subject;
}

export interface CharacterResult {
  index: number;
  /** Displayed only; never leaves the device (TR-10). */
  name: string;
  classId: string;
  classLabel: string;
  level: number;
  /** "Mining Copper", "Fighting Poop", "Nothing". */
  activityLabel: string;
  mapLabel: string | null;
  /** index === EngineResult.lastPlayedCharacterIndex. */
  isPlaying: boolean;
  verdict: Verdict;
  purpose: PurposeLine[];
  /** Ranked, uncapped; blockers first. */
  goals: Goal[];
  higherLeverage: HigherLeverage | null;
  /** From M7 SpendPlan.perCharacter: buy and move-coins lines paid by this character (M7 FR-23, D5). */
  spendChip: { lines: number; coins: number } | null;
  activePlay: ActivePlay[];
  doneThisSession: Done[];
  firstFill: Fill | null;
}

export interface NotCoveredItem {
  systemId: string;
  label: string;
}

export interface FailedDetector {
  detectorId: string;
  entryIds: string[];
  message: string;
}

export interface EngineResult {
  asOf: number;
  /** M1 FR-19; null on a tie, never moves the view. */
  lastPlayedCharacterIndex: number | null;
  /** From M1 SaveHistory.sessionStart (TR-7). */
  sessionStartedAt: number | null;
  expectedReturn: { usedSeconds: number; learnedSeconds: number | null };
  stage: { id: string; label: string };
  /** In save order. */
  characters: CharacterResult[];
  /** CharacterState.index values, worst Verdict first, then most to spend; M10 freezes it per Play Session (D6). */
  visitOrder: number[];
  account: {
    /** Ranked, uncapped, stockpile blockers first; the Spend Plan is not in here. */
    goals: Goal[];
    /** Keys of account Goals (category 'blocker') from M3's account-level Checks, in rank order (D9). */
    blockerKeys: string[];
    /** M3 FR-8 account safety. 'unknown' blocks All set like a cannot-tell Unknown (FR-25, key unknown@account). */
    safety: 'safe' | 'unsafe' | 'unknown' | 'not-covered';
    /** M7 TR-3. */
    spendPlan: SpendPlan | null;
    activePlay: ActivePlay[];
    doneThisSession: Done[];
  };
  /** Earliest across the account. */
  firstFill: Fill | null;
  /** M3 FR-11: Findings already at cap that are Next Actions (e.g. skull-less worship at 50/50). */
  alreadyFull: number;
  /** M5 TR-2 HigherLeverageResult.status. */
  higherLeverageStatus: 'ok' | 'paused-parser-behind' | 'unavailable';
  /** Unlocked Systems with no entries (M11 coverage()), plus module-emitted gaps with a pseudo systemId (FR-26). */
  notCovered: NotCoveredItem[];
  /** parserBehind per M1 D3(b). */
  versions: { knowledge: string; gameBuild: number | null; parserTarget: string; parserBehind: boolean };
  diagnostics: { failedDetectors: FailedDetector[] };
}
