// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen view model (M10 TR-3): everything the components render, already ordered, capped
// and worded. Components render arrays in order and never sort or filter (red-team #5).
import type {
  BuildRoadmap,
  CardsView,
  Category,
  CharacterCards,
  CharacterSkills,
  ChecklistRow,
  ClassFamily,
  Done,
  Provenance,
  SkillGrid,
  SkillRow,
  SlotPip,
  SpendStatus,
  StarSignsView,
  Subject,
  SystemSummary,
  TimelineBar,
  VerdictKind,
  WalkthroughView,
} from '../result';

export interface SourceView {
  /**
   * The best player-facing Source's title, e.g. "IdleOn Wiki: Smithing" (#74): the wiki first, then the
   * newest dated guide or thread, then anything else. With none, the Toolbox website page the number comes
   * from ("IdleOn Toolbox: Anvil"). Null when neither exists; never a GitHub file.
   */
  text: string | null;
  /** The https URL of that Source, or null (rendered as plain text, TR-13). */
  href: string | null;
  /** When that Source was last checked ("2026-10-18"); null for the Toolbox page fallback (M21 why sheet). */
  verifiedOn: string | null;
  /** "Calculated by IdleOn Toolbox · 2.3.540" when a tier 1 Source backs the entry. */
  credit: string | null;
  /** The Toolbox website page for the credit (idleontoolbox.com), never its code; null when the main link
   *  already is that page, or Toolbox has no page for the System. */
  creditHref: string | null;
  stale: boolean;
  /** Every other player-facing Source, for the "+n" list in Focus. */
  more: { text: string; href: string | null; tier: number; verifiedOn: string }[];
}

export interface ControlsView {
  skip: boolean;
  notForMe: boolean;
  report: boolean;
}

export interface NextActionView {
  key: string;
  entryId: string;
  /** "Spend · Talents". */
  tag: string;
  text: string;
  why: string;
  source: SourceView;
  stale: boolean;
  contested: null | { sides: { text: string; sources: SourceView[] }[] };
  controls: ControlsView;
  provenance: Provenance;
}

export interface GoalView {
  id: string;
  title: string;
  system: string;
  category: Category;
  blocker: boolean;
  action: NextActionView;
  /** "13k Poop kills · next 100k · about 40h", or null. */
  milestone: string | null;
  /** Account Goals: one line per character, in the order to act on (Goal.details, #70 A2, A3). */
  details: { key: string; text: string }[];
  /** M14 FR-23: the Goal's Walkthrough (steps, Requirement Tree, other ways), or null. */
  walkthrough: WalkthroughView | null;
}

export interface PillView {
  /** Colour key: the effective kind (a fully skipped Fix shows as Ready). */
  kind: VerdictKind;
  /** "Ready", "Fix before you leave", "Unknown", "Ready · 2 skipped", "Unknown · skipped". */
  text: string;
}

/**
 * A quick-collect cap as a compact pill (M3 Final rulings R-PILL-1): "Anvil full · collect". Not a
 * Goal and not a Verdict input. Opening it shows the full text (with the refill time), the Why and the
 * Source, with Skip today and Report this.
 */
export interface CapPillView {
  /** `${entryId}@c<index>`; Skip today keys on it. */
  key: string;
  entryId: string;
  /** "Anvil full · collect". */
  label: string;
  /** "Collect Thread from the anvil (time to cap: now; it refills in 2 h after you collect)". */
  text: string;
  why: string;
  source: SourceView | null;
  fullNow: boolean;
}

