// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen view model (M10 TR-3): everything the components render, already ordered, capped
// and worded. Components render arrays in order and never sort or filter (red-team #5).
import type { Category, Done, Provenance, SpendStatus, Subject, VerdictKind } from '../result';

export interface SourceView {
  /** "wiki · 2.3.540", plus " · Stale" when Stale (FR-18, FR-19). */
  text: string;
  /** The https URL, or null when the URL isn't https (rendered as plain text, TR-13). */
  href: string | null;
  stale: boolean;
  /** Every Source after the first, for the "+n" list in Focus. */
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
}

export interface PillView {
  /** Colour key: the effective kind (a fully skipped Fix shows as Ready). */
  kind: VerdictKind;
  /** "Ready", "Fix before you leave", "Unknown", "Ready · 2 skipped", "Unknown · skipped". */
  text: string;
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
  /** "7 of 11 in your Visit Order · 10 left". */
  position: string;
  /** "you are on this character", "Next up", or null. */
  playing: string | null;
  /** "Left <name> ✓ 2 done · Ready", with the index to go back to. */
  left: { index: number; text: string } | null;
  pill: PillView;
  blockers: GoalView[];
  skippedBlockers: number;
  unknown: UnknownView | null;
  purpose: { goalId: string; text: string; stopHere: boolean; badges: string[]; source: SourceView | null }[];
  goals: GoalView[];
  hiddenCount: number;
  skippedCount: number;
  /** Not for me, until the next patch: "Hidden until next patch (n) · undo". */
  dismissed: { key: string; text: string }[];
  higherLeverage: HigherLeverageView | null;
  /** "comparisons paused: …" or "comparisons unavailable" in place of the line (FR-21). */
  higherLeverageNote: string | null;
  activePlay: ActivePlayView[];
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
  /** "4 buys now on 2 characters", or the empty state. */
  summary: string;
  /** "can't price Statue Gold right now" per unavailable sink. */
  unavailable: string[];
}

export interface Banner {
  kind: 'update' | 'patch' | 'stage-unknown' | 'offline' | 'all-set';
  text: string;
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
}
