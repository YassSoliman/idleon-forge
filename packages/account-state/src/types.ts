// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account State (see GLOSSARY.md): a normalized snapshot of one player's account at the moment of
// a cloud save. It grows as the advice engine needs more (M1 TR-11: add the field here with its
// Toolbox source, read it in adapter.ts only, declare it in fields.ts, bump SCHEMA_VERSION).
// String identifiers (class, map, AFK target, food) are Toolbox's, e.g. "Siege_Breaker"; use
// `humanize()` to display them.
import type { SideReadName } from '@idleon-forge/toolbox-parsers';
import type { AccountAfkFacts, CharacterAfkFacts } from './afk-types';
import type { AlchemyAccountFields } from './alchemy-types';
import type { BubbaAccountFields } from './bubba-types';
import type { CollectionsAccountFields, CollectionsCharacterFields } from './collections-types';
import type { DepthAccountFields } from './depth-types';
import type { EliteCharacterFields } from './elite-types';
import type { GearAccountFields, GearCharacterFields } from './gear-types';
import type { ProductionCharacterFields } from './production-types';
import type { PurposeAccountFields, PurposeCharacterFields } from './purpose-types';
import type { RedesignAccountFields, RedesignCharacterFields } from './redesign-types';
import type { RiftAccountFields } from './rift-types';
import type { SlotsAccountFields, SlotsCharacterFields } from './slots-types';
import type { SpendInputs } from './spend-types';
import type { StarSignsAccountFields, StarSignsCharacterFields } from './starsigns-types';
import type { TalentAccountFields, TalentCharacterFields } from './talent-types';
import type { SaltState, UnspentAccountFields, UnspentCharacterFields } from './unspent-types';
import type { W23AccountFields } from './w23-types';
import type { WalkthroughAccountFields, WalkthroughCharacterFields } from './walkthrough-types';
import type { World4AccountFields } from './world4-types';

/**
 * Bumped whenever a field is added, renamed or changes meaning. 1 was slice 1's unversioned shape.
 * 3: `account.dailyResetInSeconds` (M6 TR-3; also M10's Skip today rule).
 * 4: `account.accountLevel` (issue #60, the M10 header).
 * 5: the M2 Stage & Meta Path fields (M2 TR-3): `classIndex`, `npcDialog`, `nextPortal`, `buildings`,
 *    `salts`, `gateQuests`, `worldCrystals`, `frontier`. M2's family level is `accountLevel`.
 * 6: `characters[].afk` and `account.afk` (M3 TR-2).
 * 7: M6 TR-3's unspent-and-idle fields (the `UnspentAccountFields` and `UnspentCharacterFields` blocks;
 *    M6's `salts` entries add `name`, `active`, `rank` and `missingFuel` to M2's shared list).
 * 8: M3 R-FOOD-1/2: heal per bite, max HP and the food carry cap in `characters[].afk`.
 * 9: #70 anvil plan: `characters[].afk.anvilPlan` and `account.afk.coins`; `anvilPointsAvailable` is
 *    recomputed from its sources instead of the stored value.
 * 10: M9 TR-3/TR-4: `characters[].talents` (both presets and attack bars) and `account.resetItems`.
 * 11: M8 TR-15's collections fields (the `CollectionsAccountFields` and `CollectionsCharacterFields`
 *    blocks: stamps, quests, holdings, shop stock, cards with `effect`, card sets and presets, obols).
 * 12: `account.spend` (M7 TR-2, the Spend Plan's wallets and coin sinks).
 * 13: M14 TR-2's walkthrough fields (the `WalkthroughAccountFields` and `WalkthroughCharacterFields`
 *    blocks: anvil tabs, Forge output, holdings, the 3D Printer, supply rates, skills, presets).
 * 14: M15 TR-2's account-depth fields (the `DepthAccountFields` block: `refinery`, `construction`,
 *    `library`).
 * 15: M16 TR-2's star sign fields (`account.starSigns`, `characters[].starSigns`,
 *    `characters[].telescopeRoute`) and `Telescope` in `npcDialog` (GATE_NPCS, M16 X1).
 * 16: M20 TR-2's skill, Parallel Slot and reset-item fields (the `SlotsAccountFields` and
 *    `SlotsCharacterFields` blocks: skills, slots, cogBoard, liquids, resets, killroy, weeklyBattle,
 *    ballot, randomEvents, petTournament, taskBoardDailies, guildTasks, totems).
 * 17: M4 TR-2's Purpose fields (the `PurposeAccountFields` and `PurposeCharacterFields` blocks: class and
 *    skill EXP, the current-map `fighting` rate, tools, the Death Note, the Upgrade Vault kill totals).
 * 18: M19 TR-2's `account.alchemyPlan` (bubble and vial levels, Liquid Shop counters, Player Pay 2 Win
 *    levels, the best Alchemy level) and the Player keys in `account.spend.p2w` (M19 X2).
 * 19: M18 TR-2's gear fields (`characters[].gear`, `account.gearItems`, `account.anvilRecipes`,
 *    `account.armorSmithy`).
 * 20: M21 TR-3's redesign fields (`characters[].talents.starPoints`, `characters[].doorKillsLeft`,
 *    `account.statues`; the `RedesignAccountFields` and `RedesignCharacterFields` blocks).
 * 21: ADR 0010's exact talent points (`characters[].talents.active.talentPoints`, `.other.talentPoints`).
 * 22: M23 TR-2's `account.bubba` (Toolbox's Bubba parse, a few raw indices, ADR 0010's derived values).
 * 23: M24's World 4 fields (the `World4AccountFields` block: `lab`, `cooking`, `breeding`), read-only pages.
 * 24: M24: `characters[].afk.anvilPlan.products[].required` (Toolbox `requiredAmount`), and the plan's
 *    `output` is anvil work (each item weighted by it), not an item count.
 * 25: M24's World 3 page facts: `account.prayers`, `account.shrines` (the `W23AccountFields` block) and
 *    each Refinery salt's `fuel` (its inputs and how many the account holds).
 */