export interface RosterRow {
  index: number;
  /** 1-based Visit Order number. */
  position: number;
  name: string;
  classLabel: string;
  level: number;
  /** "Mining Copper"; null when the AFK Target is unknown (an unknown token is hidden, never printed). */
  activity: string | null;
  map: string | null;
  /** "● playing" (FR-4): the caller decides (live mode, save under the auto-open threshold). */
  playing: boolean;
  /** The character Focus moved to after a switch save, not yet confirmed (FR-14 ruling). */
  nextUp: boolean;
  pill: PillView;
  /** R-PILL-1: at most 3 cap pills, before the summary; the rest counted in `moreCaps` ("+n"). */
  caps: CapPillView[];
  moreCaps: number;
  summary: string;
  /** M4 FR-11: the Purpose headline ("Poop kills ~2,995 → 10k for Dirty Money · about 5h"); null without one. */
  purpose: string | null;
  /** "Spend here: 3 buys, about 1.2M coins → Spend Plan" (FR-4, M7 D5). */
  spendChip: string | null;
  /** US-1: number, name, class, level, activity, map, Verdict and summary. */
  accessibleName: string;
}

export interface UnknownView {
  reason: 'no-purpose' | 'cannot-tell' | 'not-covered';
  /** "What is this character for?", "Can't tell from the save", "AFK safety isn't covered yet". */
  text: string;
  /** M4 FR-14: the reason under "What is this character for?" ("Slime card is complete; …"). */
  note: string | null;
  /** For no-purpose: the single suggestion (FR-11). */
  suggestion: NextActionView | null;
  /** D7: only a cannot-tell Unknown can be skipped. */
  skipKey: string | null;
  skipped: boolean;
}

export interface HigherLeverageView {
  key: string;
  kind: 'move' | 'handoff' | 'role-fit';
  text: string;
  why: string;
  source: SourceView;
  stale: boolean;
  partner: { index: number; name: string } | null;
  decidedBy: string;
  alsoConsidered: { text: string; reason: string }[];
  controls: ControlsView;
}

export interface StripItem {
  index: number;
  /** "3 · <name>". */
  label: string;
  /** "<name>, Fix before you leave". */
  accessibleName: string;
  kind: VerdictKind;
  current: boolean;
}

export interface FocusCard {
  index: number;
  name: string;
  classLabel: string;
  level: number;
  /** "Mining Copper"; null when the AFK Target is unknown (an unknown token is hidden, never printed). */
  activity: string | null;
  map: string | null;
  strip: StripItem[];
  /** "7 of 11 in your Visit Order · 4 left" (counted after this position), or "11 of 11 … · last one". */
  position: string;
  /** "you are on this character", "Next up", or null. */
  playing: string | null;
  /** "Left <name> ✓ 2 done · Ready", with the index to go back to. */
  left: { index: number; text: string } | null;
  pill: PillView;
  /** R-PILL-1: every cap pill not skipped today, in the header. Skipped ones are in `skippedKeys`. */
  caps: CapPillView[];
  blockers: GoalView[];
  skippedBlockers: number;
  unknown: UnknownView | null;
  /**
   * M4 (Design Lab `now.focus-purpose`, "Quest line" plus a short ladder): ranked; the first is the
   * row headline, the first 3 show, the rest go behind "show more" (`more`, FR-11).
   */
  purpose: PurposeItemView[];
  /** M4 FR-8: the Purpose status ("serving", "exhausted", ...); null without M4. */
  purposeStatus: string | null;
  goals: GoalView[];
  hiddenCount: number;
  skippedCount: number;
  /** Every skipped key here (blockers, Goals, a skipped Unknown is separate), for undo. */
  skippedKeys: string[];
  /** Not for me, until the next patch: "Hidden until next patch (n) · undo". */
  dismissed: { key: string; text: string }[];
  higherLeverage: HigherLeverageView | null;
  /** "comparisons paused: …" or "comparisons unavailable" in place of the line (FR-21). */
  higherLeverageNote: string | null;
  activePlay: ActivePlayView[];
  /** Muted info lines under the character, in module order (#74 item 5). */
  info: { key: string; text: string; source: SourceView | null }[];
  done: DoneView[];
  next: { index: number | null; text: string };
}

/** One step of a Purpose line's ladder: done (where it is), next and the one after. */
export interface LadderStepView {
  state: 'done' | 'next' | 'later';
  /** "19 kills", "15k kills", "Lv 55". */
  label: string;
  /** "now", "about 14h", "about 63h on average"; empty when unknown (hidden). */
  note: string;
}

