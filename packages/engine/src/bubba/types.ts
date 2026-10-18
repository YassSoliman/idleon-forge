// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 TR-5: what the `bubba` engine module hands the Bubba System page (`EngineResult.bubba`), built in
// the worker. The page only lays it out: every word is here already (text.ts, the entries' templates), and
// every time is an epoch ms the page turns into "in 12h 52m" against its own clock (DS-6).

export type BoonKey =
  | 'buildRate'
  | 'critterGain'
  | 'soulGain'
  | 'totalDamage'
  | 'allKills'
  | 'expMulti'
  | 'atomCost';
export type BoonRating = 'high' | 'mid' | 'low';

export interface BubbaBonusView {
  key: BoonKey;
  name: string;
  /** "+24% Build Rate", "+1.2 base critters per trap", "−3.6% Atom Cost" (FR-22, F-f). */
  text: string;
  stacks: number;
  rating: BoonRating;
  /** The next Boon level adds a stack here (F-f rotation). */
  next: boolean;
}

export interface BubbaBoonNext {
  level: number;
  key: BoonKey;
  name: string;
  /** "+1.2% All Kills" (X1 `boonNextDelta`); null without X1. */
  add: string | null;
  /** "1.33T meat"; null past the float range. */
  cost: string | null;
  /** Epoch ms when the projected meat covers it; null with no production or out of reach. */
  at: number | null;
  /** Affordable at the projected meat now. */
  affordable: boolean;
}

export interface BubbaMegafleshView {
  owned: number;
  /** Rows 1..11, owned or not. */
  rows: { row: number; name: string; owned: boolean }[];
  /** Chromatic Megaflesh owned (row 12 stacks once per Megaflesh past 11). */
  chromatic: number;
  next: {
    row: number;
    name: string;
    /** Our short label, "account bonuses 1.40x". */
    label: string;
    /** The game's own text. */
    text: string;
    cost: string | null;
    /** Projected meat and the cost, for the Meter. */
    have: number | null;
    need: number | null;
    /** "90B of 245B". */
    progress: string | null;
    at: number | null;
    affordable: boolean;
  } | null;
  /** "1.2x" (X1 megafleshMultiplier); null without it. */
  multiplier: string | null;
}

export interface BubbaBuyView {
  index: number;
  name: string;
  cost: string;
  tier: number;
}

export interface BubbaCharismaAttrView {
  id: number;
  name: string;
  level: number;
  max: number | null;
  /** "Rizz 0 → 1: −2.06% Costs" (FR-13); null without X1. */
  next: string | null;
  /** The bonus now in the game's label, "13.36x"; null without X1. */
  now: string | null;
  training: boolean;
  atMax: boolean;
  emulsified: boolean;
}

export interface BubbaTargetView {
  source: string;
  /** "gameslikefinder (2026-05-27)". */
  label: string;
  /** From which Megaflesh the row applies. */
  from: number;
  /** One per attribute: the target and the gap to it (0 when met); null for no target. */
  gaps: ({ target: number; gap: number } | null)[];
}

export interface BubbaCharismaView {
  attrs: BubbaCharismaAttrView[];
  /** Epoch ms of the selected attribute's next level; null when nothing levels. */
  nextLevelAt: number | null;
  /** Levels the banked XP buys at `now` (uncapped); null without X1. */
  banked: number | null;
  allMax: boolean;
  /** FR-15: from Megaflesh 6, nothing emulsified. */
  emulsifyOpen: boolean;
  /** FR-14a: from Megaflesh 6, Mindful's level and max. */
  mindfulFirst: { level: number; max: number | null } | null;
  /** FR-14: the community targets that apply this run (Contested), muted on the page. */
  targets: BubbaTargetView[];
}

export interface BubbaResult {
  /** 'unknown': Bubba is open but its record can't be read (FR-21, FR-24). */
  state: 'ok' | 'not-started' | 'unknown';
  /** The Goal's Next Action, when Bubba has one (FR-23 item 1). */
  step: { key: string; entryId: string; text: string } | null;
  /** FR-23 item 1 with no step: the next Timeline time ("Megaflesh 4", at). */
  nextEvent: { label: string; at: number } | null;
  /** Meat per minute away time earns (F-b), and meat at `now`. */
  ratePerMin: string | null;
  projected: string | null;
  bonuses: BubbaBonusView[];
  boonNext: BubbaBoonNext | null;
  megaflesh: BubbaMegafleshView;
  run: {
    /** "More Dice opens at 2.98T meat made this run"; null when all 28 are open. */
    nextType: string | null;
    /** FR-16's run order, open upgrades only (the page folds it to 3). */
    nextBuys: BubbaBuyView[];
  };
  pats: { left: number | null; perHour: number | null; refillAt: number | null } | null;
  smoker: {
    /** Smoke time at `now`, and the cap, both seconds. */
    seconds: number;
    max: number;
    atMax: boolean;
    heldForSlabcakes: boolean;
    /** Epoch ms of max quality; null when already there. */
    maxAt: number | null;
    /** "needs 120B more meat" when at max but not affordable. */
    needs: string | null;
  } | null;
  charisma: BubbaCharismaView | null;
  /** The picked gifts' names. */
  gifts: string[];
  /** The dice rolled (page only, Phase 1). */
  dice: number[];
  /** FR-6: some characters lack the door; log in on one that has it. */
  loginNote: boolean;
  /** FR-6: the character that opens Bubba ("Squire Lv 85"), when not every character can. */
  openOn: string | null;
  /** Locked parts: "Opens at Smoker" per part id (pats, smoker, charisma, gifts, dice). */
  locked: Record<string, string>;
}
