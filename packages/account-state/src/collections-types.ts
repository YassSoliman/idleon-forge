// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 Collections' Account State fields (M8 TR-15, M1 TR-11): stamps, quests, holdings, shop stock,
// cards, card sets, card presets and obols. Read in collections.ts only; declared in
// collections-fields.ts. Optional so hand-built states (other packages' tests) need not spell them
// out; the adapter always sets each one, to a value or null (null = unknown, never "none").

/** One obol slot (family or personal). Toolbox `obols.list[]`: `Blank` = open, `ObolLocked*` = gated. */
export interface ObolSlot {
  index: number;
  /** "Circle" | "Square" | "Hexagon" | "Sparkle". */
  shape: string;
  /** Family level (family slots) or class level (personal slots) that opens the slot. */
  levelReq: number;
  state: 'empty' | 'locked' | 'filled';
  /** The equipped obol's rawName, else null. */
  obol: string | null;
}

/** One card of the account's collection (Toolbox `account.cards`, keyed by card rawName). */
export interface CardState {
  /** Toolbox display name, e.g. "Bored_Bean". */
  name: string;
  /** Copies owned; 0 = not owned. */
  amount: number;
  /** 0-based stars: level = stars + 1 when owned. */
  stars: number;
  nextLevelReq: number;
  perTier: number;
  /** Toolbox effect text, e.g. "+{%_Total_Drop_Rate"; "(Passive)" marks a passive card (M8 shares this field with M4, which reads the rest). */
  effect: string;
  /** The card's set (Toolbox `category`), e.g. "Yum_Yum_Desert". */
  set: string;
}

/** One card set, from Toolbox `getCardSets` (M8 FR-14, FR-19). */
export interface CardSetState {
  /** "CardSet1". */
  rawName: string;
  /** "Yum_Yum_Desert". */
  name: string;
  /** Toolbox effect text, e.g. "{%_All_Food_Effect". */
  effect: string;
  /** Bonus per tier. */
  bonus: number;
  /** floor(points ÷ size); Toolbox's `stars` + 1, never below 0. */
  tier: number;
  /** Σ card levels in the set (Toolbox `totalStars`). */
  points: number;
  /** Cards in the set. */
  size: number;
}

/** A character's card loadout. Card ids are card rawNames (Toolbox `cards.json` keys). */
export interface CardLoadout {
  /** Real equipped cards only; Toolbox pads `equippedCards` to 8 with `{legendBonus}` placeholders. */
  equipped: string[];
  /** The equipped set's rawName ("CardSet1"), or null when none. */
  set: string | null;
  /** The 7 stored presets, each its real cards only (most are empty). */
  presets: string[][];
  /** 0-based (`selectedCardPreset`); texts show it plus 1. */
  selectedPreset: number | null;
}

export interface CollectionsAccountFields {
  /**
   * Every stamp in Toolbox's catalogue, by rawName, with its level and cap (Toolbox `account.stamps`).
   * Collected = `maxLevel > 0 || level > 0` (M8 FR-2).
   * TODO(M7): M7's `SpendInputs.stamps` is the one per-stamp list once it lands; M8 reads this until then.
   */
  stampLevels?: Record<string, { name: string; level: number; maxLevel: number }> | null;
  /** Chest storage counts by item rawName (Toolbox `storage.list`). */
  storageItems?: Record<string, number> | null;
  /** Refinery storage counts by item rawName (Toolbox `refinery.refineryStorage`). */
  refineryStorage?: Record<string, number> | null;
  /** Coins in the bank (Toolbox `currencies.bankMoney`, raw `MoneyBANK`); never `rawMoney`. */
  bankCoins?: number | null;
  /** Stock by town shop index (Toolbox `shops` key), from raw `ShopStock` through `toolboxCalls.shopStockAll`. */
  shopStock?: Array<Record<string, number>> | null;
  /** Item `typeGen` of every stackable item the account holds (storage, refinery, inventories): the carry-cap key. Equipment ("a…") is left out: it takes one slot per item. */
  heldItemTypes?: Record<string, string> | null;
  /** The account's card collection by card rawName (one field shared with M4). */
  cards?: Record<string, CardState> | null;
  /** Every card set (Toolbox `getCardSets`). */
  cardSets?: CardSetState[] | null;
  /** Family obol slots (Toolbox `account.obols.list`). */
  familyObols?: ObolSlot[] | null;
  /** Obols in Obol Storage (Toolbox `account.obols.inventory`, rows by shape: circle, square, hexagon, sparkle). */
  storedObols?: Array<{ rawName: string; shape: string }> | null;
  /** The W2 merit "Monsters now drop Obols" level (`tasks[2][1][0]`, 0–7). */
  obolDropMerit?: number | null;
}

export interface CollectionsCharacterFields {
  /** Quest status by NPC and quest key (Toolbox `quests`): −1 not started, 0 accepted, 1 done. Keys are strings and not always 1..n. */
  quests?: Record<string, Record<string, number>> | null;
  /** Unequipped bag items by rawName (Toolbox `inventory`); equipped gear and tools never count (M8 TR-6). */
  inventoryItems?: Record<string, number> | null;
  /** `inventorySlots` minus occupied bag slots. */
  freeInventorySlots?: number | null;
  /** Carry cap per inventory slot by item `typeGen` (Toolbox `getItemCapacity`), for the types in `heldItemTypes`. */
  carryPerSlot?: Record<string, number> | null;
  /** Coins on the character (Toolbox `money`). */
  money?: number | null;
  /** Smithing level (Toolbox `skillsInfo.smithing.level`), for craft-then-hand-in (M8 FR-5). */
  smithingLevel?: number | null;
  /** The saved AFK Target's monster rawName (Toolbox `targetMonster`), for drop routes. */
  targetMonster?: string | null;
  cardLoadout?: CardLoadout | null;
  /** Personal obol slots (Toolbox `characters[].obols.list`). */
  personalObols?: ObolSlot[] | null;
}
