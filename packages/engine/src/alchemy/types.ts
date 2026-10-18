// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 Alchemy's engine output (docs/specs/M19-alchemy.md TR-5): plain data only, so it survives
// structuredClone across the worker boundary. The lazy Alchemy page chunk only formats it.
import type { CauldronId } from '@idleon-forge/account-state';

export type Band = 'w2' | 'w3' | 'w3-late';

/** FR-4: a plan row's pick, or its shortfall when it got no affordable level. */
export interface BubblePick {
  cauldron: CauldronId;
  rawName: string;
  /** "Roid Ragin". */
  name: string;
  from: number;
  /** The level FR-3 reaches with what is held (from + atLeast), or the band level when blocked. */
  to: number;
  /** Affordable levels (FR-3): a lower bound, since every discount is left out (F-b). */
  atLeast: number;
  /** The band level of this row for the account's band. */
  band: number;
  /** FR-4's shortfall: the first material it ran out of and how many more the next level needs. */
  blocked: null | { rawName: string; name: string; more: number; liquid: boolean };
  actionKey: string | null;
}

export interface ColumnChip {
  rawName: string;
  name: string;
  level: number;
  /** The band level for the account's band; null for a bubble M19 can't band. */
  bandLevel: number | null;
  /** Share of maximum (F-a) in whole percent; null for linear curves (no maximum). */
  pctOfMax: number | null;
  inPlan: boolean;
  unlocked: boolean;
}

export interface PotView {
  cauldron: CauldronId;
  /** The cauldron's own pick (FR-8): its first plan row with a level, else its first blocked one. */
  next: BubblePick | null;
  /** The next three plan rows of this cauldron for the tap sheet (FR-19). */
  rows: BubblePick[];
  /** A plan row of this cauldron that isn't unlocked yet (FR-7). */
  locked: string[];
  /** M6: "about N new bubbles" from banked brew. */
  expectedNewBubbles: number;
  unlockedBubbles: number;
  /** The next bubble an unlock gives, when the cauldron has one. */
  nextUnlock: string | null;
}

export interface VialView {
  index: number;
  name: string;
  level: number;
  /** The roll needed while locked ("60+"); null once unlocked. */
  rollNeeded: number | null;
  lit: boolean;
  rollTarget: boolean;
}

export interface TubeView {
  index: 0 | 1 | 2 | 3;
  name: string;
  current: number;
  max: number;
  open: boolean;
  /** The best Alchemy level that opens it; null for Water. */
  opensAt: number | null;
  actionKey: string | null;
  /** A short note on the tube (the Talent Point waiting on Nitrogen). */
  note: string | null;
}

export interface P2wCell {
  /** M7's P2W key ("liquid.water-drops.regen", "player.speed"). */
  key: string;
  /** "Power", "Water Drops", "Vials", "Player". */
  row: string;
  /** "Speed", "Regen", "Attempts". */
  label: string;
  level: number;
  /** Max level; the best Alchemy level for Player upgrades; null when it isn't known. */
  max: number | null;
  /** Not open in Pay 2 Win yet (level −1, M7 AC-8.2). */
  closed: boolean;
  /** The next upgrade in FR-12's order. */
  next: boolean;
  actionKey: string | null;
}

export interface AlchemyResult {
  band: Band | null;
  pick: BubblePick | null;
  pots: PotView[];
  /** Every W1-W3 bubble of each cauldron, for the tap sheet's "show all". */
  column: Record<CauldronId, ColumnChip[]>;
  vials: VialView[];
  vialPick: null | { name: string; from: number; to: number; actionKey: string | null };
  /** X3: at most three locked vials, easiest roll first. */
  rollTargets: { name: string; rollNeeded: number; item: string }[];
  tubes: TubeView[];
  p2w: P2wCell[];
  planMet: boolean;
  /** "Bubble Plan met for your Stage" and the like, from the entries. */
  notes: { planMet: string; covers: string | null; unlocks: string };
  /** Today's vial attempts. */
  attempts: { current: number; max: number } | null;
  /** FR-23: the account's top Alchemy Next Action of any owner, as one short step. */
  topStep: { key: string; text: string } | null;
}
