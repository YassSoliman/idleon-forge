// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine output the Now screen consumes (M10 TR-2): the contract M2–M9 produce, assembled by the
// engine core. Plain data only, so it survives `structuredClone` across the worker boundary (TR-6):
// no functions, Maps, class instances or Dates. All times are epoch ms, all durations seconds.
// A change here needs a note on M10's spec and on the producer module's spec.

import type { AlchemyResult } from './alchemy/types';
import type { BubbaResult } from './bubba/types';
import type { Checklist } from './checklist/types';
import type { CardsView } from './collections/cards-view-types';
import type { GearResult } from './gear/types';
import type { CharacterSkills, SkillGrid, SystemPicture } from './slots/types';
import type { SpendPlan } from './spend/types';
import type { StarSignsView } from './starsigns/types';
import type { World4View } from './world4/types';

export type {
  AlchemyResult,
  Band,
  BubblePick,
  ColumnChip,
  P2wCell,
  PotView,
  TubeView,
  VialHolding,
  VialMissing,
  VialTry,
  VialView,
} from './alchemy/types';
export type * from './bubba/types';
export type { Checklist, ChecklistRow, ResetClock, RowBand, RowState } from './checklist/types';
export type {
  CardChip,
  CardSetChip,
  CardSetProgress,
  CardSwap,
  CardsView,
  CharacterCards,
  GrindItem,
  PresetRecommendation,
  PresetRow,
} from './collections/cards-view-types';
export type {
  CharacterGear,
  GearLadderTier,
  GearResult,
  GearSlotState,
  GearSlotView,
  SmithySetCard,
} from './gear/types';
export type {
  CharacterSkills,
  M21Picture,
  PictureElement,
  SkillGrid,
  SkillRow,
  SlotKind,
  SlotPip,
  SlotState,
  StationId,
  SystemPicture,
} from './slots/types';
export type {
  SpendHandoff,
  SpendLine,
  SpendPlan,
  SpendSink,
  SpendStatus,
  SpendStep,
} from './spend/types';
export type { CharacterSigns, NextConstellation, StarSignsView } from './starsigns/types';
export type * from './world4/types';

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
  /** ISO date of the claim (wiki revision, comment date); orders tier 3 Sources newest first (#74). */
  claimDate?: string;
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
/** One character's part of an account-level Goal (#70 A2, A3: "Bowman Lv 60: 2 into Speed, 1 into Capacity"). */
export interface GoalDetail {
  subject: Subject;
  /** Template already filled by the engine. */
  text: string;
}
/** One step of a Walkthrough (M14 FR-22), rendered. */
export interface WalkthroughStepView {
  order: number;
  /** Template already filled by the engine; names a character by class and level only. */
  text: string;
  /** 'now': its inputs are ready; 'after': it waits on the steps in `after`. */
  when: 'now' | 'after' | 'blocked';
  after: number[];
  /** Who does it; null for "any character". */
  subject: Subject | null;
  progress: { held: number; need: number } | null;
  /** Short reason, e.g. why a job goes first on a character (R-Q9a). */
  why: string | null;
  sources: SourceRef[];
  /** M21 FR-M7: the map a farm or gather step happens on (`#map-<n>`); absent when it has none. */
  mapIndex?: number;
}
/** One line of a Requirement Tree as an indented list (M14 FR-23). */
export interface WalkthroughTreeLine {
  depth: number;
  text: string;
  /** true: held or met; false: missing or unmet; null: can't tell. */
  done: boolean | null;
}
/**
 * M14 TR-6, M18 X3: an inline Requirement Tree root a module hands M14 instead of an Acquisition id: a
 * craftable piece with its own materials, the earlier pieces it consumes (nested roots) and its gates.
 */
export interface WalkthroughRoot {
  /** Unique per Goal ("gear:EquipmentShoes20@account"): M14 builds one tree per id. */
  id: string;
  rawName: string;
  name: string;
  /** Copies wanted. */
  need: number;
  /** Copies the receivers already wear, which count as held (M18 FR-15, an exception to M14 FR-6). */
  worn: number;
  tab: number | null;
  smithingLv: number | null;
  /** The recipe unlock (a Task Board unlock, a merit purchase, a drop); null when the recipe is open. */
  gate: { label: string; met: boolean | null } | null;
  /** Per copy. `ref` is the material's generated Acquisition. */
  materials: { rawName: string; amount: number; ref: string }[];
  /** Earlier pieces each copy consumes, per copy. */
  pieces: { amount: number; root: WalkthroughRoot }[];
}

