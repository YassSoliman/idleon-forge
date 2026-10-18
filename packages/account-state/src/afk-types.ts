// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's Account State facts (M3 TR-2). Every time is epoch ms and absolute, anchored to the
// parse clock (`AccountState.asOf`), so evaluating at a later `now` needs no re-parse. Every number is
// finite and in a sane range, or its fact is null (TR-2 "finite or null", RT-3): a NaN `at` would make
// every comparison false and a Check pass silently.

export type AfkFoodKind = 'health' | 'boost' | 'golden' | 'other';

export interface AfkFood {
  /** Index in the character's food buffer (Toolbox `food`, 16 entries). */
  slot: number;
  /** Toolbox rawName, e.g. "FoodHealth7". */
  item: string;
  /** From the item's `Type` (HEALTH_FOOD, BOOST_FOOD, GOLDEN_FOOD). */
  kind: AfkFoodKind;
  amount: number;
  /** Health food only: HP one bite heals (Toolbox item `Amount` x getPlayerFoodBonus(isHealth)); else null. */
  healPerBite: number | null;
}

export interface AfkFighting {
  /**
   * % 0..100, Toolbox `getMaxDamage(character).survivability` on the AFK Target's map: the same number
   * as `CharacterState.fighting.survivability`, which M4 owns (M4 TR-2, `FightingRate`). M3's food
   * Checks read it here, beside the food clones it is compared with.
   */
  survivability: number;
  /** The same number as `CharacterState.fighting.finalKillsPerHour` (M4 owns the shape). */
  finalKillsPerHour: number;
  /** % 0..100, `getMaxDamage({ ...character, food: [] })`. */
  survivabilityNoFood: number;
  /**
   * Owned health foods (this character's bag plus storage) that lift survivability to 100% when put in
   * the first Blank food slot, smallest stack first. At most 4 distinct foods are tried, the largest
   * owned stacks (TR-2's cost bound).
   */
  fixingFoods: Array<{ item: string; name: string; amount: number; healPerBite: number | null }>;
  /** Health food owned but not equipped (this character's bag plus storage), for "add more food" fixes. */
  spareHealthFood: number;
  /** Toolbox `getMaxDamage(character).maxHp` (M3 R-FOOD-1). */
  maxHp: number | null;
  /** The character's carry cap for food (getItemCapacity('cFood')), null when unknown (M3 R-FOOD-2). */
  foodCap: number | null;
}

export interface AfkAnvilProduct {
  /** Toolbox rawName of the product, e.g. "CraftMat1". */
  item: string;
  /** Toolbox display name, e.g. "Thread". */
  name: string;
  hammers: number;
  /** Toolbox `stats.anvilCapacity` and the amount produced at parse time. */
  amount: number;
  capacity: number;
  /** When the product reaches capacity (`asOf + getTimeTillCap(...)`); <= asOf when already full. */
  capAt: number;
  /** `getTimeTillCap(..., fromZero)` in ms: how long an emptied product takes to fill. */
  fromEmptyMs: number;
}

/** A split of anvil points between Speed and Capacity, and what it makes over the plan window. */
export interface AfkAnvilSplit {
  speed: number;
  capacity: number;
  /** Items made over the window from empty, summed over producing products: sum of min(rate x T, capacity). */
  output: number;
}

/**
 * The anvil point plan (#70 A2, A3; M3 FR-18, M6 FR-23 Final rulings). Every split is scored with
 * Toolbox's own `getPlayerAnvil` at counterfactual points (ADR 0005: Toolbox numbers, plain
 * arithmetic), materials objective only (A4: Exp points are held, never moved).
 */
export interface AfkAnvilPlan {
  /** Smithing level, the first source of anvil points. */
  smithingLevel: number;
  xpPoints: number;
  speedPoints: number;
  capPoints: number;
  /**
   * Unspent points, recomputed as the game does when the anvil tab opens: Smithing level + Acme Anvil
   * + coin points + material points - (Exp + Speed + Capacity). The stored `availablePoints` is stale
   * when Smithing levelled since the tab was last open. Can be negative (Acme Anvil reset).
   */
  unspent: number;
  /** Products with at least one hammer: rawName and display name. */
  products: Array<{ item: string; name: string }>;
  /**
   * One plan per "Back in about" window (`ANVIL_PLAN_WINDOWS_MS`, the Expected Return chips), shortest
   * first; the Detectors take the one for the player's Expected Return (`anvilPlanWindow`).
   */
  windows: AfkAnvilWindowPlan[];
}