export const SCHEMA_VERSION = 25;
// Pending for the next release's one bump (M26 section 6: one bump per wave release, not per PR):
//  - M26 Wave 0: `account.breeding.eggBankSeconds`, `.started`, and `.nextEggInSeconds` now an upper
//    bound on time left (it was the banked time).
//  - M26 Wave 0: `account.equinoxUnlocked` (authored reader, FR-8).
//  - M26 Wave C: `characters[].anvil` (the `ProductionCharacterFields` block: hammers in save order,
//    stock of every product, capacity, speed terms).
//  - M26 Wave 1: `characters[].eliteStep` (the `EliteCharacterFields` block, FR-17: the Eliteus step).
//  - M26 Wave 1: `account.rift` (the `RiftAccountFields` block, FR-11: level, task, bonuses, Rift Ripper).

/** The AFK types Toolbox's monster data uses, plus its two "no rate" values. */
export const KNOWN_AFK_TYPES = [
  'FIGHTING',
  'MINING',
  'CHOPPIN',
  'FISHING',
  'CATCHING',
  'COOKING',
  'LABORATORY',
  'DIVINITY',
  'SPELUNKING',
  'Nothing',
  'Paying_Respect',
] as const;
export type KnownAfkType = (typeof KNOWN_AFK_TYPES)[number];

export interface FoodStack {
  /** Toolbox item name, e.g. "Golden_Jam"; null when the parser pin doesn't know the item (FR-19a). */
  item: string | null;
  amount: number;
}

export interface CharacterState
  extends UnspentCharacterFields,
    TalentCharacterFields,
    CollectionsCharacterFields,
    WalkthroughCharacterFields,
    StarSignsCharacterFields,
    SlotsCharacterFields,
    PurposeCharacterFields,
    GearCharacterFields,
    ProductionCharacterFields,
    EliteCharacterFields,
    RedesignCharacterFields {
  /** Slot in the save (0-based), stable across saves. Field paths use it: `characters[<index>].level`. */
  index: number;
  name: string;
  /** Toolbox class name, e.g. "Blood_Berserker". From `CharacterClass_<i>`. */
  class: string;
  /** From `Lv0_<i>`. */
  level: number;
  /**
   * The AFK type of the character's AFK Target; usually a `KnownAfkType`, kept open for new types.
   * `'Nothing'` only when the save sets no AFK Target (`AFKtarget_<i>` empty, `_` or `Nothing`).
   * null when the target is an id the parser pin doesn't know, or the raw key is missing (FR-19a).
   */
  afkType: KnownAfkType | (string & {}) | null;
  /** What the character fights or gathers (monster or resource name); null when none or unknown. */
  afkTarget: string | null;
  /** Toolbox map name, e.g. "Spirit_Village"; null when the map id is unknown or missing. */
  currentMap: string | null;
  /** Equipped food, non-empty slots only, in slot order. */
  foodStacks: FoodStack[];
  /** Seconds between this character's last save (`PTimeAway_<i>`) and `AccountState.asOf` (never negative). */
  secondsSinceLastSave: number | null;

  // ---- M2 Stage & Meta Path (M2 TR-3). Always set by the adapter; optional only so hand-built states in
  // other packages' tests stay valid. Read them as `?? null`.
  /** Toolbox `characters[].classIndex` (`CharacterClass_<i>`); null when unset. Shared: M4 and M9 read it. */
  classIndex?: number | null;
  /** Only the gate NPCs M2 and M6 read, never the whole dialogue map. 9999 is kept as-is (Toolbox reads it as "met"). */
  npcDialog?: Partial<Record<GateNpc, number>>;
  /** Toolbox `nextPortal` on the character's current fighting map: its first door. null off a fighting map. */
  nextPortal?: NextPortal | null;

  // ---- M3 AFK Safety (M3 TR-2). Set by the adapter; optional only so hand-built states stay valid. ----
  /** Built in the parse worker from Toolbox's functions; null when they weren't supplied or the character's AFK start is unknown. */
  afk?: CharacterAfkFacts | null;
}

