// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4 (docs/specs/M24-ux-rework.md, Scope: World 4): the Account State fields the read-only
// Laboratory, Cooking and Breeding pages and the World 4 welcome read. Kept in one block so other
// modules' additions don't collide with them. Read in world4.ts only (M1 TR-11). Every field is null
// when the save or the Toolbox parser section behind it is missing; no advice is drawn from them yet
// (World 4 Detectors need their own spec).
//
// Character names never enter this block: characters are keyed by their save slot (`index`).

/** One character's place in the Lab (Toolbox `account.lab`, `characters[].skillsInfo.laboratory`). */
export interface LabCharacter {
  /** The character's save slot. */
  index: number;
  /** Laboratory skill level. */
  labLevel: number;
  /** The character is in a Lab tube: its AFK target is the Laboratory (or the Arctis major divinity puts it there, Toolbox `isInTube`). */
  uploaded: boolean;
  /** Toolbox `connectedPlayers`: its beam reaches the prism through other uploaded characters. */
  connected: boolean;
  /** Board position (Toolbox `playersCords`), the game's own coordinates. */
  x: number;
  y: number;
  /** Toolbox `playersCords[].lineWidth`: the beam reach in board pixels; 0 when not uploaded. */
  lineWidth: number;
  /** The chip in each of the 7 chip slots (Toolbox chip name, "Grounded_Processor"), null when empty. */
  chips: Array<string | null>;
}

/** A Mainframe bonus node or a jewel spot on the Lab board. */
export interface LabNode {
  /** Toolbox `index` (Mainframe bonus 0 = Animal Farm; jewel 0 = Amethyst Rhinestone). */
  index: number;
  /** Toolbox name, "Animal_Farm". */
  name: string;
  x: number;
  y: number;
  /** Lit: a connected character reaches it (Toolbox `active`). */
  lit: boolean;
}

export interface LabJewel extends LabNode {
  /** Bought from the Jewel Spinner (Toolbox `acquired`). */
  owned: boolean;
}

/** One thing the Lab shop sells this week: a chip or a jewel, with what it costs. */
export interface LabShopItem {
  /** Toolbox name, "Grounded_Processor". */
  name: string;
  kind: 'chip' | 'jewel';
  /** Toolbox `requirements`: item names ("Pocket_Sand", meals, spices) and amounts. */
  cost: Array<{ name: string; amount: number }>;
}

/** One week of the Lab shop, the same for every player (Toolbox `getChipsAndJewels`). */
export interface LabShopWeek {
  /** The week's start, epoch ms (Thursday 00:00 UTC). */
  weekStart: number;
  /** Two chips, then a jewel. */
  items: LabShopItem[];
}

export interface LabState {
  characters: LabCharacter[];
  /** The Mainframe bonus nodes, in Toolbox order. */
  bonuses: LabNode[];
  jewels: LabJewel[];
  /** `accountOptions[91] >= 1`: the Chip Repository is open (3 Pile of Processor Chips held once). */
  repositoryOpen: boolean;
  /** `accountOptions[91] >= 2`: the Jewel Spinner is open (7 Strung Jewels held once). */
  spinnerOpen: boolean;
  /** Toolbox `totalRawChips`: chips owned, in the repository and slotted. */
  chipsOwned: number;
  /** The shop in the save's week; null when the Toolbox call is missing or failed. */
  shop: LabShopWeek | null;
}

export type KitchenStatus = 'locked' | 'idle' | 'cooking' | 'recipe';

/** One of the 10 kitchens (raw `Cooking[i]`, Toolbox `cooking.kitchens`). */
export interface Kitchen {
  /** 0-based; the game's Kitchen 1 is index 0. */
  index: number;
  /** Raw `Cooking[i][0]`: 0 not bought, 1 idle, 2 cooking a meal, 3 looking for a new recipe. */
  status: KitchenStatus;
  /** The meal it cooks (Toolbox meal name, "Turkey_of_Thank"), null when idle, locked or on a recipe. */
  meal: string | null;
  speedLv: number;
  fireLv: number;
  luckLv: number;
  /** Toolbox `mealSpeed`, progress per hour; null when locked or the kitchens section failed. */
  mealSpeed: number | null;
}