export interface PurposeItemView {
  goalId: string;
  text: string;
  /** "banked: the Death Note building is Lv 0". */
  detail: string | null;
  worthwhile: boolean;
  stopHere: boolean;
  badges: string[];
  source: SourceView | null;
  /** The headline's progress bar: current of next; null for yes/no Goals. */
  bar: { current: number; next: number } | null;
  /** Only on the headline: done / next / later. */
  ladder: LadderStepView[];
  /** Behind "show more" (FR-11: the top 3 show). */
  more: boolean;
  /**
   * Only on the headline: it says what the card's first Goal already says (the portal push), so the UI
   * shows the Goal once and keeps only the bar and the ladder here.
   */
  echoesGoal?: boolean;
}

export interface ActivePlayView {
  key: string;
  text: string;
  /** "about 1h of hands-on play". */
  estimate: string;
  who: string | null;
  subject: Subject;
  source: SourceView | null;
}

export interface DoneView extends Done {
  /** "14:02". */
  time: string;
}

export interface SpendLineView {
  id: string;
  key: string;
  /** The short step ("Buy 2 Vault upgrades on Squire Lv 43: 1.3B coins"). */
  text: string;
  /** The rest, shown small under it: a group's names, "carry 25 Jungle Logs on Wizard Lv 73"; or null. */
  detail: string | null;
  /** "Lv 12 → 15", or null. */
  levels: string | null;
  /** "1.2M coins"; null when the cost is not checked (the status pill says so; unknown tokens are hidden). */
  cost: string | null;
  /** "<name> (Squire lv43)", or null. */
  payer: string | null;
  status: SpendStatus;
  /** "buy", "withdraw 2M from storage on <name>, then buy", "save for: 3M short", ... */
  statusText: string;
  /** Running total for this line's paying wallet only (M7 D1): "total 3.4M on <name>". */
  runningTotal: string | null;
  /** FR-14: "totals below assume you skip the unchecked items", under the first unpriced line. */
  note: string | null;
  source: SourceView | null;
  stale: boolean;
  contested: boolean;
}

export interface SpendPlanView {
  goal: GoalView | null;
  lines: SpendLineView[];
  hiddenCount: number;
  skippedCount: number;
  skippedKeys: string[];
  /** "4 buys now on 2 characters", or the empty state. */
  summary: string;
  /** "can't price Statue Gold right now" per unavailable sink. */
  unavailable: string[];
}

export interface Banner {
  kind: 'update' | 'patch' | 'stage-unknown' | 'offline' | 'all-set';
  text: string;
}

/** The Build view of one character (owner request 2026-10-18): its roadmap, name and best Source. */
export interface BuildRoadmapView extends Omit<BuildRoadmap, 'sources' | 'presets'> {
  /** Each preset with its own Build's best Source (M26: a fighting preset never shows the skilling one). */
  presets: (Omit<BuildRoadmap['presets'][number], 'sources'> & { source?: SourceView | null })[];
  name: string;
  /** `#build-<index>`, the Build tab's deep link. */
  href: string;
  /** The Builds' Sources, player-facing first (#74); null without any. */
  source: SourceView | null;
}

