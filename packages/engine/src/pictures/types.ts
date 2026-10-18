// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-10, FR-S4: the payloads of the four new System page pictures (Stamps, Statues, Upgrade Vault,
// 3D Printer). Phase F declared each kind once in `slots/types.ts` (`M21Picture`) with a minimal shape
// (`elements` with one `lit`); these widen it, and each is assignable to its `M21Picture` variant, so the
// pictures ride on `EngineResult.slotPictures` beside M20's. Plain data only (structuredClone): no
// character names (M4 TR-9, the UI joins them), only game names, numbers and view-word keys.
import type { PictureElement } from '../slots/types';

/** M8's acquisition status of one stamp, `owned` included. */
export type StampStatus = 'owned' | 'now' | 'active' | 'toward' | 'later' | 'unknown';
export type StampTab = 'combat' | 'skills' | 'misc';
/** How an unowned stamp is got (M8's best route kind). */
export type StampRoute = 'held' | 'shop' | 'quest' | 'buyThenQuest' | 'drop' | 'craft' | 'other';

export interface StampTile extends PictureElement {
  rawName: string;
  /** "Sword Stamp" (underscores already turned into spaces). */
  name: string;
  tab: StampTab;
  level: number;
  /** The level cap (0 for a stamp not collected yet). */
  cap: number;
  status: StampStatus;
  /** M8's best route for an unowned stamp; null when owned or no route is known. */
  route: StampRoute | null;
  /** Coins for the next level below the cap (M7's `nextCoinCost`); null at cap or unknown. */
  nextCoins: number | null;
  /** In M7's plan as a cap raise. */
  raiseInPlan: boolean;
}

export interface StampsPicture {
  systemId: 'stamps';
  kind: 'stamps';
  elements: StampTile[];
  /** The element id of the one lit stamp (M8's first stamp to get), or null. */
  lit: string | null;
  owned: number;
  total: number;
  tabs: { tab: StampTab; owned: number; total: number }[];
  /** FR-S4's "next three" ribbon: element ids, the lit one first. */
  next: string[];
}

export interface StatueTile extends PictureElement {
  index: number;
  /** "Power Statue". */
  name: string;
  level: number;
  /** Raw `StuG`: 0 none, 1 Gold, 2 Onyx, 3 Zenith. */
  grade: number;
  /** Per character, in `AccountState.characters` order (V-4); null without the split. */
  byCharacter: number[] | null;
  /** Character indices matching `byCharacter`. */
  characterIndices: number[];
  /** M7's statue Gold line: its coins, or null when M7 has no price ("Price not checked"). */
  goldCoins: number | null;
  /** In M7's Spend Plan as a Gold buy. */
  goldInPlan: boolean;
}

export interface StatuesPicture {
  systemId: 'statues';
  kind: 'statues';
  elements: StatueTile[];
  lit: string | null;
  gold: number;
  onyx: number;
}

export interface VaultFloorRow extends PictureElement {
  index: number;
  /** "Sleepy Time". */
  name: string;
  level: number;
  maxLevel: number;
  /** The total Vault levels that open this row (the generated `unlockLevel`). */
  unlockAt: number;
  open: boolean;
  /** Coins for the next level; null when maxed or locked. */
  nextCoins: number | null;
}

export interface VaultPicture {
  systemId: 'upgrade-vault';
  kind: 'vault';
  elements: VaultFloorRow[];
  lit: string | null;
  totalLevels: number;
  /** The next unlock gap ("33 levels to open Special Talent"); null when every row is open. */
  nextUnlock: { levels: number; name: string } | null;
}

export interface PrinterSlotView extends PictureElement {
  characterIndex: number;
  /** The sample printing now ("Forest Fibres"), or null for an empty slot. */
  item: string | null;
  perHour: number | null;
  /** M14's one change for this character: the new item; null for "no change". */
  changeTo: string | null;
  /** M14's change line ("Take a Megalodon Tooth sample on …"), or null. */
  changeText: string | null;
}

export interface PrinterPicture {
  systemId: 'printer';
  kind: 'printer';
  elements: PrinterSlotView[];
  lit: string | null;
  level: number;
  activeSlots: number;
}

export type NewPicture = StampsPicture | StatuesPicture | VaultPicture | PrinterPicture;
