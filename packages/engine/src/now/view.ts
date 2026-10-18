// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen view model (M10 TR-3): everything the components render, already ordered, capped
// and worded. Components render arrays in order and never sort or filter (red-team #5).
import type {
  BuildRoadmap,
  CardsView,
  Category,
  CharacterCards,
  Done,
  Provenance,
  SpendStatus,
  Subject,
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
  activity: string;
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
  /** "Spend here: 3 buys, ~1.2M → Spend Plan" (FR-4, M7 D5). */
  spendChip: string | null;
  /** US-1: number, name, class, level, activity, map, Verdict and summary. */
  accessibleName: string;
}

export interface UnknownView {
  reason: 'no-purpose' | 'cannot-tell' | 'not-covered';
  /** "What is this character for?", "Can't tell from the save", "AFK safety isn't covered yet". */
  text: string;
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
  activity: string;
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
  purpose: { goalId: string; text: string; stopHere: boolean; badges: string[]; source: SourceView | null }[];
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
  text: string;
  /** "Lv 12 → 15", or null. */
  levels: string | null;
  /** "1.2M coins", or "cost not checked, see the price in game". */
  cost: string;
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
export interface BuildRoadmapView extends Omit<BuildRoadmap, 'sources'> {
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
  /** Every character's Build view, in save order (owner request 2026-10-18); empty without M9. */
  builds: BuildRoadmapView[];
  /** The Cards tab and overview (M8, owner request 2026-10-18); null without M8's cards-view module. */
  cards: CardsNowView | null;
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