/**
 * The NPCs a Stage rule (M2 TR-5) or the TR-6a cross-check reads, plus Bellows (M6 TR-7, Chizoar keys)
 * and the Telescope (M16 X1: a star responds to a click only once `Telescope >= 1`, F-k).
 */
export const GATE_NPCS = [
  'Builder_Bird',
  'Constructor_Crow',
  'Carpenter_Cardinal',
  'Dog_Bone',
  'Djonnut',
  'Bellows',
  'Telescope',
] as const;
export type GateNpc = (typeof GATE_NPCS)[number];

/** The quest givers whose quests gate a world (M2 TR-11). */
export const GATE_QUEST_NPCS = ['Dog_Bone', 'Djonnut', 'Hoggindaz', 'Bellows', 'Gobo'] as const;
export type GateQuestNpc = (typeof GATE_QUEST_NPCS)[number];
/** Toolbox quest name, e.g. "Djonnut2", "Hoggindaz5". */
export type GateQuestId = `${GateQuestNpc}${number}`;

/** One map door's portal progress (one shape shared with M4). */
export interface NextPortal {
  door: number;
  current: number;
  goal: number;
}

/** A door on a world's route path (M2 TR-7 `portals.fact.world-routes`), as the frontier step takes it. */
export interface RouteDoor {
  mapIndex: number;
  /** Toolbox map name, e.g. "Thermonuclear_Climb". */
  mapName: string;
  door: number;
  /** Kills to open the door (Toolbox `mapPortals[map][door]`). */
  requirement: number;
}

/** One character's fight on the frontier map, from Toolbox `getMaxDamage` on a clone moved there (M2 TR-2). */
export interface FrontierFight {
  characterIndex: number;
  finalKillsPerHour: number;
  /** Unfloored, for M2 FR-13 ordering only. */
  killsPerHour: number;
  /** % 0..100, Toolbox's unit. */
  hitChance: number;
  /** % 0..100, Toolbox's unit. */
  survivability: number;
  /** Door requirement minus this character's kills on the frontier door (never below 0). */
  killsLeft: number;
}

/** Computed in the parse worker (M2 TR-2, TR-3). */
export interface Frontier {
  /** The account's currentWorld. */
  world: number;
  mapIndex: number;
  mapName: string;
  door: number;
  /** TR-10 step 1 (first path door nobody cleared), or its fallback (the path door with the highest requirement). */
  kind: 'uncleared' | 'hardest-cleared';
  requirement: number;
  /** Path doors each character has cleared, in path order. A door is cleared when raw `KillsLeft2Advance[map][door] <= 0`. */
  routeCleared: Array<{ characterIndex: number; count: number; of: number; reachesFrontier: boolean }>;
  /** One row per character with level > 0; zeros kept so "nobody can fight" is visible. */
  fights: FrontierFight[];
}

/** Per gate quest: characters that completed it (Toolbox getQuests `completed[]`) and that stand on it unfinished. */
export interface GateQuestProgress {
  completedBy: number[];
  inProgressBy: number[];
}

