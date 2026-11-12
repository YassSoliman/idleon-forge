// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 Unspent & idle (M6 TR-3): the Account State fields M6's Checks read, kept in one block so other
// modules' additions don't collide with them. Read in unspent.ts only (M1 TR-11). Every field is null
// when the save (or the parser section, or the side read) behind it is missing, never a default.
//
// Shared fields (docs/specs/README.md): `account.salts` is declared in types.ts (M2 sets `rawName` and
// `unlocked`, M6 extends each entry, see SaltState); key collectors are read from M2's
// `characters[*].npcDialog`, and the Death Note level is M2's `account.buildings.deathNote`.

/** The four bubble cauldrons, in game order. */
export type CauldronId = 'power' | 'quicc' | 'high-iq' | 'kazam';

export interface CauldronState {
  id: CauldronId;
  /** Toolbox `cauldrons[c].newBubble.expectedBubbles`: new bubbles the banked brew is expected to give. */
  expectedNewBubbles: number;
  /** Bubbles unlocked in this cauldron (`cauldrons[c].unlockedBubbles`). */
  unlockedBubbles: number;
  /** The bubble the next unlock gives: `bubbles[c][unlockedBubbles]`, null when the cauldron is complete. */
  nextBubble: { name: string; rawName: string } | null;
}

export interface AlchemyState {
  cauldrons: CauldronState[];
  /** Every bubble at level 1 or more: rawName (e.g. "aUpgradesO3") and game name ("WYOMING_BLOOD"), by rawName. */
  unlockedBubbles: Array<{ rawName: string; name: string }>;
  /** `alchemy.p2w.vialsAttempts`, `current` clamped to 0..max (saves can hold a negative remaining count). */
  vialAttempts: { current: number; max: number };
  /** A level-0 vial's ingredient is held in storage or an inventory (Toolbox's vialsAttempts alert rule). */
  vialAttemptsUsable: boolean;
}

export type KeyId = 'forest-villa' | 'efaunt' | 'chizoar';

export interface KeyBank {
  id: KeyId;
  /** The key item's rawName ("Key1") and display name ("Forest_Villa_Key"). */
  rawName: string;
  name: string;
  /** Keys earned a day: characters whose NPC dialogue passed the earner threshold (M6 R1: Djonnut > 5). */
  perDay: number;
  /** The game's day counter (OLA[16], [31], [80]); never capped, so 4 means one day already lost. */
  daysSincePickup: number | null;
  /** `min(days, 3) × perDay`, what collecting gives now. */
  banked: number;
}

export interface TicketBank {
  /** 0 Typhoon, 1 Centurion, 2 Lonely Hunter. */
  npc: 0 | 1 | 2;
  /** Typhoon always; Centurion once World 1 is finished; Lonely Hunter once World 2 is (Toolbox areKeysOverdue). */
  reachable: boolean;
  /** OLA[15], [35], [56]; never capped. */
  daysSincePickup: number | null;
  /** `min(days, 3)`: Toolbox hardcodes one ticket a day. */
  banked: number;
}

export interface CooldownGame {
  /** Unspent points: Darts OLA[434], Hoops OLA[418]. */
  points: number;
  /** Upgrade levels: OLA[435..438] / OLA[419..422]. */
  levels: number[];
  /** Toolbox getDartsData / getHoopsData cost per upgrade; null while the upgrade is locked by total levels. */
  nextCosts: Array<number | null>;
  /** Seconds of cooldown left at the save: OLA[439] / OLA[423]; ≤ 0 means ready. */
  cooldownSecondsAtSave: number;
  /** Plays today: OLA[440] / OLA[424]. */
  playsToday: number;
  /** Best score: OLA[442] / OLA[242]. */
  bestScore: number;
}

export interface MinigamesState {
  /** The shared skill-minigame play pool (`currencies.minigamePlays`, OLA[33]). */
  plays: number;
  highscores: { choppin: number; fishing: number; catching: number; mining: number };
  /** The Funguy quest "score 20 in Choppin" (Funguy2) is done on some character. */
  funguyChoppinDone: boolean;
  darts: CooldownGame;
  hoops: CooldownGame;
  /** OLA[7] == 1 (today's Spiketrap gems not claimed yet), OLA[201]. */
  spiketrap: { gemsAvailableToday: boolean; bestRound: number };
}