/** M14 TR-6 / M10 TR-2: a Goal's Walkthrough, plain data. */
export interface WalkthroughView {
  /** The target Acquisition, e.g. quests.acquisition.postboy-pablob1. */
  targetId: string;
  /** "Steps 2 of 9 · slowest: Distilled Water". */
  collapsed: string;
  steps: WalkthroughStepView[];
  tree: WalkthroughTreeLine[];
  /** Active Play and not-yet-reachable Supplies (FR-8, US-5); never steps. */
  otherWays: string[];
  /** "may be out of date", "as of its last save: switch to it to claim", "can't tell". */
  caveats: string[];
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
  /** Account Goals only: per-character detail, in the order to act on (#70 A2, A3). */
  details?: GoalDetail[];
  /** M14 FR-23: the Goal's Walkthrough, attached by the engine core from the walkthrough module. */
  walkthrough?: WalkthroughView;
  /** M18 X3: the inline root M14 builds this Goal's Walkthrough from (instead of the entry's target). */
  walkthroughRoot?: WalkthroughRoot;
  /** M17 TR-2: M6's ranking urgency, copied by the core from the module's RankHints; absent otherwise. */
  urgency?: 'losing-now' | 'lost-before-return' | 'banked';
}

/** M17 TR-2: one System of the M11 registry with its unlock state and coverage, built in the worker. */
export interface SystemSummary {
  /** Registry id (M11 SystemId), e.g. "alchemy-bubbles". */
  id: string;
  name: string;
  kind: 'game' | 'activeon';
  /** Registry world; 0 = across worlds. */
  world: number;
  scope: 'character' | 'account' | 'both';
  /** M11 systemUnlocked, worker side. */
  unlocked: 'yes' | 'no' | 'unknown';
  /** What decides `unlocked`: 'world' for worlds/reached rows, 'own' for a System-specific Detector, 'always'. */
  unlockBy: 'world' | 'own' | 'always';
  /** M11 coveredSystems. */
  covered: boolean;
  /** The `systems.fact.unlocks` row (FR-34); null for always-open Systems. */
  unlock: { text: string; world: number; stale: boolean; sources: SourceRef[] } | null;
  /** The System's IdleOn Wiki page, from the unlock fact's Sources; https only. */
  wiki: string | null;
  /** The System's active authored Checks that ran this run (FR-23 Coverage). */
  checks: { entryId: string; title: string; fired: boolean }[];
}

/** M17 TR-2: one Stage Expectation row that is behind (M15 FR-26) and safe to follow (FR-31). */
export interface BehindSystem {
  /** The fix entry's system (entry-id prefix), not the row's display name. */
  systemId: string;
  /** StageExpectation id. */
  rowId: string;
  /** M21 FR-S1: the Stage the row expects the System by (the report card's tick), e.g. "W1-mid". */
  expectedBy?: string;
  fixEntryId: string;
  /** NextAction keys of the fix findings, so skips and dismissals apply (FR-17). */
  findingKeys: string[];
  /** True for the one row M15 FR-27 chose for the Behind Goal this run. */
  chosen: boolean;
}

/** M17 TR-2: a Check that couldn't tell for a reason other than missing history. */
export interface UnknownFinding {
  entryId: string;
  subject: Subject;
  /** M11 UnknownReason, or 'detector-failed'; 'needs-history' is never emitted here. */
  reason: string;
}
/** M17 TR-2: what kind of limit a Timeline bar is; each has its own glyph and word (FR-24). */
export type TimelineKind = 'storage' | 'food' | 'time-cap' | 'production' | 'bank' | 'timer';

/**
 * M17 TR-2, TR-4: one time-bound limit a module already computed, as a Timeline bar. The Timeline never
 * computes a time of its own (D-18): `at` is the producer's, and so are `effect` and `fixHolds`.
 */