export interface AccountSummary
  extends UnspentAccountFields,
    AlchemyAccountFields,
    TalentAccountFields,
    CollectionsAccountFields,
    WalkthroughAccountFields,
    DepthAccountFields,
    StarSignsAccountFields,
    SlotsAccountFields,
    PurposeAccountFields,
    GearAccountFields,
    RedesignAccountFields,
    BubbaAccountFields,
    World4AccountFields,
    RiftAccountFields,
    W23AccountFields {
  /** The world the account is working on (1-based): one past the highest finished world (Toolbox's rule). */
  currentWorld: number | null;
  /** Worlds whose exit has been used (a character met the gatekeeper past it), ascending. */
  finishedWorlds: number[];
  /** When the account last cloud-saved (epoch ms), from the save's own clock (`TimeAway.GlobalTime`). */
  lastCloudSave: number | null;
  /** Seconds between `lastCloudSave` and `AccountState.asOf` (never negative). */
  secondsSinceLastSave: number | null;
  /**
   * Seconds from `lastCloudSave` to the game's next daily reset (`TimeAway.ShopRestock`, a countdown
   * taken at the save). The time of day differs per account. Shape owned with M6 (M6 TR-3); read the
   * reset time with `nextDailyReset(state, now)`, which rolls it forward in 24 h steps.
   */
  dailyResetInSeconds: number | null;
  /**
   * Total account level: the sum of every character's class level (Toolbox's `account.accountLevel`).
   * Display only (the M10 header, issue #60). null when Toolbox gave no number.
   */
  accountLevel: number | null;
  gameVersion: {
    /** The game server's build (`_vars.GameVERSION`) at the last `_vars` read, e.g. 142; not in the save. */
    serverBuild: number | null;
    /** The save format version (`CSver`). */
    saveVersion: number | null;
    /** The game version the parser pin targets, e.g. "2.3.540". */
    parserTarget: string;
  };

  // ---- M2 Stage & Meta Path (M2 TR-3). Always set by the adapter; optional only so hand-built states in
  // other packages' tests stay valid. Read them as `?? null`.
  /** The one building-level field (M4 and M6 read the Death Note from here). A tower absent from Toolbox's array is 0; null only when the towers section failed. */
  buildings?: { deathNote: number | null; printer3d: number | null; atomCollider: number | null } | null;
  /**
   * The one salt list, in Refinery order (index 5 = Nullo). M2 sets `rawName` and `unlocked`; M6 TR-3
   * extends each entry with `name`, `active`, `rank` and `missingFuel` (unspent.ts). null when the
   * refinery section failed.
   */
  salts?: SaltState[] | null;
  /** Per gate quest (Dog Bone, Djonnut, Hoggindaz, Bellows, Gobo). null when the quests section failed. */
  gateQuests?: Partial<Record<GateQuestId, GateQuestProgress>> | null;
  /** Counts in storage plus every inventory. null when the storage section failed. */
  worldCrystals?: { desertTopaz: number; glacierQuartz: number; galaxialAmethyst: number } | null;
  /** Computed in the worker (M2 TR-2). null before it runs, when a damage-relevant section failed, or when it threw. */
  frontier?: Frontier | null;

  // ---- M3 AFK Safety (M3 TR-2). Set by the adapter; optional only so hand-built states stay valid. ----
  /** The account-wide stockpiles that cap; null when Toolbox's functions weren't supplied to the adapter. */
  afk?: AccountAfkFacts | null;

  // ---- M7 Spend Plan (M7 TR-2). Set by the adapter; optional only so hand-built states stay valid. ----
  /** Wallets and coin sinks; null when the worker's Toolbox functions weren't supplied to the adapter. */
  spend?: SpendInputs | null;
}

/** Structured, machine-readable problems with one read (M1 FR-16, FR-17, FR-19a, FR-19b). */
export interface ParseDiagnostics {
  /** Toolbox parser sections that threw and fell back on their last pass, e.g. "obols". A weak signal. */
  failedSections: string[];
  /** Side reads that errored (not merely absent). */
  failedSideReads: SideReadName[];
  /** Character slots skipped for lack of data. */
  skippedCharacters: number[];
  /** Character slots that have data but could not be read (unknown class, missing level). */
  unreadableCharacters: number[];
  /** Ids the parser pin doesn't know, by kind. */
  unknownIds: { monsters: string[]; maps: string[]; items: string[]; classes: string[] };
  /** Account State paths that failed their presence check: raw key missing or unparseable, or unknown id. */
  unknownFields: string[];
  /** True when names were missing and characters are numbered. */
  unnamed: boolean;
  parserPin: { commit: string; gameVersion: string };
  source: 'live' | 'paste';
}

export interface AccountState {
  /** `SCHEMA_VERSION` when this state was made. */
  schemaVersion: number;
  /** The `now` the save was parsed at (epoch ms). All "seconds since" fields are relative to it. */
  asOf: number;
  account: AccountSummary;
  /** Readable characters only; unreadable ones are in `diagnostics.unreadableCharacters`. */
  characters: CharacterState[];
  /**
   * Slot of the character played last at the last cloud save: the newest character save within 30 s
   * of the account's, with no other within 1 s of it. null on a tie or when unknown (M1 FR-19, TR-12).
   */
  lastPlayedCharacterIndex: number | null;
  /** Read with `isKnown(state, path)`; never decide from a field it reports unknown. */
  diagnostics: ParseDiagnostics;
  /** Human-readable warnings, for display only. */
  warnings: string[];
}
