// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What an advice module (M2–M9) hands the engine core, and what the core hands it. The core decides
// no advice of its own (M10 §2): every Verdict, Goal and option comes from a module; the core merges,
// ranks (M2's `compareGoals`), dedupes, orders the visit and assembles `EngineResult` (TR-2).
import type { AccountState } from '@idleon-forge/account-state';
import type { CompiledKnowledge, DetectorRegistry } from '@idleon-forge/knowledge';
import type { Rankable, ResolvedPriorityList, VisitHint } from '../metapath/types';
import type {
  ActivePlay,
  BuildRoadmap,
  CharacterResult,
  Done,
  EngineResult,
  Fill,
  Goal,
  GoalDetail,
  HigherLeverage,
  InfoLine,
  NextCharacterCard,
  NotCoveredItem,
  PurposeLine,
  SpendPlan,
  TimelineBar,
  UnknownFinding,
  Verdict,
  WalkthroughView,
} from '../result';

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
 * The Knowledge Base surface the core and its modules need. The worker builds it from M11's
 * `loadKnowledge` and `coverage` over the shipped bundle (M10 FR-26).
 */
export interface KnowledgePort {
  /** `CompiledKnowledge.version.display` (BuildInfo `knowledge` when the bundle didn't load). */
  version: string;
  /** M11 `coverage(state, kb, registries)` mapped to `{ systemId, label }`. */
  coverage(state: AccountState): NotCoveredItem[];
  /** The compiled bundle, for modules that read entries and fact tables. null when it didn't load. */
  kb?: CompiledKnowledge | null;
  /** M17 TR-2: the Detector registries System unlocks are evaluated with (M11 `systemUnlocked`). */
  registries?: readonly DetectorRegistry[];
}

/** M19 TR-1: pure Toolbox functions the worker hands the engine (it runs in the same worker). */
export interface ToolboxPort {
  /** Toolbox `getBubbleUpgradeCost` with no discounts (an upper bound, M19 F-b). */
  bubbleCost(rawName: string, bubbleIndex: number, level: number, baseCost: number): number;
}

export interface EngineInput {
  state: AccountState;
  history: EngineHistory;
  knowledge: KnowledgePort;
  now: number;
  options: { expectedReturnSeconds: number };
  /** M19 TR-1; absent in tests and goldens that don't pass it (M19 then stays silent). */
  toolbox?: ToolboxPort;
}

/** Ranking inputs a module attaches to one of its Goals (M2 TR-14 `Rankable`, minus what a Goal has). */
export type RankHints = Partial<Omit<Rankable, 'entryId' | 'category' | 'stale' | 'contested'>> & {
  /** Rank as if it were this entry (M14 FR-21: an assignment ranks at its parent Goal's position). */
  rankAs?: string;
};

export interface ModuleGoal {
  goal: Goal;
  rank?: RankHints;
  /**
   * The Detector finding's slots behind this Goal (game identifiers and numbers), for engine steps that
   * filter on them: M15 F5's Stage Expectation `when` (e.g. F2's `building` is the 3D Printer). Never shown.
   */
  slots?: Readonly<Record<string, string | number>>;
}

export interface CharacterContribution {
  index: number;
  /** Only the module that composes Verdicts (M3 `composeVerdict`) sets this. */
  verdict?: Verdict;
  goals?: ModuleGoal[];
  purpose?: PurposeLine[];
  /** M4 only. */
  purposeStatus?: CharacterResult['purposeStatus'];
  purposeNote?: string | null;
  higherLeverage?: HigherLeverage | null;
  activePlay?: ActivePlay[];
  doneThisSession?: Done[];
  firstFill?: Fill | null;
  /** Quiet per-character lines (#70 A1, M3). */
  info?: InfoLine[];
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
  /** M14 FR-23: Walkthroughs to attach to the Goal whose Next Action key is `parentKey`, wherever it ranks. */
  walkthroughs?: { parentKey: string; view: WalkthroughView }[];
  /** M9 only: the per-character Build roadmaps (the Build view). */
  builds?: BuildRoadmap[];
  /** M21 owner request (area C): the next character slot card; absent without M9. */
  nextCharacter?: NextCharacterCard | null;
  /** M8 `cards-view` only: the Cards view (EngineResult.cards). */
  cards?: EngineResult['cards'];
  /** M17 TR-2: Checks that couldn't tell (not for missing history), or whose Detector failed. */
  unknownFindings?: UnknownFinding[];
  /** M16 only: the Signs tab and Star Chart view (EngineResult.starSigns). */
  starSigns?: EngineResult['starSigns'];
  /** M17 TR-4: Timeline bars for the caps this module computed (M3, M6). */
  timeline?: TimelineBar[];
  /** M17 TR-2: when the player is back (M3 only). */
  returnAt?: number;
  /** M20 `m20-checklist` only (EngineResult.checklist). */
  checklist?: EngineResult['checklist'];
  /** M20 `m20-slots` only: the Skills tabs, the System page pictures and the Skill Grid. */
  skills?: EngineResult['skills'];
  slotPictures?: EngineResult['slotPictures'];
  skillGrid?: EngineResult['skillGrid'];
  /** M19 only: the Alchemy page's data (EngineResult.alchemy). */
  alchemy?: EngineResult['alchemy'];
  /**
   * M19 X3, X4: details an `after` step adds to another module's Goal, matched by its Next Action key
   * (the Water line's pick, the vial attempts' roll targets). The owner's text is never rewritten.
   */
  goalNotes?: { key: string; details: GoalDetail[] }[];
  /** M23 `bubba` only (EngineResult.bubba). */
  bubba?: EngineResult['bubba'];
  /** M24 `world4` only (EngineResult.world4). */
  world4?: EngineResult['world4'];
  /** M18 `gear` only (EngineResult.gear). */
  gear?: EngineResult['gear'];
  /** M26 `production` only (EngineResult.production). */
  production?: EngineResult['production'];
  /** M21 `session` only (EngineResult.session, TR-11). */
  session?: EngineResult['session'];
  /** M21 `map` only (EngineResult.map, TR-9). */
  map?: EngineResult['map'];
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
  /**
   * M14 TR-1: an engine step that reads other modules' results. It runs after every other module, with
   * the result they assembled as `prior`; its output is merged and ranked with theirs.
   */
  after?: boolean;
  run(input: EngineInput, prior?: EngineResult): ModuleOutput;
}