export interface NowView {
  progress: {
    ready: number;
    fix: number;
    unknown: number;
    total: number;
    segments: { index: number; kind: VerdictKind; label: string }[];
    label: string;
    /** §6: hidden while every character is Unknown `not-covered`. */
    hidden: boolean;
  };
  allSet: null | { text: string; detail: string | null; skipped: number; covered: boolean };
  roster: RosterRow[];
  focus: FocusCard | null;
  account: {
    blockers: GoalView[];
    skippedBlockers: number;
    /** M3 FR-8: account safety unknown, skippable as `unknown@account` (D7). */
    safetyUnknown: null | { skipKey: string; skipped: boolean; text: string };
    goals: GoalView[];
    hiddenCount: number;
    skippedCount: number;
    skippedKeys: string[];
    dismissed: { key: string; text: string }[];
    spendPlan: SpendPlanView | null;
    done: DoneView[];
  };
  activePlay: ActivePlayView[];
  notCovered: string[];
  banners: Banner[];
  expectedReturn: { chips: { seconds: number; label: string; pressed: boolean }[] };
  footer: { app: string; knowledge: string; game: string; parserTarget: string; failedChecks: number };
  /** Next Actions that weren't in `prefs.seenKeys` (FR-34); 0 when it is null. */
  newCount: number;
  /** Every visible Next Action key, for the caller's next `seenKeys`. */
  visibleKeys: string[];
  /** The earliest time a skip can expire or the session can end (TR-3 step 6). */
  nextExpiry: number | null;
  /**
   * Whole minutes since the last cloud save at `now`, for "as of your last save (12m ago)" on the Build
   * path (M21 Integration, area C's request); null when the save time isn't known.
   */
  saveAgeMinutes: number | null;
  /** Every character's Build view, in save order (owner request 2026-10-18); empty without M9. */
  builds: BuildRoadmapView[];
  /** The Cards tab and overview (M8, owner request 2026-10-18); null without M8's cards-view module. */
  cards: CardsNowView | null;
  /** M16: the Signs tab and the Star Chart section; null below W1-mid or without M16. */
  starSigns: StarSignsNowView | null;
  /** M20 F1: the Daily & Weekly Checklist section with its two rings; null without M20. */
  checklist: ChecklistView | null;
  /** M20 F3: every character's Skills tab, in save order; empty without M20. */
  skills: SkillsTabView[];
  /** M20 FR-31: the Skill Grid (the Characters place's `#skills` section); null without M20. */
  skillGrid: SkillGridView | null;
  /** M18 TR-5: the Gear tab, heat strip and Smithy cards, passed through as the worker built them. */
  gear: import('../gear/types').GearResult | null;
  /**
   * M21 FR-F4: each character's who-glyph family by `CharacterState.index` (EngineResult.classFamilies).
   * `buildNowView` always sets it (empty without a Knowledge Base); optional only so hand-built views
   * in tests needn't. A character missing here draws the beginner chibi.
   */
  families?: Record<number, ClassFamily>;
}

// ---- M20 Skills, Parallel Slots and the Daily & Weekly Checklist (TR-5) ----

/** One checklist row, worded (FR-12, FR-13): never colour alone, a glyph and a word for its state. */
export interface ChecklistRowView {
  id: string;
  band: ChecklistRow['band'];
  state: ChecklistRow['state'];
  /** "To do", "Waiting", "Done", "Can't", "Can't tell". */
  stateWord: string;
  /** Shown beside the word, never alone. */
  glyph: string;
  label: string;
  details: string[];
  /** "resets in 12h 36m", "your weekly reset in 1d 12h", "new boss Thursday 00:00 UTC, in 4d 16h". */
  clockText: string | null;
  /** "from 14:00, in 3h 12m" for a waiting row. */
  availableText: string | null;
  /** "2m". */
  effort: string;
  lostBeforeReturn: boolean;
  /** "done at 14:20" (FR-14); null in paste mode. */
  doneAt: string | null;
  /** FR-15: the Done tick (the preference key) and the save's own progress. */
  manual: null | { key: string; ticked: boolean; hint: string };
  /** FR-8: the Next Action that already carries this row. */
  link: ChecklistRow['link'];
  /** The row's own one-line instruction when nothing links. */
  nextAction: string | null;
  /** The row's System, for "See it" when it has no link. */
  systemId: string;
  /** This row has a Timeline bar (Killroy skulls, the next Random Event): "See it: Timeline". */
  timeline: boolean;
  source: SourceView | null;
}

export interface ChecklistBandView {
  band: ChecklistRow['band'];
  /** "No bank: lost at the reset", "Banks up to 3 days", "Weekly". */
  title: string;
  /** Todo, then waiting, then cannot and can't tell. */
  rows: ChecklistRowView[];
  /** Done rows, folded into "N done · show". */
  done: ChecklistRowView[];
  /** "Opens later" lines for this band. */
  later: string[];
}