export interface TimelineBar {
  /** Unique per bar: `${key}#${slot}` when one entry fires more than once on a subject. */
  barId: string;
  /** `${entryId}@${subject}`: the Next Action or cap pill key it belongs to; keys skips. */
  key: string;
  entryId: string;
  /** Registry id of the entry's System. */
  system: string;
  subject: Subject;
  /** Authored on the entry (`values.timelineKind`). */
  kind: TimelineKind;
  /** The producer's own words ("anvil", "Arcade balls"): the entry's `values.timelineWhat`. */
  what: string;
  /** Epoch ms when it binds; null = a present-state problem (FR-26). */
  at: number | null;
  /** FR-26 "can't tell when"; `at` is then null. */
  untimed: boolean;
  /** M3's role; 'pill' for a cap pill, 'info' for a passing Check's nextAt or an info line. Never recomputed. */
  effect: 'blocker' | 'next-action' | 'pill' | 'info';
  /** M3 FR-7 (c): would the fix hold through the return? false = plain bar, no fix link (FR-25). */
  fixHolds: boolean;
}

/** M4: one Purpose line's short ladder (FR-3): the last reached step, where it is, the next two. */
export interface PurposeLadder {
  /** "kills", "copies", "level". */
  unit: string;
  reached: number | null;
  /** The counter now (projected, FR-9, when `projected`). */
  current: number;
  projected: boolean;
  next: number | null;
  /** Seconds; null for skilling (FR-6) or when there is no ETA. */
  nextEtaSeconds: number | null;
  later: number | null;
  laterEtaSeconds: number | null;
  /** "about 5h on average": card ETAs are means at the base drop chance (M4 red-team note 11). */
  mean: boolean;
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
  /** M4: the rendered line ("Poop kills ~2,995 → 10k for Dirty Money · about 5h"), and a short detail. */
  text?: string;
  detail?: string | null;
  /** M4: the ladder behind the line; absent for a yes/no Goal with no level. */
  ladder?: PurposeLadder | null;
}
/** M4 TR-3 `PurposeStatus`, as the Now screen shows it. */
export type PurposeStatusView =
  | 'serving'
  | 'exhausted'
  | 'none'
  | 'not-covered'
  | 'no-activity'
  | 'cannot-tell';
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
/**
 * A quiet per-character fact that is not a task, e.g. "Anvil full in 6 h" (#74 item 5). Never affects a
 * Verdict, never ranks, has no controls; the Now screen shows it muted under the character.
 */
export interface InfoLine {
  /** Stable across saves: `${entryId}@${subject}`. */
  key: string;
  text: string;
  sources: SourceRef[];
  /**
   * 'cap' (M3 Final rulings R-PILL-1): a quick-collect cap ("Anvil full · collect"), shown as a compact
   * pill on the character's row and in its Focus header. Never a Goal, a blocker or a Verdict input; it
   * can be skipped for today under its key. Omitted: a muted info line.
   */
  kind?: 'line' | 'cap';
  /** A cap pill's short label, "Anvil full · collect". */
  label?: string;
  /** A cap pill's Why, shown when the pill is opened. */
  why?: string;
  /** A cap pill: when the cap is reached (epoch ms); at or before `asOf` means full now. */
  at?: number | null;
}
export interface Done {
  key: string;
  text: string;
  confirmedAt: number;
}
export interface Fill {
  /** What fills, with its owner's class for a character: "Bowman Lv 60's anvil". */
  label: string;
  /** What fills without its owner ("anvil"), so a view that names the character doesn't say it twice. */
  what?: string;
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
  /** M4: ranked, all of them (FR-10); the Now screen shows the top 3 and the rest behind "show more". */
  purpose: PurposeLine[];
  /** M4 FR-8; absent without M4. */
  purposeStatus?: PurposeStatusView;
  /** M4 FR-14: "What is this character for?"'s reason, or "Not covered yet: Cooking". */
  purposeNote?: string | null;
  /** Ranked, uncapped; blockers first. */
  goals: Goal[];
  higherLeverage: HigherLeverage | null;
  /** From M7 SpendPlan.perCharacter: buy and move-coins lines paid by this character (M7 FR-23, D5). */
  spendChip: { lines: number; coins: number } | null;
  activePlay: ActivePlay[];
  /** Quiet info lines from the modules (M3's anvil fill time first); optional until a module emits one. */
  info?: InfoLine[];
  doneThisSession: Done[];
  firstFill: Fill | null;
}

