// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 Wave 2, the W2/W3 gaps: the Account State blocks the wave adds, one file so its PRs touch only
// their own lines. Read in gaps.ts (and the per-System readers it calls) only (M1 TR-11).

/** M26 FR-21b: one Salt Lick upgrade (Toolbox `account.saltLick[i]`, the game's `SaltLick` array). */
export interface SaltLickUpgrade {
  /** Position in the game's list (0..10); the spec's "#6" is index 5. */
  index: number;
  /** The salt it costs ("Refinery3"). */
  salt: string;
  level: number;
  maxLevel: number;
  /** Shown by the Salt Lick building: index < its level (`TowerInfo[3]`). */
  unlocked: boolean;
  /** The bonus per level (`baseBonus`) and what the level gives now (Toolbox `getSaltLickBonus`). */
  perLevel: number;
  bonus: number;
}

export interface SaltLickState {
  /** The Salt Lick building's level (`TowerInfo[3]`): how many upgrades it shows. */
  buildingLevel: number;
  upgrades: SaltLickUpgrade[];
  /**
   * Game client, not Toolbox (X4): the liquid regen percent the game's `LiquidHRrate` adds for Salt Lick
   * #6 (`SaltLick(5)`, +1% per level on every liquid, Bleach or not). Toolbox models only its capacity half.
   */
  liquidRatePct: number;
}

/** M26 FR-25: an item in or for the Forge. */
export interface ForgeItem {
  rawName: string;
  /** Toolbox's item name ("Copper_Ore"). */
  name: string;
  amount: number;
}

export interface ForgeOre extends ForgeItem {
  /** Ore per bar (items.json `Amount`) and the bar's base smelt seconds (`Cooldown`). */
  perBar: number;
  baseSeconds: number;
}

export interface ForgeBarrel extends ForgeItem {
  /** `SpeedForge` (+power % speed) or `DoubleBarsForge` (power % chance of an extra bar). */
  effect: 'speed' | 'double';
  power: number;
}

export interface ForgeSlot {
  index: number;
  /** Below the New Forge Slot level: the game lets you use it. */
  unlocked: boolean;
  /** A Brimstone slot (Gem Shop): x1.5 speed in Toolbox. */
  brimstone: boolean;
  ore: ForgeOre | null;
  /** Holds at least one bar's worth of ore (a smaller leftover never smelts). */
  smelting: boolean;
  /** Toolbox `timeTillEmpty`, in seconds from the save; 0 when not smelting. */
  emptyInSeconds: number;
  /** Bars waiting in the slot's output. */
  bar: ForgeItem | null;
  barrel: ForgeBarrel | null;
  /** Toolbox slot speed (bars per base cycle, Brimstone and speed barrel included). */
  speed: number;
}

export interface ForgeState {
  /** New Forge Slot level: slots 0 .. n-1 are usable. */
  slotsUnlocked: number;
  slots: ForgeSlot[];
  /** The six upgrades in game order: New Forge Slot, Ore Capacity Boost, Forge Speed, Forge EXP Gain, Bar Bonanza, Puff Puff Go. */
  upgrades: Array<{ name: string; level: number; maxLevel: number }>;
  /** Ore one slot holds (Toolbox `oreCapacity.value`, rounded down). */
  oreCapacity: number;
  /** Ores and barrels held in the Storage Chest and every bag. */
  oresHeld: ForgeOre[];
  barrelsHeld: ForgeBarrel[];
}

/** M26 FR-26: one ranked task on a world's Task Board. */
export interface TaskBoardTask {
  /** 0..7 on its board. */
  index: number;
  /** tasks.json name ("Faceless_Deathmachine"). */
  name: string;
  stat: number;
  /** Tiers claimed (`Tasks[1][w][i]`) and the most there are. */
  level: number;
  maxLevel: number;
  /** The stat the next tier needs; null at max. */
  next: number | null;
  /** Tiers whose goal the stat has reached but that aren't claimed yet. */
  ready: number;
  /** What claiming every ready tier pays. */
  merits: number;
  points: number;
  /** Claiming zeroes the progress (tasks.json filler2 flag), so progress past the goal is lost. */
  resetsOnClaim: boolean;
}

export interface TaskBoardWorld {
  world: 1 | 2 | 3 | 4;
  /** The board is open: Grasslands Gary (W1), Desert_Davey2, Iceland_Irwin1, Nebula_Neddy1. */
  open: boolean;
  tasks: TaskBoardTask[];
  /** The 9th task, the daily. */
  daily: { name: string; done: boolean } | null;
}

export interface TaskBoardState {
  worlds: TaskBoardWorld[];
  /** Task Unlocks: unlock points owned and spent, and the task points toward the next one. */
  unlockPoints: { owned: number; bought: number; progress: number; nextAt: number };
  /** Each world's Merit Shop row text at its level ("All Blunder Hills Monsters respawn +20%"), by row. */
  meritText: string[][];
}

/** Optional so hand-built states need not spell them out; the adapter sets each, to a value or null. */
export interface GapsAccountFields {
  /** M26 FR-21b: the Salt Lick's upgrades and its liquid-rate term. */
  saltLick?: SaltLickState | null;
  /** M26 FR-25: the Forge's slots, upgrades and what it can be fed. */
  forge?: ForgeState | null;
  /** M26 FR-26: the Task Board of Worlds 1-4. */
  taskBoard?: TaskBoardState | null;
}