export interface PetsState {
  /** epoch ms; the free pull is claimable at anchor + 594,000,000 ms (Toolbox getNextCompanionClaim). */
  freeClaimAnchor: number;
  /** Companions owned. */
  owned: number;
  /** Companion 4 owned: "all big bubbles count as equipped". */
  sheepie: boolean;
}

export interface PetMartState {
  /**
   * Whether the Pet Mart gem claim is reachable on this account: true since the in-game check
   * (M6 Final rulings, #34); see `PET_MART_UNLOCK_VERIFIED` in unspent.ts.
   */
  unlocked: boolean;
  /** OLA[516]. */
  lastClaimedShopDay: number;
  /** `tournament.global.S`. */
  currentShopDay: number;
  /** `serverVars.GemPM_x ≥ 0.1`. */
  gemsOffered: boolean;
}

export interface PostOfficeState {
  /** Some character has finished Postboy Pablob's quest (`Postboy_Pablob1`). */
  unlocked: boolean;
  /** Character slots with the quest in progress. */
  questInProgressOn: number[];
  /** Companies with no order completed today (`postOfficeShipments[*].completedAnOrder`). */
  companiesNotDoneToday: number;
  /** `timeAway.PostOfficeRefresh`, seconds to the next order refresh at the save. */
  refreshInSeconds: number | null;
}

export interface MeritWorld {
  world: 1 | 2 | 3 | 4;
  /** Unspent merits (`tasks[4][world]`). */
  unspent: number;
  /** Every row of the world's merit shop: level (`tasks[2][world-1][index]`), max and cost (null = placeholder). */
  rows: Array<{ index: number; level: number; max: number; cost: number | null }>;
}

/**
 * One entry of `account.salts` (the shared list: M2 sets `rawName` and `unlocked`, M6 the rest, always
 * together in the adapter; the M6 fields are optional only for M2's own reader and hand-built states).
 */
export interface SaltState {
  /** "Refinery1" … */
  rawName: string;
  unlocked: boolean;
  /** The salt item's name, "Redox_Salts" … */
  name?: string;
  active?: boolean;
  rank?: number;
  /** Toolbox hasMissingMats at the salt's rank: each short input with what is needed and held. */
  missingFuel?: Array<{ rawName: string; name: string; need: number; have: number }>;
  /** M26 FR-21b (salt.ts): held in the Storage Chest, and waiting in Refinery storage, kept apart. */
  held?: number;
  inRefinery?: number;
}

/** The Death Note building's build state. Its level is M2's `account.buildings.deathNote`. */
export interface DeathNoteBuildingState {
  /** The building is in a Construction build slot (`towers.data[Death_Note].inProgress`). */
  inBuildSlot: boolean;
  /** The next level's cost (`itemReq[0]`). */
  nextCost: { rawName: string; amount: number } | null;
  /** That item held in storage plus refinery storage. */
  held: number;
}

/**
 * Optional so states built by hand (tests, other modules' fixtures) need not spell them out; the
 * adapter always sets every one, to a value or null. Detectors treat undefined like null (unknown).
 */
export interface UnspentAccountFields {
  /** max(characters[].level); null with no readable character. */
  highestLevel?: number | null;
  alchemy?: AlchemyState | null;
  /** 1 + the "Changing the Code" bribe + Breeding arena wave ≥ 100. */
  bigBubbleSlots?: number | null;
  merits?: MeritWorld[] | null;
  /** Task unlock points owned, rows bought, and unbought rows in the open columns (worlds reached). */
  taskUnlocks?: { owned: number; bought: number; openUnbought: number } | null;
  gems?: number | null;
  /** `gemShopPurchases`, by the save's GemItemsPurchased index. */
  gemPurchases?: number[] | null;
  keys?: KeyBank[] | null;
  colosseumTickets?: TicketBank[] | null;
  minigames?: MinigamesState | null;
  /** From the companions side read; null when it is missing. */
  pets?: PetsState | null;
  petMart?: PetMartState | null;
  postOffice?: PostOfficeState | null;
  /** Poppy (Toolbox `kangaroo`). */
  poppy?: { unlocked: boolean; pendingFish: number } | null;
  deathNoteBuilding?: DeathNoteBuildingState | null;
}

export interface UnspentCharacterFields {
  /** rawName of each equipped big bubble by slot, null for an empty slot. */
  bigBubbles?: Array<string | null>;
  /** `postOffice.unspentPoints`. */
  postOfficeUnspent?: number | null;
  /** Unspent anvil points, recomputed as the game does (#70); the stored `availablePoints` without every source. */
  anvilPointsAvailable?: number | null;
}
