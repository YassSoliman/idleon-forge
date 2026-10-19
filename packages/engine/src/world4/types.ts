// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the read-only pages' data (EngineResult.world4), built in the worker from the Account State
// and the facts in facts.ts. Every word is computed here; the UI lays it out. No Goal, Check or Verdict
// comes from it: these pages say what the save says and how the game works, nothing more.

/** One quiet Source line under a page. */
export interface World4Source {
  url: string;
  title: string;
}

/** The frame tone: coral = losing value now, gold = do it, mint = done, sky = a timer. */
export type W4Tone = 'coral' | 'gold' | 'mint' | 'sky' | 'muted';

/** The page's one framed answer: what the save shows first, with how the game works. */
export interface W4Frame {
  title: string;
  why: string;
  /** The big number and its unit ("3", "of 3 eggs"). */
  value: string;
  unit: string;
  tone: W4Tone;
  /** 0..1 for the meter; null draws none. */
  meter: number | null;
  /** A link to another World 4 page ("Breeding: territories"). */
  link: { label: string; system: string } | null;
}

/** A labelled row: a name, a detail and a status word in its tone. */
export interface W4Row {
  key: string;
  n?: number;
  name: string;
  detail: string;
  /** A right-aligned extra column ("138 px", "90 HP"). */
  extra?: string;
  status: string;
  tone: W4Tone;
  /** Drawn quieter (later, not reached). */
  quiet?: boolean;
}

export interface W4Tab {
  id: string;
  label: string;
  badge: string | null;
}

// ---- Laboratory ----

export interface LabBoardNode {
  key: string;
  label: string;
  x: number;
  y: number;
  state: 'lit' | 'next' | 'off';
}
export interface LabBoardJewel {
  key: string;
  x: number;
  y: number;
  owned: boolean;
  lit: boolean;
}
export interface LabBoardCharacter {
  key: string;
  /** "Shaman 76". */
  label: string;
  /** Toolbox class ("Bubonic_Conjuror"): the UI draws its class sprite. */
  cls: string;
  x: number;
  y: number;
  connected: boolean;
}
export interface LabBoard {
  prism: { x: number; y: number };
  /** The beam: prism to the first connected character, then each one to the nearest already connected. */
  links: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  /** Each connected character's reach. */
  reach: number;
  nodes: LabBoardNode[];
  jewels: LabBoardJewel[];
  characters: LabBoardCharacter[];
  /** The board's extent, for the viewBox. */
  left: number;
  top: number;
  width: number;
  height: number;
  summary: string;
  accessibleName: string;
}

export interface LabCharacterRow {
  key: string;
  label: string;
  cls: string;
  note: string;
  labLevel: string;
  now: string;
  tone: W4Tone;
}

export interface LabChipCard {
  key: string;
  title: string;
  badge: string;
  text: string;
  have: number | null;
  need: number | null;
  open: boolean;
}

export interface LabPageView {
  frame: W4Frame;
  tabs: W4Tab[];
  board: LabBoard;
  boardNote: string;
  nodes: W4Row[];
  nodesNote: string;
  characters: LabCharacterRow[];
  charactersLede: string;
  openers: LabChipCard[];
  slotLevels: string[];
  chipsBySlot: Array<{ key: string; label: string; cls: string; slots: Array<string | null>; open: number }>;
  jewelsLine: string;
  jewels: W4Row[];
  shop: { week: string; rows: W4Row[]; note: string } | null;
  source: World4Source;
}

// ---- Cooking ----

export interface KitchenTile {
  key: string;
  n: number;
  state: string;
  tone: W4Tone;
  badge: string;
  /** Speed, Fire, Luck: a level or the spice it costs. */
  upgrades: Array<{ label: string; value: string }>;
  owned: boolean;
  /** The kitchen is cooking right now. */
  lit: boolean;
}

export interface CookingPageView {
  frame: W4Frame;
  tabs: W4Tab[];
  kitchensLede: string;
  kitchens: KitchenTile[];
  buyLine: { title: string; detail: string; later: string } | null;
  nextMeals: Array<{ key: string; n: number; name: string; bonus: string; how: string }>;
  mealsTitle: string;
  meals: Array<{ key: string; name: string; bonus: string; spice: string; time: string; level: string }>;
  mealsTotal: number;
  mealsNote: string;
  growth: Array<{ label: string; value: string }>;
  closest: { name: string; have: number; need: number; text: string } | null;
  spicesLine: string;
  spices: Array<{ key: string; name: string; use: string; held: string; found: boolean }>;
  spicesNote: string;
  ladles: string;
  source: World4Source;
}

// ---- Breeding ----

export interface NestSlot {
  key: string;
  state: 'egg' | 'empty' | 'locked';
  label: string;
}

export interface ArenaWaveView {
  key: string;
  wave: string;
  what: string;
  /** 0..1 along the track. */
  at: number;
  key2: boolean;
  reached: boolean;
}

export interface BreedingPageView {
  frame: W4Frame;
  tabs: W4Tab[];
  nest: NestSlot[];
  nestLine: string;
  nestNote: string;
  loopNote: string;
  territoriesTitle: string;
  territoriesLine: string;
  territories: W4Row[];
  forageNote: string;
  claimsNote: string;
  arenaLine: string;
  arena: { waves: ArenaWaveView[]; best: number; open: boolean; note: string };
  upgradesLine: string;
  upgrades: W4Row[];
  mobsNote: string;
  shinyNote: string;
  source: World4Source;
}

// ---- The World 4 welcome (Now) ----

export interface WelcomeStep {
  key: string;
  n: number;
  title: string;
  why: string;
  progress: string;
  done: boolean;
  /** The step lit now (the first one not done). */
  now: boolean;
  /** Where it is done: a System page id, or the Map. */
  home: { label: string; system: string | null };
}

export interface World4Welcome {
  title: string;
  lede: string;
  badge: string;
  place: string;
  steps: WelcomeStep[];
  doneCount: number;
  source: World4Source[];
}

export interface World4View {
  /** The account has opened World 4 (World 3 finished). */
  reached: boolean;
  /**
   * The World 4 Systems that have a read-only page in this build (`lab`, `cooking`, `breeding`) once
   * World 4 is reached; empty before. The Systems index shows these as "read-only page", not "not covered".
   */
  readOnlyPages: string[];
  /** Null before World 4 or once every step is done. */
  welcome: World4Welcome | null;
  lab: LabPageView | null;
  cooking: CookingPageView | null;
  breeding: BreedingPageView | null;
}