export interface Meal {
  /** Toolbox `cookingMenu` index. */
  index: number;
  /** Toolbox name, "Turkey_of_Thank". */
  name: string;
  level: number;
  /** Copies cooked and not yet spent on levels. */
  amount: number;
  /** Toolbox `levelCost`: copies the next level costs. */
  levelCost: number;
  /** Toolbox `cookReq`: progress one copy needs (a new kitchen makes 10 an hour). */
  cookReq: number;
  /** Toolbox `baseStat`, the bonus per level, and `effect` ("+{%_Total_Damage", `{` is the value). */
  perLevel: number;
  effect: string;
}

export interface Spice {
  /** Spice index = its Breeding territory's index ("CookingSpice0" = Grasslands). */
  index: number;
  /** Toolbox `spicesNames`, "Grasslands". */
  name: string;
  /** Spices held (raw `Meals[3][i]`); null when never found (-1 in the save). */
  held: number | null;
  /** Spices waiting at the territory (raw `Territory[i][4]`). */
  toClaim: number;
}

export interface CookingState {
  kitchens: Kitchen[];
  meals: Meal[];
  /** Toolbox `getMealMaxLevel` (30 in World 4). */
  mealMaxLevel: number;
  spices: Spice[];
  /** Spice claims used today (`accountOptions[100]`); null when unread. */
  claimsToday: number | null;
}

export type TerritoryStatus = 'foraging' | 'won' | 'not-won';

export interface Territory {
  /** 0-based, the same index as its spice. */
  index: number;
  /** "Grasslands" (Toolbox `territoryName`). */
  name: string;
  /** The battle to win it (Toolbox `battleName`, "The_Grass_Gang"). */
  battle: string;
  /** Total enemy HP in the battle. */
  enemyHp: number;
  /**
   * `foraging`: a team brings its spice in (raw `Territory[i][3]` names the spice); `won`: its spice was
   * found (raw `Meals[3][i] >= 0`) but nothing forages there now; `not-won` otherwise.
   */
  status: TerritoryStatus;
}

export interface BreedingUpgrade {
  /** Toolbox `petUpgrades` index (1 = Gene Splicing; 0 is the game's "none selected" filler and is left out). */
  index: number;
  /** "Egg_Capacity". */
  name: string;
  level: number;
  maxLevel: number;
}

export interface BreedingState {
  /** The account's Breeding level (the skill is shared, so the highest character's). */
  level: number;
  /** Bred at least once: the skill sits at level 0 until the first breed (M26 FR-8). Optional for hand-built states. */
  started?: boolean;
  /** Eggs in the nest. */
  eggs: number;
  /** Toolbox `eggCapacity`: nest slots. */
  eggCapacity: number;
  /** Seconds banked toward the next egg (raw `OptionsListAccount[87]`, Toolbox `timeToNextEgg`). Optional for hand-built states. */
  eggBankSeconds?: number;
  /**
   * At most this many seconds to the next egg: the 2-hour base period minus the banked time (bonuses
   * only shorten the period, M26 FR-8); 0 when the nest is full or an egg is due.
   */
  nextEggInSeconds: number;
  /** Dead DNA held (Toolbox `deadCells`). */
  deadDna: number;
  /** Mob Arena best wave (`accountOptions[89]`). */
  arenaBestWave: number;
  /** Mob species bred at least once (Toolbox `pets[][].unlocked`). */
  speciesBred: number;
  territories: Territory[];
  upgrades: BreedingUpgrade[];
}

/**
 * Optional so states built by hand need not spell them out; the adapter always sets each one, to a
 * value or null. Views treat undefined like null (unknown).
 */
export interface World4AccountFields {
  lab?: LabState | null;
  cooking?: CookingState | null;
  breeding?: BreedingState | null;
}
