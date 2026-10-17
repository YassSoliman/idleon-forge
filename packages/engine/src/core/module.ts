// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What an advice module (M2–M9) hands the engine core, and what the core hands it. The core decides
// no advice of its own (M10 §2): every Verdict, Goal and option comes from a module; the core merges,
// ranks (M2's `compareGoals`), dedupes, orders the visit and assembles `EngineResult` (TR-2).
import type { AccountState } from '@idleon-forge/account-state';
import type {
  ActivePlay,
  Done,
  EngineResult,
  Fill,
  Goal,
  HigherLeverage,
  NotCoveredItem,
  PurposeLine,
  SpendPlan,
  Verdict,
} from '../result';
import type { Rankable, ResolvedPriorityList, VisitHint } from './stubs/compare-goals';

/** One save of M1's history as the engine sees it (M1 `HistoryEntry`), oldest first. */
export interface EngineHistoryEntry {
  lastCloudSave: number;
  receivedAt: number;
  state: AccountState;
}

/** What the caller knows from M1's save history (M1 TR-14, TR-15). */
export interface EngineHistory {
  entries: readonly EngineHistoryEntry[];
  /** M1 `SaveHistory.sessionStart`: the first save of the current Play Session; null in paste mode. */
  sessionStartedAt: number | null;
  /** M1 `learnedExpectedReturn` in seconds; null without enough history. */
  learnedExpectedReturnSeconds: number | null;
}

/**
 * The Knowledge Base surface the core needs. It mirrors M11's runtime names (`CompiledKnowledge`'s
 * version and `coverage()`), kept structural so the core doesn't depend on `@idleon-forge/knowledge`
 * before M11 merges. After M11 merges, the worker builds it from `loadKnowledge` and `coverage`.
 */
export interface KnowledgePort {
  /** `CompiledKnowledge.version.display` (or BuildInfo `knowledge` until the bundle ships). */
  version: string;
  /** M11 `coverage(state, kb, registries)` mapped to `{ systemId, label }`. */
  coverage(state: AccountState): NotCoveredItem[];
}

export interface EngineInput {
  state: AccountState;
  history: EngineHistory;
  knowledge: KnowledgePort;
  now: number;
  options: { expectedReturnSeconds: number };
}

/** Ranking inputs a module attaches to one of its Goals (M2 TR-14 `Rankable`, minus what a Goal has). */
export type RankHints = Partial<Omit<Rankable, 'entryId' | 'category' | 'stale' | 'contested'>>;

export interface ModuleGoal {
  goal: Goal;
  rank?: RankHints;
}

export interface CharacterContribution {
  index: number;
  /** Only the module that composes Verdicts (M3 `composeVerdict`) sets this. */
  verdict?: Verdict;
  goals?: ModuleGoal[];
  purpose?: PurposeLine[];
  higherLeverage?: HigherLeverage | null;
  activePlay?: ActivePlay[];
  doneThisSession?: Done[];
  firstFill?: Fill | null;
  /** M6 `spendCount` (FR-28): feeds Visit Order. */
  spendCount?: number;
}

export interface ModuleOutput {
  characters?: CharacterContribution[];
  account?: {
    goals?: ModuleGoal[];
    /** Account stockpile blockers (M3 D3, M10 D9). */
    blockerKeys?: string[];
    safety?: EngineResult['account']['safety'];
    spendPlan?: SpendPlan | null;
    activePlay?: ActivePlay[];
    doneThisSession?: Done[];
  };
  notCovered?: NotCoveredItem[];
  /** M2 only. */
  stage?: EngineResult['stage'];
  /** M2 only: the resolved Stage list `compareGoals` ranks against. */
  priorityList?: ResolvedPriorityList;
  /** M2 only. */
  visitHints?: VisitHint[];
  /** M3 FR-11. */
  alreadyFull?: number;
  /** M5 only. */
  higherLeverageStatus?: EngineResult['higherLeverageStatus'];
  firstFill?: Fill | null;
}

/** An advice module, registered with the core. */
export interface EngineModule {
  /** `afk-safety`, `meta-path`, ... Used as the Detector id prefix in diagnostics. */
  id: string;
  /**
   * The core questions this module answers. `afk-safety` (M3) turns the "AFK safety isn't covered
   * yet" wording off (FR-25, R1); `verdict` marks the one module that composes Verdicts.
   */
  covers: readonly ('afk-safety' | 'verdict' | 'stage')[];
  /** True for M3's Verdicts, firstFill, alreadyFull and M6 urgencies: re-run on an Expected Return change (TR-6). */
  dependsOnExpectedReturn: boolean;
  /**
   * When this module throws, does it take a blocker Check with it (M11 FR-13 `affectsVerdict`)? Then
   * every character turns Unknown `cannot-tell` (FR-39); otherwise only its own lines drop.
   */
  affectsVerdict: boolean;
  run(input: EngineInput): ModuleOutput;
}