export interface ChecklistView {
  rings: { today: { done: number; total: number }; week: { done: number; total: number } };
  /** "Today 1 of 11 · Week 2 of 5": the rings' text equivalent. */
  ringText: string;
  /** "daily reset in 12h 36m", or "can't tell when your daily reset is". */
  dailyText: string;
  /** FR-6: why the week ring can refill mid-week. */
  weekWhy: string;
  expanded: boolean;
  bands: ChecklistBandView[];
}

export interface SkillRowView extends SkillRow {
  /** "Mining". */
  name: string;
  /** "Decent cogs at Construction 15 (4 levels)", or null. */
  gateText: string | null;
  /** "your best" when this character holds the account's best, else "best 23". */
  bestText: string | null;
  /** "Role", "Role from W3", or null. */
  roleText: string | null;
}

export interface SkillsTabView {
  index: number;
  name: string;
  classLabel: string;
  level: number;
  /** `#skills-<index>`. */
  href: string;
  train: CharacterSkills['train'];
  rows: SkillRowView[];
  slots: SlotPip[];
  /** The tab's one status line on the Characters tile (M17 FR-13). */
  status: string;
}

export interface SkillGridView extends SkillGrid {
  /** Character names and classes for the rows, in save order. */
  who: { index: number; name: string; classLabel: string; level: number }[];
  names: Record<SkillGrid['skills'][number], string>;
}

/** M16's view with the player-facing Source picked (#74). */
export interface StarSignsNowView extends StarSignsView {
  source: SourceView | null;
}

/** One character's Cards tab: M8's view with its name, class, level and deep link. */
export interface CharacterCardsView extends CharacterCards {
  name: string;
  classLabel: string;
  level: number;
  /** `#cards-<index>`, the Cards tab's deep link. */
  href: string;
}

export interface CardsNowView {
  characters: CharacterCardsView[];
  account: CardsView['account'];
  caveats: string[];
  /** The wiki Cards page first, with the Toolbox credit (#74); null without any. */
  source: SourceView | null;
}

// ---- M17 Views: the Systems hub and System pages (TR-5) ----

export type TileStatus = 'locked' | 'wasting' | 'behind' | 'cant-tell' | 'not-covered' | 'ok';

/**
 * One piece of view text with where it came from (TR-9): a module's own text, a registry or fact-table
 * fact, a character's name, a time, a count, or a fixed word from `view-words.ts`.
 */
export interface Segment {
  text: string;
  origin: 'module' | 'fact' | 'name' | 'time' | 'view-word' | 'count';
}

export interface TileView {
  id: string;
  name: string;
  world: number;
  status: TileStatus;
  /** "Locked", "Wasting", "Behind", "Can't tell", "Not covered yet", "Nothing to fix". */
  statusWord: Segment;
  /** FR-18: counts and view words only (and, for a locked System, how it opens). */
  reason: Segment[];
  counts: { toDo: number | null; toFix: number; skipped: number; pillsFull: number };
  /** A locked System with a behind row (FR-17). */
  alsoBehind: boolean;
  /** TR-13: "<System>, <status word>, <reason>". */
  accessibleName: string;
}

export interface SystemsView {
  /** FR-21: wasting tiles, then behind ones (a locked-and-behind System among them), in world-then-registry order. */
  needsYou: { id: string; name: string; status: 'wasting' | 'behind' | 'locked' }[];
  groups: { world: number; heading: string; tiles: TileView[] }[];
  /** FR-20: registry worlds past the highest reached world + 1, folded. */
  later: { label: string; tiles: TileView[] } | null;
  /** FR-20: "Worlds 5–7: not covered yet" for an account past World 4; null otherwise. */
  beyond: string | null;
  /** FR-21: M10's `notCovered` items that aren't whole Systems. */
  otherGaps: string[];
  /** FR-5: the navigation badge (cap pills never count, R-PILL-1). */
  wastingCount: number;
}

