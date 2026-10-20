// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 3 System pages (Prayers, Shrines): read-only facts the pages draw, straight from
// Toolbox's parse (`account.prayers`, `account.shrines`). No Detector reads them. Read in w23.ts only.

/** One prayer (Toolbox `account.prayers[]`, from website-data `prayers` and the save's `PrayOwned`). */
export interface PrayerInfo {
  /** The prayer's index in the game's list (Toolbox `prayerIndex`). */
  index: number;
  /** "Big_Brain_Time". */
  name: string;
  /** The bonus with `{` for its number ("+{%_Class_EXP"). */
  effect: string;
  /** The curse with `{` for its number. */
  curse: string;
  /** The bonus and curse numbers at level 1 (`x1`, `x2`). */
  x1: number;
  x2: number;
  /** 0 until unlocked. */
  level: number;
  maxLevel: number;
  /** The Worship totem that unlocks it ("Goblin Gorefest") and the wave. */
  unlockZone: string;
  unlockWave: number;
}

/** One shrine (Toolbox `account.shrines[]`, the save's `Shrine`). */
export interface ShrineInfo {
  /** 0..8, the shrine's place in the game's list (its Construction building is 18 + index). */
  index: number;
  /** "Woodular_Shrine". */
  name: string;
  /** "Boosts_Total_Damage_of_players_on_this_map_by_+{%." */
  desc: string;
  /** The map the shrine stands on (`Shrine[i][0]`). */
  mapId: number;
  /** The shrine's own level (`Shrine[i][3]`), 0 before it is placed. */
  level: number;
  /** The bonus at level 1 and per level after (website-data `shrines`). */
  baseBonus: number;
  bonusPerLevel: number;
}

/**
 * Optional so states built by hand need not spell them out; the adapter always sets each one, to a
 * value or null.
 */
export interface W23AccountFields {
  prayers?: PrayerInfo[] | null;
  shrines?: ShrineInfo[] | null;
  /**
   * M26 FR-8: Equinox is open. Authored reader, provenance "game client, not Toolbox": Toolbox's
   * `equinox.unlocked` is true whenever the save has `Dream` and `WeeklyBoss`, so it reads every W3
   * save as open. True when the Equinox Mirror (Quest78) is in the chest or a bag, or any Dream
   * Upgrade has a level (`Dream[2 + i] > 0`); null when `Dream` can't be read.
   */
  equinoxUnlocked?: boolean | null;
}
