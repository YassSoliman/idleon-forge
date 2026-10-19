// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C engine output (docs/specs/M26-crafting-guidance.md FR-C1, FR-C3 to FR-C12): plain,
// structured-cloneable data built in the worker. Characters are indices; every word is rendered from a
// Knowledge Base entry's `values`, and a gate is a span the UI draws as a link (GateLink), never words.
import type { Subject, WalkthroughView } from '../result';

/** The gate kinds a template can emit (FR-C1a); the gate-homes registry maps each to a page and tab. */
export type GateKind = 'anvil-tab' | 'recipe' | 'smithing';

/**
 * FR-C1: a gate as a link. A met gate is a place ("this recipe is on tab 3"); an unmet one is a task
 * that opens its Walkthrough ("Anvil Tab 4 · 0 of 4 ready").
 */
export interface GateSpan {
  kind: 'gate';
  gate: GateKind;
  /** "Anvil tab 3", "Anvil Tab 4". */
  label: string;
  /** The route the chip opens: `#system-anvil?tab=recipes&focus=EquipmentSword2`. */
  href: string;
  /** The System page, tab and row it opens (the same as `href`, for in-app navigation). */
  system: string;
  tab: string;
  focus: string | null;
  met: boolean | null;
  /** The sprite the chip shows: the tab item or the recipe's item. */
  icon: string;
  /** "open The Ice Breaker's recipe": the accessible name's second half. */
  what: string;
  /** Unmet tabs: how many of the tab's materials are fully held. */
  ready?: number;
  of?: number;
}

/** One hammer of an anvil row: what it makes now and what the plan puts on it. */
export interface HammerPlan {
  /** Product index now (-1: free). */
  from: number;
  to: number;
  /** Items this hammer adds by the return, after the shared room. */
  made: number;
  /** Room left on its product (shared by every hammer on it). */
  room: number;
  /** True when another hammer of this anvil is on the same product (they share one stock). */
  shared: boolean;
}

export type StepTone = 'todo' | 'done' | 'link' | 'display';

/** FR-C8: one speed-up step under a row. */
export interface ProductionStep {
  key: string;
  text: string;
  tone: StepTone;
  /** The sprite: an item rawName, `stamp:StampB3`, `bubble:quicc:2`. */
  icon: string | null;
  /** A route the step links to ("Points", "Stamps"). */
  link: { label: string; href: string } | null;
}

export type RowKind =
  | 'switch'
  | 'keep'
  | 'demand'
  | 'capped'
  | 'free-hammer'
  | 'unknown'
  | 'craft'
  | 'craft-none'
  | 'printer';

/** One producer row on a character (FR-C5, section 8). */
export interface ProductionRow {
  key: string;
  characterIndex: number;
  producer: 'anvil' | 'craft-next' | 'printer';
  kind: RowKind;
  /** "Anvil: switch to Trusty Nails, Boring Brick, Boring Brick". */
  text: string;
  /** The why under it. */
  why: string | null;
  /** The value chip ("about 1.6x the Smithing EXP by your return", "ready", "keep"). */
  chip: { text: string; tone: 'gold' | 'mint' | 'mut' } | null;
  /** The row's main sprite (an item rawName). */
  icon: string | null;
  gate: GateSpan | null;
  hammers: HammerPlan[];
  steps: ProductionStep[];
  /** Quiet one-line keeps and "nothing left" rows. */
  quiet: boolean;
  /** Ranking within the character: Demand rows, then fallback switches, then keeps (section 8). */
  order: number;
  /** The claim key (section 10) so the row and a live Check never both show. */
  claim: string | null;
  /** Extra line: "Also an Iron Fishing Rod, with 2 others: Craft 3 Iron Fishing Rods". */
  also?: { text: string; href: string; label: string } | null;
}

/** FR-C10: a piece 2+ characters want, with every gate met and at least one copy held. */
export interface CraftShared {
  key: string;
  rawName: string;
  name: string;
  /** "Craft 4 Golden Nets (Anvil tab 2)": the line without its gate (the gate is `gate`). */
  text: string;
  /** "Blood Berserker Lv 96, ... need one each; you hold enough for 3 of 4 (Butterfly: 10,109 of 12,550)". */
  detail: string;
  who: number[];
  enough: number;
  gate: GateSpan;
}

/** FR-C3: one recipe on the Recipes tab (compact: its name is the result's `names[rawName]`). */
export interface RecipeView {
  rawName: string;
  /** Position on its tab (1-based, the game's order). */
  n: number;
  /** Smithing level (wiki), null when the table has no row. */
  lv: number | null;
  state: 'crafted' | 'open' | 'locked' | 'unknown';
  /** "Start of the tab", "Quest: ...", "Drops from ...". */
  from: string;
  /** [rawName, need]; names and held amounts are the result's shared `names` and `held`. */
  materials: Array<[string, number]>;
  /** Characters who want it (Gear Plan target), and whose craft next it is; absent when none. */
  wantedBy?: number[];
  craftNext?: number[];
  /** Tab owned, recipe open and Smithing met. */
  craftable?: true;
}

export interface RecipeTabView {
  tab: number;
  status: 'owned' | 'locked' | 'later';
  crafted: number;
  open: number;
  locked: number;
  recipes: RecipeView[];
}

/** FR-C4: the next anvil tab's Walkthrough (page scope only). */
export interface NextTabView {
  tab: number;
  rawName: string;
  /** "Craft Anvil Tab 4: 0 of 4 materials ready". */
  answer: string;
  /** "slowest: can't tell yet (4 steps have no source or time estimate)". */
  bottleneck: string;
  ready: number;
  of: number;
  smithing: { lv: number | null; best: number | null };
  materials: Array<{ rawName: string; name: string; need: number; held: number }>;
  walkthrough: WalkthroughView | null;
}

/** An account lever shown once on `#production` (FR-C8). */
export interface AccountLever {
  key: string;
  text: string;
  tone: StepTone;
  icon: string | null;
  link: { label: string; href: string } | null;
}

/** EngineResult.production: the Production Plan (FR-C5 to FR-C12) and the Anvil page's tabs. */
export interface ProductionResult {
  rows: ProductionRow[];
  shared: CraftShared[];
  anvils: {
    /** "6 of 7 anvils should switch". */
    line: string;
    /** "about 1.8x the Smithing EXP across the account by your return; Maestro Lv 73 keeps". */
    detail: string;
    switching: number;
    total: number;
    ratio: number | null;
  };
  levers: AccountLever[];
  tabs: RecipeTabView[];
  nextTab: NextTabView | null;
  /** The Anvil page's Walkthrough tab: Walkthroughs holding an anvil gate (FR-C1b, FR-C4). */
  walkthroughs: Array<{ title: string; subject: Subject; view: WalkthroughView }>;
  /** The page's answer frame, in the section 8 order. */
  answer: { cap: string; hero: string; sub: string | null } | null;
  /** The keep threshold in use (C-Q1). */
  keepRatio: number;
  /** FR-C1: each anvil tab 1-5 as a gate (met: the Recipes tab; unmet: the Walkthrough), by tab - 1. */
  tabGates: GateSpan[];
  /** Display names of every item a recipe or row names, by rawName (shared, so recipes stay small). */
  names: Record<string, string>;
  /** Pooled holdings (storage, Refinery, Forge, bags) of every recipe material, by rawName. */
  held: Record<string, number>;
}