/** A Goal on a System page with who it is for (FR-23): a character's name, class and level, or "Account". */
export interface SystemPageGoal extends GoalView {
  who: string;
  subject: Subject;
}

export interface SystemPageView {
  tile: TileView;
  /** Every Goal of this System, engine order: characters in the frozen Visit Order, then the account. */
  goals: SystemPageGoal[];
  /** Keys skipped or dismissed here, for "n skipped · undo" and "Hidden until next patch". */
  skippedKeys: string[];
  dismissed: { key: string; text: string }[];
  /** The System's cap pills per character (R-PILL-1), as the Roster shows them. */
  pills: { subject: Subject; index: number; who: string; label: string; key: string; fullNow: boolean }[];
  /** Spend Plan lines with a step in this System (FR-23 item 5), read-only. */
  spendLines: { lineId: string; text: string }[];
  unlock: (Omit<NonNullable<SystemSummary['unlock']>, 'sources'> & { source: SourceView | null }) | null;
  /** FR-19: a locked System's own Next Actions, shown under "How it opens". */
  locked: boolean;
  /** "Open from the start" for an always-open System. */
  alwaysOpen: boolean;
  coverage: { covered: boolean; checks: { title: string; state: 'nothing-to-do' | 'see-above' }[] };
  /** FR-23a: the Character page tab that is this System's home, e.g. 'build'. */
  tabHome: string | null;
  /** The System's IdleOn Wiki page (https only). */
  wiki: string | null;
  /** The Next Action key to outline (FR-31). */
  highlight: string | null;
  /** FR-23: Stage unknown shows blockers only. */
  stageUnknown: boolean;
}

// ---- M17 Views: the Timeline (TR-6) ----

/** Where a bar's fix is shown (FR-27): a character's Now tab, the Account section, or a cap pill. */
export interface TimelineFix {
  subject: Subject;
  /** The Next Action key to scroll to and outline (the Behind Goal's, for a finding moved into it). */
  key: string;
  where: 'focus' | 'account' | 'pill';
  /** What to unfold first: M10's "show more", or the Behind Goal's details. */
  expand: 'show-more' | 'behind-details' | null;
}

export interface TimelineBarView {
  barId: string;
  key: string;
  entryId: string;
  system: string;
  kind: TimelineBar['kind'];
  /** The producer's words ("anvil"). */
  what: string;
  /** "full", "runs out", "stops", "caps", "lost", "ready" (view-words KIND_WORDS). */
  kindWord: string;
  /** A cap pill's own label ("Anvil full · collect"), else `${what} ${kindWord}`, or `what` for a present-state problem. */
  label: string;
  at: number | null;
  untimed: boolean;
  fullNow: boolean;
  /** Binds past the axis end: drawn to the edge with "later" (FR-29). */
  later: boolean;
  beforeReturn: boolean;
  outlined: boolean;
  /** FR-25: after an outlined bar ends, the rest of its row up to the return is hatched. */
  hatched: boolean;
  effect: TimelineBar['effect'];
  state: 'open' | 'skipped' | 'dismissed';
  /** "in 3h 10m · 01:20", "now", "later · in 50h 10m · 04:00", "can't tell when". */
  timeText: string;
  /** "before you're back", "skipped", "hidden until next patch", or null. */
  flag: string | null;
  /** FR-25 (c): the producer's own text for a limit whose fix doesn't hold, shown muted; null otherwise. */
  note: string | null;
  /** US-10's sentence for screen readers. */
  a11y: string;
  fix: TimelineFix | null;
  /** Position on the axis, 0 (now) to 1 (axis end); null for an untimed bar. */
  x: number | null;
  /** Where the hatching ends (the return marker), 0 to 1; null when not hatched. */
  hatchTo: number | null;
  /** "the same on n more" (Design Lab: no repeated sentence per character). */
  /** `more[].name` is the character's class + level label ("Bowman 60"), never its name. */
  group: { first: boolean; more: { index: number; name: string; key: string }[] } | null;
}

