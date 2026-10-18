// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba (docs/specs/M23-bubba.md TR-2): the Account State fields M23's Checks, engine module and page
// read. Toolbox's parsed `account.bubba` plus a few raw indices of the save's `Bubba` record, and the
// derived values of ADR 0010's extension (`bubba-x1.ts`). Numbers only: upgrade names, the Megaflesh texts
// and the gift names are game data in the `bubba.fact.*` tables. Read in bubba.ts only (M1 TR-11).

/** The seven Bubba Boon bonuses in rotation order: Build Rate, Critter Gain, Soul Gain, Total Damage, All Kills, Class EXP, Atom Cost. */
export type BubbaBonuses = [number, number, number, number, number, number, number];
/** The six Charisma Chart attributes: Hustle, Rizz, Joy, Courage, Mindful, Savvy. */
export type CharismaLevels = [number, number, number, number, number, number];

export interface BubbaCharisma {
  /** Raw Bubba[3]: each attribute's level this run (all reset at every Megaflesh). */
  levels: CharismaLevels;
  /** Raw Bubba[0][6]: the attribute being trained, 1..6; 0 when none is. */
  selected: number;
  /** Raw Bubba[0][15]: the emulsified attribute, 1..6; 0 when none is. */
  emulsified: number;
  /** Raw Bubba[0][8]: the XP banked at the save. */
  xp: number;
  /** The XP with the pending seconds Bubba[0][7] folded in at `xpPerSec`, as the next window tick does (X1). */
  xpFolded: number | null;
  /** ADR 0010 X1: how many levels the banked XP buys at the save, uncapped. */
  levelsBanked: number | null;
  /** X1 `CharismaTraitREQ`: XP for the next level of any attribute. */
  xpReq: number | null;
  /** X1 `CharismaTraitSPD`: XP per second. */
  xpPerSec: number | null;
  /** X1: an attribute's max level (120 at this patch). */
  maxLevel: number | null;
  /** X1 `CharismaBonus` of each attribute now, in the game's own unit. */
  bonus: number[] | null;
  /** The same at one more level. */
  bonusNext: number[] | null;
}

export interface BubbaState {
  /** Toolbox `meatSlices`: meat held at the save. */
  meat: number;
  /** Toolbox `meatsliceRate`: meat per minute at the save's happiness. */
  ratePerMin: number;
  /** X1 `meatsliceRateBase`: meat per minute at happiness 0, what away time earns (M23 F-b). */
  rateBase: number | null;
  /** Raw Bubba[0][1]. */
  happiness: number;
  /** Toolbox `progress`: meat made this run (opens upgrade types). */
  produced: number;
  /** Toolbox `progressReq`: meat made this run that opens the next upgrade type. */
  nextTypeAt: number;
  /** Toolbox `totalUpgTypesAvailable` (1..28): upgrades with index below it are open. */
  types: number;
  /** 28, Toolbox `upgrades[i].level`. */
  levels: number[];
  /** 28, Toolbox `upgrades[i].prestige`: free levels that don't raise the cost. */
  prestige: number[];
  /** 28, Toolbox `upgrades[i].cost`, the next level's price; null when not finite (never affordable). */
  costs: (number | null)[];
  /** Toolbox `megafleshOwned`. */
  megaflesh: number;
  /** Toolbox `bonuses[key].bonus`, the account bonuses in rotation order. */
  bonuses: BubbaBonuses;
  smoker: {
    /** Toolbox `smokerUnlocked`. */
    unlocked: boolean;
    /** Toolbox `smokerSeconds`: smoke time at the save, pending seconds included. */
    seconds: number;
  };
  pats: {
    /** Raw Bubba[0][5]: pats used since the last refill (negative with Megaflesh 8's head start). */
    used: number;
    /** Raw Bubba[0][13]: seconds since the last refill (it refills at 3600). */
    timer: number;
    /** X1 `DailyPetting`: pats each refill gives. */
    perHour: number | null;
  };
  charisma: BubbaCharisma;
  /** X1: what the next Bubba Boon level adds, at the current Megaflesh multiplier. */
  boonNextDelta: number | null;
  /** X1: 1 + Bubba_RoG_all / 100. */
  megafleshMultiplier: number | null;
  /** X1: Bargain, Cost Saver, Perma Sale, the factor every cost falls by with one more level. */
  discountNextRatio: [number, number, number] | null;
  /** Raw Bubba[0][2], [0][3]: the picked gifts, 1-based into `bubba.fact.gifts`; 0 when none. */
  gifts: [number, number];
  /** Raw Bubba[4]: the dice rolled, one value per die slot (0 = no die). */
  dice: number[];
  /**
   * Toolbox's `UpgCost` of the next levels, from its own Bubba parse on a copy of the record with that
   * upgrade a level higher each time (as X1 does): Bubba Boon's next BUBBA_BOON_AHEAD prices and Fun Gifts'
   * up to its cap. M23 FR-7 spends a Megaflesh's leftover on them. Null without the worker Toolbox calls.
   */
  ahead: { boonCosts: (number | null)[]; funGiftsCosts: (number | null)[] } | null;
}

export interface BubbaAccountFields {
  /** M23 TR-2; null when the save has no Bubba record or Toolbox's `bubba` section failed. */
  bubba?: BubbaState | null;
}
