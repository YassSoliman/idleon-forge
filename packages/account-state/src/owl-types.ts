// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51: Orion the Great Horned Owl's Account State block (`account.owl`). Read in owl.ts only (M1 TR-11).
// Every number is Toolbox's `parseOwl` (parsers/world-1/owl.ts) or the save's `accountOptions[253..264]`.

/** One of Orion's 9 upgrades, in the game's order (Toolbox `owlData`). */
export interface OwlUpgrade {
  /** 0 Feather Generation .. 8 The Great Mega Reset. */
  index: number;
  /** Toolbox name, "Feather_Generation". */
  name: string;
  level: number;
  /** Feathers the next level costs (Toolbox `cost`, every cheapener applied). */
  cost: number;
  /** Feathers made this run that unlock it (owlData `x3`; the game unlocks it once progress is past this). */
  unlockAt: number;
  unlocked: boolean;
}

/** One of the six stats Bonuses of Orion pays, in its cycle order. */
export interface OwlBonus {
  /** "Class XP", "Base DMG", "Total DMG", "Skill XP", "Drop Rate", "All Stats". */
  name: string;
  value: number;
  /** A percent bonus (Class XP), else a flat one (Base DMG, All Stats). */
  percent: boolean;
  /** The stat's base per step (Toolbox `owlStats.base`) and its place in the 6-level cycle (`offset`). */
  base: number;
  offset: number;
}

export interface OwlState {
  /** Feathers held now (`accountOptions[253]`). */
  feathers: number;
  /** Feathers made this run, the upgrades' unlock gauge (`accountOptions[263]`). */
  progress: number;
  /** Feathers a second (Toolbox `featherRate`). */
  featherRate: number;
  /** Megafeathers owned, the Great Mega Reset's level (`accountOptions[262]`). */
  megafeathers: number;
  /** Feather Restarts this Megafeather (`accountOptions[258]`). */
  restarts: number;
  /** Shiny Feathers owned (`accountOptions[264]`). */
  shiny: number;
  /** Bonuses of Orion level (`accountOptions[255]`), the one upgrade that never resets. */
  bonusesLevel: number;
  /** What every Bonuses of Orion step is multiplied by (Megafeathers, plus later-world boosts). */
  bonusMultiplier: number;
  /** The feather multiplier the next Feather Restart sets (Toolbox `restartMulti`). */
  restartMulti: number;
  /** The progress the next locked upgrade needs (Toolbox `nextLvReq`); 0 once all 9 are open. */
  nextUnlockAt: number;
  upgrades: OwlUpgrade[];
  bonuses: OwlBonus[];
}

export interface OwlAccountFields {
  /** Null when the save predates Orion (no `accountOptions[263..264]`), unknown when the section failed. */
  owl?: OwlState | null;
}