/** One talent the Build cares about, on one preset (owner request 2026-10-18, the Build view). */
export interface BuildTalentRow {
  id: number;
  /** "High Polymer Limbs". */
  label: string;
  current: number;
  /** The Build's target in this save ("max" resolved to the save's max). */
  target: number;
  /** The save's max level right now. */
  max: number;
  met: boolean;
  core: boolean;
  /** "max for now (the build wants 50)", "from World 3, early", or null. */
  note: string | null;
}

export interface BuildTabView {
  tab: number;
  /** "Archer". */
  name: string;
  spent: number;
  /** Lower bound of unspent points (M9 TR-7); null without a second preset to compare. */
  unspent: number | null;
  /** The Build's talents, in its step order. Empty when no Build covers this tab. */
  rows: BuildTalentRow[];
  /** Talents with points the Build doesn't name, most first. */
  others: { label: string; level: number }[];
  /**
   * M21 FR-C2: the points this tab's path can spend now. `lower-bound` (tabs 1–3, M9 TR-7), `exact`
   * (the star tab, FR-C10) or `none`. `overBy` is set only on an over-budget star tab. Declared by
   * Phase F; absent until area C fills it (read it as `{ kind: 'none', points: null, overBy: null }`).
   */
  known?: BuildKnownPoints;
  /** M21 FR-C1: every applicable Build step in spend order, banded. Absent until area C fills it. */
  path?: BuildPathStepView[];
}

/** M21 FR-C2 (TR-8). */
export interface BuildKnownPoints {
  kind: 'lower-bound' | 'exact' | 'none';
  points: number | null;
  overBy: number | null;
  /**
   * An exact class-tab count the save confirms (ADR 0010 `exact-verified`); false for `exact`, whose
   * overcount the answer key can't catch ("from your save's totals"). Absent on bounds and star tabs.
   */
  verified?: boolean;
}

/** M21 TR-8: one row of a tab's Build path (FR-C1). Filled by area C. */
export interface BuildPathStepView {
  key: string;
  talentId: number;
  label: string;
  /** Star pages 1–4; null on tabs 1–3. */
  page: number | null;
  current: number;
  /** min(target or cap, max in this save). */
  goal: number;
  /** 0 when done. */
  need: number;
  /** Points from now through this step; null for done / later. */
  cumulative: number | null;
  band: 'done' | 'now' | 'part' | 'next' | 'later';
  /** 'part': the known points that land in this step. */
  partNow: number | null;
  core: boolean;
  /** 'later': "from World 3, early", "find its book (…)". */
  condition: string | null;
  /** "its max for now", "useful up to 7 (best level 73)". */
  note: string | null;
  /**
   * R11 QA: a later step of a talent an earlier step already raises starts here ("50 → 100"); `current`
   * stays the save's own level (M22 same-fact-everywhere). Absent or null on every other step.
   */
  from?: number | null;
}

export interface BuildNextPoint {
  key: string;
  tab: number;
  /** The talent: "High Polymer Limbs". */
  label: string;
  /** "Put the next 12 points into High Polymer Limbs (to 100)", "then 40 into Veins of the Infernal (to 60 of 120)". */
  text: string;
  points: number;
  /** The talent's id, so the truth checks can match a line without parsing its text (M22). Set by area C. */
  talentId?: number;
  /** The level this line takes the talent to ("(to 100)" -> 100). Set by area C. */
  to?: number;
}

export interface BuildPresetView {
  slot: 0 | 1;
  active: boolean;
  role: 'fighting' | 'skilling' | null;
  /** "Fighting preset", "Skilling preset", "Other preset" (M9 D5: role names, no in-game label). */
  heading: string;
  /** "Archer fighting build", "Empty: set it up for skilling", "Mixed points". */
  roleText: string;
  buildTitle: string | null;
  /** Lower bound over tabs 1-3; null without a second preset. */
  unspent: number | null;
  tabs: BuildTabView[];
  /**
   * M21 FR-C13: the Star Talent tab as one more tab, with its own path (one pool across pages 1–4).
   * Declared by Phase F; null until area C fills it.
   */
  star?: BuildTabView | null;
  /** Attacks on the bar against the Build's; null when the bar can't be read or the role has none. */
  attackBar: { set: string[]; recommended: string[]; missing: string[]; text: string } | null;
  /** The ordered checklist for this preset, by tab (the Build's steps minus current levels). */
  next: BuildNextPoint[];
}