/** The anvil plan for one window T (from empty: just collected). */
export interface AfkAnvilWindowPlan {
  windowMs: number;
  /** The current split. */
  current: AfkAnvilSplit;
  /**
   * The best placement of the unspent points on top of the current split (points added to each
   * stat); null when nothing is unspent. Ties go to Speed.
   */
  spend: AfkAnvilSplit | null;
  /**
   * The best full reallocation of Speed + Capacity + unspent after an Anvil Reset Whetstone, Exp kept
   * (totals per stat). Ties go to Speed.
   */
  respec: AfkAnvilSplit;
}

export interface AfkWorship {
  /** Toolbox `getPlayerWorship` at parse time (projected to `asOf`). */
  charge: number;
  max: number;
  ratePerHour: number;
  /** A worship skull is in the tools slots (Type WORSHIP_SKULL). */
  hasSkull: boolean;
}

export interface AfkInventory {
  /** Occupied bag slots and the bag's total slots (Toolbox `inventorySlots`). */
  usedSlots: number;
  totalSlots: number;
  /** Non-empty stacks. `cap` is the carry cap of the item's bag, or null when its category is unknown. */
  stacks: Array<{ item: string; amount: number; cap: number | null }>;
}

export interface CharacterAfkFacts {
  /** When this character's AFK Stretch started: its own last save (Toolbox `afkTime`, `PTimeAway_<i>`). */
  afkSince: number;
  /** Equipped food, non-empty slots, in slot order. */
  food: AfkFood[];
  /** Whether the 16-entry food buffer has a Blank entry. The unlocked slot count is unverified (TR-12 item 1). */
  blankFoodSlot: boolean;
  /** null until the unlocked food-slot count is verified (TR-12 item 1). */
  freeFoodSlots: null;
  /** Only for a character whose AFK Target is FIGHTING; null otherwise or when Toolbox's numbers aren't finite. */
  fighting: AfkFighting | null;
  inventory: AfkInventory | null;
  /** Products with at least one hammer; null when Toolbox's anvil numbers aren't finite. */
  anvil: AfkAnvilProduct[] | null;
  /** The anvil point plan (#70); null when Toolbox's anvil numbers aren't finite. */
  anvilPlan?: AfkAnvilPlan | null;
  worship: AfkWorship | null;
  /** Equipped prayers with their bonus (`getPrayerBonusAndCurse`). */
  prayers: Array<{ name: string; bonus: number }> | null;
  /** Placed traps; `endsAt` is anchored to the cloud save (TR-2), not to Toolbox's parse-clock `timeLeft`. */
  traps: { placed: Array<{ critter: string; endsAt: number }> } | null;
  /** `alchemy.activities[i].activity !== -1`; null when the alchemy section failed. */
  cauldronAssigned: boolean | null;
}

export interface AccountAfkFacts {
  /** The parse time every projection is made at (= `AccountState.asOf`). */
  projectedAt: number;
  /** `timeAway.Arcade` and `getMaxClaimTime` (seconds there, ms here). */
  arcade: { lastClaimAt: number; maxClaimMs: number } | null;
  /** Each cauldron's liquid: `alchemy.liquids[i]` against `liquidCauldrons[i].maxLiquid`. */
  liquids: Array<{ index: number; current: number; max: number }> | null;
  /** Active salts and when their materials run out (`getSaltMatsTimeLeft`). */
  salts: Array<{ salt: string; dryAt: number }> | null;
  /** Free storage chest slots, for the deposit fixes. */
  storageFreeSlots: number | null;
  /** Coins on the account (Toolbox `currencies.rawMoney`: bank plus characters), for the Whetstone gate (#70 A3). */
  coins?: number | null;
}
