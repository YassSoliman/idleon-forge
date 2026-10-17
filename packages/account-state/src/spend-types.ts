// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan (M7 TR-2): the `SpendInputs` projection, the coin wallets and the coin sinks the Spend
// Plan prices. Read in spend.ts only (M1 TR-11). Every coin figure is a Toolbox number (ADR 0005).
// Character names never enter this block: characters are keyed by index only.
//
// A sink is null when the parser section behind it failed or the save lacks it (M7 FR-25), never a
// default: a failed Vault must not read as "every row at level 0".

export interface Wallet {
  /** Character index (stable across saves), or 'bank' for coins kept in storage (MoneyBANK). */
  holder: number | 'bank';
  coins: number;
}

export interface VaultRow {
  /** 0-based row index; the generated Acquisition is `upgrade-vault.acquisition.row-<index>`. */
  index: number;
  /** Toolbox `name`, e.g. "Sleepy_Time" (a game name, never a character's). */
  name: string;
  level: number;
  /** Toolbox `maxLevel` (includes bundle and Glimbo). */
  maxLevel: number;
  /** The game's rule, not Toolbox's `unlocked`: row i is buyable when at least i+1 rows have unlockLevel <= total. */
  buyable: boolean;
  /** Toolbox `cost`; meaningless when level >= maxLevel. */
  nextCost: number;
  /** Toolbox `costToMax`. */
  costToMax: number;
  /**
   * Cumulative coins for +k levels, k = 1 .. min(25, maxLevel - level): the sum of Toolbox's per-level
   * `cost` at L .. L+k-1 from the worker re-parses (TR-4). `ladder[0] = { k: 1, coins: nextCost }`.
   * Empty when the row is maxed or locked.
   */
  ladder: { k: number; coins: number }[];
}

export interface VaultState {
  totalLevels: number;
  /** The first row whose unlock threshold is above the total; null when every row is open. */
  nextUnlock: { index: number; at: number; name: string } | null;
  /** Rows 0-61 (W1-W4, M7 scope). */
  rows: VaultRow[];
}

/** One way to price a stamp cap raise (TR-4): its material cost and Toolbox's checks at that price. */
export interface RaisePrice {
  /** Toolbox `materialCost`. */
  cost: number;
  /** Toolbox `hasMaterials`. */
  hasMaterials: boolean;
  /** Toolbox `enoughPlayerStorage`: the best carrier's empty-inventory capacity covers it. */
  carryOk: boolean;
}

export interface StampRaise {
  /** Item rawName. */
  material: string;
  /** Toolbox item name, e.g. "Spore_Cap". */
  materialName: string;
  /** Toolbox item type of the material: 'Equip' items are not counted by `hasMaterials` (FR-10). */
  materialType: 'Material' | 'Equip' | (string & {});
  /** At the current Hydrogen discount, never gilded (the parsed save's own price is gilded, TR-4). */
  atDiscount: RaisePrice;
  /** At 0% discount: the price of every raise after the first in a Hydrogen batch (FR-11). Equals atDiscount at 0%. */
  atZero: RaisePrice;
  /** With one Gilded Stamp (x0.05), only when the account holds one (OLA[154] > 0). */
  gilded: RaisePrice | null;
  /** Toolbox `ownedMats` (storage only). */
  ownedInStorage: number;
  /** Storage plus every inventory, for Equip materials (plain arithmetic over Toolbox's lists). */
  ownedAnywhere: number;
  /** Toolbox `bestCharacter.topCharacters` (top 3), joined to indices in the adapter. */
  carriers: { characterIndex: number; capacity: number }[];
  /** Toolbox `getMinReduction(...).reduction` at the non-gilded rate; null when even 90% won't fit. */
  minReduction: number | null;
  /** Toolbox `futureCosts[0].goldCost`. */
  coinsAfterRaise: number;
  /** Toolbox `futureCosts[0].level` and `.reduction`: the raise is ready only at the very next tier, at the current discount (FR-10). */
  afterRaise: { level: number; reduction: number };
}

export interface StampState {
  /** Toolbox rawName, e.g. "StampA1". */
  id: string;
  /** Toolbox displayName, e.g. "Sword_Stamp". */
  name: string;
  level: number;
  /** Toolbox maxLevel (the cap). */
  cap: number;
  /** reqItemMultiplicationLevel. */
  capStep: number;
  /** Coins for the next level below the cap (Toolbox goldCost); null at cap. */
  nextCoinCost: number | null;
  /** Coins from level to cap (Toolbox getGoldCostToMaxLevel); 0 at cap. */
  coinsToCap: number;
  /** null when below cap. */
  raise: StampRaise | null;
}

/** Raw `BribeStatus[i]`: -1 locked, 0 available, 1 bought. */
export interface BribeState {
  index: number;
  /** Toolbox `name`, e.g. "Insider_Trading". */
  name: string;
  /**
   * The bribe set (1-based) in Toolbox's book order: a set ends with its "The Art of the ..." bribe,
   * which opens the next one. Plain counting over Toolbox's list; a test checks it against the generated
   * `bribes.acquisition.*` `set` facts.
   */
  set: number;
  status: -1 | 0 | 1;
  /** Toolbox `price`. */
  price: number;
}

/** Toolbox `getCoinCost` through `getPlayerAnvil`, per character. */
export interface AnvilCoinPoint {
  characterIndex: number;
  /** Points bought with coins so far (Toolbox `pointsFromCoins`). */
  points: number;
  nextCost: number;
  /** Toolbox `coinsToMax`; 0 once the 600 coin points are bought. */
  coinsToMax: number;
}

export interface StatueGoldState {
  index: number;
  /** Toolbox `name`, e.g. "KACHOW". */
  name: string;
  /** Raw `StuG`: 0 none, 1 Gold, 2 Onyx, 3 Zenith. */
  grade: number;
}

export interface P2wUpgrade {
  /** "cauldron.power.speed", "liquid.water-drops.regen", "vials.attempts", matching the generated Acquisitions. */
  key: string;
  /** -1 = a locked liquid. */
  level: number;
  /** Toolbox `cost`; null for vials (Toolbox has no price, FR-14). */
  nextCost: number | null;
  /** Toolbox `costToMax`; null for vials. */
  costToMax: number | null;
}

export interface SpendInputs {
  /** One per readable character, by index, then the bank. */
  wallets: Wallet[];
  vault: VaultState | null;
  /** Every collected stamp (cap > 0 or level > 0), Lv 0 included (M8 FR-2); the one per-stamp list M4 and M8 read too. */
  stamps: StampState[] | null;
  bribes: BribeState[] | null;
  statueGold: StatueGoldState[] | null;
  /** Guilding Tools in storage or an inventory (the statue Gold gate when no statue is Gold yet). */
  guildingToolsOwned: boolean;
  /** Cauldron and liquid upgrades (priced) and vial upgrades (unpriced). */
  p2w: P2wUpgrade[] | null;
  /** null when the worker's Toolbox functions weren't supplied. */
  anvilCoinPoints: AnvilCoinPoint[] | null;
  /** `atoms.atoms[0].level`, `baseBonus x level`, `atoms.stampReducer`. null when the atoms section failed. */
  hydrogen: { level: number; dailyRate: number; discountPct: number } | null;
  /** OLA[154]. */
  gildedStamps: number;
  /** `CYColosseumTickets`; the sum of `allTickets[].totalAmount` (banked at the three NPCs). */
  colosseumTickets: { balance: number; bankedAtNpcs: number } | null;
  highestClassLevel: number;
}