export interface BuildPathStep {
  /** "Beast_Master". */
  class: string;
  /** "Beast Master". */
  label: string;
  state: 'done' | 'now' | 'next' | 'later';
}

/** One character's Build roadmap (the Build view): class path, both presets, next points, coming up. */
export interface BuildRoadmap {
  index: number;
  classLabel: string;
  level: number;
  /** One line for the overview: "at least 118 unspent · next: Book of the Wise". */
  status: string;
  /** Beginner, Archer, Hunter, Beast Master, with where the character is. */
  path: BuildPathStep[];
  /** "Next class: take Hunter at Speccius", or null at the end of the covered path. */
  nextClass: string | null;
  presets: BuildPresetView[];
  /** What opens at the next milestones (class pick, new tab, second preset, stage-gated steps). */
  comingUp: string[];
  /** "No build yet for this class" and the like; null when a Build covers the character. */
  note: string | null;
  /** Quiet note for a Stale or low-confidence Build; null otherwise. */
  quiet: string | null;
  stale: boolean;
  /** The Builds' Sources; the view picks the player-facing ones (#74). */
  sources: SourceRef[];
  /** The Build entry ids shown (provenance). */
  entryIds: string[];
}

/**
 * M21 owner request (2026-10-18, area C): the next character slot, known ahead of time. M2 FR-8/FR-9's
 * next class line with M15 F3's family-level gap and ETA for that slot specifically (not only when it
 * is the nearest family unlock). Filled by the M9 module; null past the last slot gate.
 */
export interface NextCharacterCard {
  slotNumber: number;
  /** The class to pick at level 10 ("Archer"), or "Journeyman". */
  baseClass: string;
  /** The subclass line to take at Speccius ("Hunter"); equals `baseClass` for the Journeyman. */
  line: string;
  slotOpen: boolean;
  /** Family level that opens the slot; null when it is open. */
  opensAt: number | null;
  /** Family levels to go; null when open or unknown. */
  gap: number | null;
  /** M15 F3's pace from the save history: whole days to the gate, or why there is none. */
  eta: { kind: 'days'; days: number } | { kind: 'no-history' } | { kind: 'too-long' } | null;
  /** M2's reason for this class, in words. */
  why: string;
  /** The creation steps, in order (the starting star sign, the class at Lv 10, the subclass). */
  steps: string[];
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
  /** M2: `unknown` (Can't tell banner), `not-covered` (no Stage module or Knowledge Base), or a Stage id.
   *  `needs`: what the next Stage needs (M2 FR-4, D5), one line each. */
  stage: { id: string; label: string; needs?: string[] };
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
  /** M9's Build roadmaps, one per character with talent data (the Build view); absent without M9. */
  builds?: BuildRoadmap[];
  /** M21 owner request (area C): the next character slot card; absent without M9. */
  nextCharacter?: NextCharacterCard | null;
  /**
   * M8 Cards view (owner request 2026-10-18): presets, the owned-card recommendation and the reachable
   * grind list per character, plus the account overview. Absent when M8's cards-view module didn't run or lacks its tables.
   */
  cards?: CardsView | null;
  /** M17 TR-2: every registry System in registry order; absent without a Knowledge Base. */
  systems?: SystemSummary[];
  /** M17 TR-2: every behind Stage Expectation row after M15's filters; absent without M15 F5. */
  behindSystems?: BehindSystem[];
  /** M17 TR-2: Checks that returned `unknown` (not for missing history) or whose Detector failed. */
  unknownFindings?: UnknownFinding[];
  /**
   * M16 Star Signs: the per-character signs (the Signs tab) and the Star Chart summary (points, unlocked
   * signs, the next constellations). Absent when M16 didn't run; null below W1-mid or without its data.
   */
  starSigns?: StarSignsView | null;
  /** M17 TR-2 (Phase 2): every Timeline bar the modules supplied (M3, M6), sorted by subject, at, barId. */
  timeline?: TimelineBar[];
  /** M17 TR-2 (Phase 2): M3 `AfkSafetyResult.returnAt`, when the player is back; absent without M3. */
  returnAt?: number;
  /** M20 F1: the Daily & Weekly Checklist (the Now section with its two rings); absent without M20. */
  checklist?: Checklist | null;
  /** M20 F3: every character's Skills tab, in save order; absent without M20. */
  skills?: CharacterSkills[];
  /** M20 TR-6: the Construction, Worship, Trapping and Alchemy System page pictures. */
  slotPictures?: SystemPicture[];
  /** M20 FR-31: the Skill Grid for the Characters place's `#skills` section. */
  skillGrid?: SkillGrid | null;
  /** M19 TR-5: the Alchemy page (pots, vial shelf, tubes, Pay 2 Win grid); absent without M19. */
  alchemy?: AlchemyResult | null;
  /** M23 TR-5: the Bubba System page's data (null when Bubba is locked). */
  bubba?: BubbaResult | null;
  /** M24: the read-only World 4 pages and welcome (`world4` module); absent without it. */
  world4?: World4View | null;
  /** M18 TR-5: the Gear tab, the Gear page's heat strip and the Smithy page; absent without M18. */
  gear?: GearResult | null;
  /**
   * M21 TR-11: Play Session facts for the pause points and the Away card (area N's `session` module).
   * Phase F registers a stub that emits null.
   */
  session?: SessionFacts | null;
  /** M21 TR-9: the Map place (area M's `map` module). Phase F registers a stub that emits null. */
  map?: MapResult | null;
  /**
   * M21 FR-F4, TR-5: each character's class family, keyed by `CharacterState.index`, from
   * `classes.fact.class-tree`, so the UI draws its who-glyph without importing the Knowledge Base.
   * A character whose class isn't in the tree is absent. Absent without a Knowledge Base.
   */
  classFamilies?: Record<number, ClassFamily>;
}

