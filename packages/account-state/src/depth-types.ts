// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 Account depth (docs/specs/M15-account-depth.md TR-2): the Account State fields its Refinery set-up
// (F1, M6), "build this next" (F2, M6) and Talent Book Library (F4, M9) features read. Kept in one
// block so other modules' additions don't collide with them. Read in depth.ts only (M1 TR-11). Every
// field is null when the save, the parser section or the worker's Toolbox call behind it is missing.
//
// Holdings are not repeated here: chest storage is M8's `account.storageItems`, the Refinery's own 8
// storage slots are `account.refineryStorage`, bags are `characters[].inventoryItems`.

/** One salt of the Refinery, in Refinery order (M15 TR-2; M6 owns the shared `account.salts` list). */
export interface RefinerySalt {
  /** "Refinery1" … "Refinery9". */
  rawName: string;
  /** The salt item's name, "Redox_Salts". */
  name: string;
  unlocked: boolean;
  active: boolean;
  rank: number;
  /** Current power in the bar (Toolbox `refined`). */
  power: number;
  /** Toolbox `powerCap` (game PowerCAP at this rank): a manual Refine at `power >= powerCap` ranks up. */
  powerCap: number;
  /** `autoRefinePercentage > 0`: the auto pass empties the bar into salt and never ranks up (M15 V1). */
  autoRefine: boolean;
  /**
   * Toolbox `getSaltsBalance(...).saltMaxSafeRank`: the highest rank the predecessor salt can still
   * fuel (no printer cap, M15 red-team #1). Null when the call failed.
   */
  saltMaxSafeRank: number | null;
  /**
   * Seconds until the bar is full from its current power, from Toolbox `calcTimeToRankUp` (squire
   * cycles left out); 0 when full. Null for a locked salt or when the call failed.
   */
  fullInSeconds: number | null;
}

export interface RefineryState {
  salts: RefinerySalt[];
}

/** One Construction building (M15 TR-2). */
export interface ConstructionBuilding {
  /** The save's building index (`TowerInfo[index]`), 0 = 3D Printer. */
  index: number;
  /** Toolbox towers key, "3D_Printer". */
  rawName: string;
  level: number;
  maxLevel: number;
  /** Build progress toward the next level (`TowerInfo[66 + index]`). */
  progress: number;
  /** Toolbox `getBuildCost` at this level (game TowerBuildReq). */
  buildCost: number;
  /** The building sits in a build slot (`TowerInfo[54..61]`). */
  inSlot: boolean;
  /** The salt its levels are paid in (`towers[].itemReq[0].rawName`), "Refinery1". */
  saltRawName: string;
  /**
   * The next level is built and its payment is due: the bar is full (`progress >= buildCost`) or the
   * build is already claimed (`TowerInfo[27 + index] == level + 1`, Toolbox `nextLevel`). The payment
   * is made in the Build menu from inventory and the storage chest (N.js @8779435), never from the
   * Refinery's storage.
   */
  bodyFull: boolean;
}

export interface ConstructionState {
  /** Toolbox `account.construction.totalBuildRate`, build progress per hour across every slot. */
  totalBuildRate: number;
  /**
   * The open build slots in order, each the building index it holds (`TowerInfo[54 + i]`) or null when
   * empty. The open count is the game's `TowerBuildSlots`: 2 + gem shop row 117 + ceil(W3 merit row 0 / 2)
   * (N.js @7815643, game 2.3.540).
   */
  buildSlots: Array<number | null>;
  buildings: ConstructionBuilding[];
}

/** A Talent Book Library page, from the book item: TalentBook2 Beginner … TalentBook5 Mage (items.json Class). */
export type BookPage = 'Beginner' | 'Warrior' | 'Archer' | 'Mage';

export interface HeldBook {
  page: BookPage;
  /** The talent's skill index (the book's `Speed`; the tooltip reads SkillLevelsMAX[Speed], N.js @7015346). */
  talentId: number;
  /** The max level it sets (the book's `Reach`). */
  level: number;
  place: 'storage' | `inv:c${number}`;
}

export interface LibraryState {
  /** Toolbox `libraryTimes.bookCount`: checkouts stored, including the time since the save (frozen `now`). */
  checkouts: number;
  /** `Lab[16][3] == 1`: the Book Reservation System is on, so a checkout needs 20 and spends 20 (N.js @8875709). */
  reservationOn: boolean;
  /** The Talent Book Library building's level (`towers.data[Talent_Book_Library].level`). */
  libraryLevel: number;
  /** Toolbox `libraryTimes.next`: seconds to the next checkout. */
  nextInSeconds: number;
  /** Toolbox `getBookLvRange`: every checkout rolls a level in this range. */
  bookLv: { min: number; max: number };
  /** Talent book items held in the storage chest and the bags (TalentBook2..5). */
  heldBooks: HeldBook[];
}

/**
 * Optional so states built by hand need not spell them out; the adapter always sets each one, to a
 * value or null. Detectors treat undefined like null (unknown).
 */
export interface DepthAccountFields {
  refinery?: RefineryState | null;
  construction?: ConstructionState | null;
  library?: LibraryState | null;
}