export interface TimelineLane {
  id: Subject | `account:${string}`;
  kind: 'character' | 'account';
  /** CharacterState.index, or null for an account lane. */
  index: number | null;
  /** Registry System id of an account lane. */
  systemId: string | null;
  /** The Roster's Visit Order number (1-based); null for an account lane. */
  position: number | null;
  /** "1 · Bowman 60" (class + level, never a name), or the System's name. */
  heading: string;
  /** "Fighting · Sand Giant" (what it does, where); null for an account lane or when unknown. */
  detail: string | null;
  /** The board's short label beside the bars, "1 · Bowman 60" or the System's name (never a name). */
  short: string;
  verdict: PillView | null;
  /** Present-state problems first, then by time. */
  bars: TimelineBarView[];
  /** FR-26: "<what> · can't tell when", once per what. */
  untimed: TimelineBarView[];
}

export interface TimelineView {
  axis: {
    start: number;
    end: number;
    returnAt: number;
    /** 0 to 1. */
    backX: number;
    /** "Back in 8h 00m · 02:20". */
    backLabel: string;
    ticks: { at: number; x: number; label: string }[];
  };
  /** Character lanes in the Roster's frozen Visit Order (D-17). */
  lanes: TimelineLane[];
  /** Account lanes, one per System with account bars, in registry order. */
  accountLanes: TimelineLane[];
  /** §6: account safety `unknown` reads "Can't tell from the save" on the account band. */
  accountNote: string | null;
  /** §6 "Save older than the Expected Return": the save's age first, and the past as one grey band. */
  stale: { text: string; band: string } | null;
  /** M10's "Nothing fills up before you're back" when nothing is outlined. */
  empty: string | null;
  /** The earliest future `at`, so the caller re-renders when a bar turns full now (TR-6 step 5). */
  nextExpiry: number | null;
}

// ---- M21 shared types, declared once by Phase F (spec §9) ----

export type { ClassFamily } from '../result';

/**
 * M21 FR-C7: one tab's health for the Characters health matrix and the Roster tab chip (G4). `word`
 * always carries a unit ("at least 215 points", "45 levels behind", "1 of 4 slots", "ok"). Severity
 * order: fix, behind, empty, unknown, ok. Filled per tab by area C (Gear in `gear/`).
 */
export interface TabHealth {
  level: 'fix' | 'behind' | 'empty' | 'ok' | 'unknown';
  word: string;
  /** M24: the count the character page's tab badge shows (points, slots, cards); absent when none. */
  count?: number;
}

/** M21 FR-N6: the three pause points. */
export type PauseTab = 'login' | 'rounds' | 'logoff';

/** M21 TR-11: what the pause-point view reads from the UI thread (the follow state, the chips). */
export interface SessionUi {
  /** Characters opened this Play Session (the follow state's visited set). */
  visited: readonly number[];
  /** The Expected Return chips were changed this Play Session. */
  returnChangedThisSession: boolean;
  /** A manual pause-point pick; it holds for the Play Session (D-8). */
  manualTab: PauseTab | null;
}

/**
 * M21 FR-N6, FR-N7: the pause point and its lists (area N, `now/session-view.ts`). Minimal in Phase F;
 * area N widens it.
 */
export interface SessionView {
  tab: PauseTab;
  /** "Picked Log in: you were away 9h". */
  why: string;
  manual: boolean;
}

/** M21 FR-M1 to FR-M4: the Map place's view (area M, `map/view.ts`). */
export interface MapView {
  worlds: { world: number; heading: string; state: 'done' | 'open' | 'next' }[];
}

/** M21 FR-T3: the Parallel Slots grid (area T, `now/slots-view.ts`). Minimal in Phase F. */
export interface SlotsView {
  rows: { index: number; cells: { kind: string; filled: boolean; now: boolean }[] }[];
}

/** M21 FR-T5: the compact AFK strip on Now (area T builds it, Integration places it). Minimal in F. */
export interface AfkStripView {
  marks: { index: number; at: number; beforeReturn: boolean }[];
  /** "3 limits bind before you're back: the anvil on Bowman 60 first, in 3h 40m". */
  sentence: string;
}