/** M21 FR-F4: the five who-glyph chibi families (DS-13). */
export type ClassFamily = 'beginner' | 'journeyman' | 'warrior' | 'archer' | 'mage';

/** M21 TR-11: what the save history says about Play Sessions (area N). */
export interface SessionFacts {
  sessionStartedAt: number | null;
  previousSessionEndedAt: number | null;
  /** The last 10 Play Sessions; null with fewer than 3. */
  medianSessionMs: number | null;
  /** Since M9's baseline save. */
  levelGains: { characterIndex: number; from: number; to: number }[];
  /**
   * FR-N3: the grouped-job sentence (a Check entry's authored `groupText`) by entry id, for every entry
   * whose Next Action shows on 2 or more characters. Optional, so a result from before it still reads.
   */
  groupTexts?: Record<string, string>;
}

/** M21 TR-9: one map node of the Map place (area M). */
export interface MapNode {
  mapIndex: number;
  name: string;
  kind: 'fight' | 'skill' | 'town' | 'other';
  doors: { destination: number; requirement: number }[];
}

/** M21 TR-9: the Map place's data (area M). */
export interface MapResult {
  worlds: {
    world: number;
    state: 'done' | 'open' | 'next';
    cleared: number;
    total: number;
    gate: {
      boss: string;
      bossMap: number | null;
      keysHeld: number | null;
      keysPerDay: number | null;
      crystal: { item: string; held: number | null; need: number } | null;
    } | null;
    maps: MapNode[];
  }[];
  frontier: {
    mapIndex: number;
    door: number;
    requirement: number;
    best: { characterIndex: number; killsLeft: number; etaMs: number | null } | null;
  } | null;
  markers: { characterIndex: number; mapIndex: number }[];
  doors: Record<number, { characterIndex: number; door: number; done: number; requirement: number }[]>;
  overlays: {
    route: number[];
    constellations: Record<number, string[]>;
    deathNote: Record<number, { kills: number; nextRank: string | null; nextAt: number | null }>;
    cards: Record<number, { cardId: string; level: number | null; baseChance: number | null }>;
  };
}
