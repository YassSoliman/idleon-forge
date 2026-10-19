// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The package's typed boundary. Toolbox's own output is untyped (`any`), so everything past
// `account` / `characters` is `unknown` here and narrowed by @idleon-forge/account-state.

/**
 * Everything `parseData()` needs: the Firestore `_data/{uid}` save document plus the side reads.
 * This is also the shape of Toolbox's "Copy for support" JSON and of its public fixtures.
 */
export interface RawSaveEnvelope {
  /** The raw cloud save, Firestore `_data/{uid}` (~335 flat keys such as `AFKtarget_0`). */
  data: Record<string, unknown>;
  /** Character names, RTDB `_uid/{uid}`. */
  charNames?: string[];
  /** RTDB `_comp/{uid}`. */
  companion?: unknown;
  /** `{ id, stats, members, points }` assembled from the save's `Guild` and RTDB `_guild/{id}`. */
  guildData?: unknown;
  /** Firestore `_vars/_vars`. */
  serverVars?: Record<string, unknown>;
  /** When the save document was created (epoch ms), if known. */
  accountCreateTime?: number;
  /** `{ user, match, global, leaderboard }` from the tournament reads. */
  tournament?: unknown;
  /** When this envelope was captured (epoch ms), as Toolbox records it. */
  lastUpdated?: number;
  /**
   * Not Toolbox's: which side reads errored (as opposed to returning nothing) when the live listener
   * assembled this envelope. The parser ignores it; the Account State lists it in its diagnostics.
   */
  sideReadReport?: SideReadReport;
}

/** The side reads the live listener makes, by the name the Account State reports them under. */
export type SideReadName = 'charNames' | 'serverVars' | 'companion' | 'guild' | 'tournament';

export interface SideReadReport {
  /** Side reads that errored (network, permissions, timeout), not ones that were merely absent. */
  failed: SideReadName[];
}

export interface ParseOptions {
  /**
   * The moment to parse "as of". The parsers read the clock (timers, time away), so `Date` is frozen
   * to this value for the duration of the parse. Same envelope + same `now` = same output.
   */
  now: Date | number;
  /**
   * What happens to Toolbox `console.error` messages that are not section failures: `'truncated'`
   * (the default, for production) passes on at most 200 characters of text and never an object dump,
   * so a save can't end up in a DevTools screenshot; `'full'` passes them on as they are (development).
   */
  consoleErrors?: 'truncated' | 'full';
}

export interface ParsedSave {
  /** Toolbox's account object (~107 systems). Empty `{}` when the parse failed. */
  account: Record<string, unknown>;
  /** Toolbox's characters. Characters with no save data come back as stubs without `class`. */
  characters: Record<string, unknown>[];
  /**
   * Parser sections that threw and fell back (Toolbox's `safeSection`) on their last run, each once,
   * in the order they first ran. A weak signal: most patch breakage doesn't throw.
   */
  failedSections: string[];
  /** The top-level error `parseData()` caught and swallowed, if any (then `account` is `{}`). */
  error: string | null;
  meta: {
    /** The frozen clock used for this parse (epoch ms). */
    now: number;
    /** The save's own format version (`CSver`), if present. */
    saveVersion: number | null;
    /** `RawSaveEnvelope.lastUpdated`, if present. */
    capturedAt: number | null;
    /** The game version the parser pin targets (`UpstreamPin.gameVersion`). */
    parserGameVersion: string;
    /** The Toolbox commit of the parser pin (`UpstreamPin.commit`). */
    parserCommit: string;
  };
}

/** The Toolbox commit the vendored parsers come from (the `UPSTREAM` file). */
export interface UpstreamPin {
  repo: string;
  commit: string;
  commitDate: string;
  toolboxVersion: string;
  /** The game version Toolbox's patch notes tag this commit with, e.g. "2.3.540". */
  gameVersion: string;
}

/**
 * The newest game builds this parser pin has parsed cleanly: the highest server build (`GameVERSION`)
 * and save format (`CSver`) among the public fixtures that parse with no failed section. Written by
 * `scripts/verified-builds.mjs` during the parser sync and shipped in the bundle (FR-29).
 */
export interface VerifiedBuilds {
  serverBuild: number;
  saveVersion: number;
}

/** One character's kill rate on one map, from `toolboxCalls.frontierRates` (M2 TR-2). */
export interface MapKillRate {
  characterIndex: number;
  finalKillsPerHour: number;
  /** Unfloored, for M2 FR-13 ordering only. */
  killsPerHour: number;
  /** % 0..100, Toolbox's unit. */
  hitChance: number;
  /** % 0..100, Toolbox's unit. */
  survivability: number;
}

/** The part of Toolbox's `account.bubba` (parsers/clickers/bubba.ts) that M23 X1 reads. */
export interface ToolboxBubba {
  /** 28 upgrades, by index: `realLV` (level + prestige), `bonus` (TotUpgBonus), `cost` (UpgCost). */
  upgrades: Array<{ level: number; realLV: number; bonus: number; cost: number }>;
  /** MeatsliceRate per minute. */
  meatsliceRate: number;
  /** The seven Bubba Boon bonuses (BubbaRoG_Bonuses 1..7), keyed buildRate ... atomCost. */
  bonuses: Record<string, { bonus: number }>;
  totalUpgTypesAvailable: number;
  megafleshOwned: number;
}

/** Game tables for M23 X1, from Toolbox's game data (`generalSpelunky`). */
export interface ToolboxBubbaTables {
  /** Spelunky[36]: the six Charisma attributes (Hustle ... Savvy). */
  charismaNames: string[];
  /** Spelunky[37]: each attribute's bonus per level. */
  charismaPerLevel: number[];
  /** Spelunky[41]: each gift's passive bonus. */
  giftPassive: number[];
  /** Toolbox's exported SMOKER_MAX_QUALITY_SECONDS, for the drift test. */
  smokerMaxQualitySeconds: number;
}

/** Toolbox runtime functions beyond `parseData()`, injected by the parse worker (see src/calls.ts). */
export interface ToolboxCalls {
  /** Toolbox's damage and kill-rate math for one character, as Toolbox's own types (untyped) return it. */
  getMaxDamage(character: unknown, characters: unknown[], account: unknown): Record<string, unknown>;
  /** M2 TR-2: every character's kill rate on `mapIndex`, through the clone, at `parsed.meta.now`. */
  frontierRates(parsed: ParsedSave, mapIndex: number): MapKillRate[];
  /** M2 TR-2: the clone of a Toolbox character moved to `mapIndex`. */
  onMap(character: Record<string, unknown>, mapIndex: number): Record<string, unknown>;
  // ---- M3 AFK Safety (TR-2): Toolbox's own functions, unmodified; untyped in, untyped out ----
  getAfkGain(character: unknown, characters: unknown[], account: unknown): unknown;
  getDropRate(character: unknown, account: unknown, characters: unknown[]): unknown;
  /** Anvil production and stats (anvilSpeed, anvilCapacity) for one character. */
  getPlayerAnvil(character: unknown, characters: unknown[], account: unknown): unknown;
  /** Seconds until an anvil product caps (`fromZero`: from empty). */
  getTimeTillCap(args: Record<string, unknown>): unknown;
  /** Seconds (48 h plus stamps). */
  getMaxClaimTime(account: unknown): unknown;
  getSaltMatsTimeLeft(account: unknown, characters: unknown[]): unknown;
  getPrayerBonusAndCurse(prayers: unknown, prayerName: string, account?: unknown): unknown;
  /** `{ value }`: the carry cap for an item's `typeGen`. */
  getItemCapacity(type: unknown, character: unknown, account?: unknown): unknown;
  /** Food effect multiplier (`isHealth`: the health-food one), M3 R-FOOD-1. */
  getPlayerFoodBonus(character: unknown, account: unknown, isHealth?: boolean): unknown;
  // ---- M8 Collections (TR-15) ----
  /** Toolbox `getCardSets(account)`: per set name, `{ name, rawName, effect, bonus, totalStars, stars }` (stars = tier − 1). */
  getCardSets(account: unknown): Record<string, unknown>;
  /** Stock by shop index from raw `ShopStock`, paired with Toolbox's shop item lists; null when malformed. */
  shopStockAll(rawShopStock: unknown): Array<Array<{ rawName: string; amount: number }>> | null;
  // ---- M7 Spend Plan (TR-1, TR-4) ----
  /** Per-level Vault costs from re-running `parseUpgradeVault` on cloned levels (raw `UpgVault`). */
  vaultLadders(parsed: ParsedSave, rawLevels: readonly number[], depth?: number): VaultCostRun[];
  /** Every stamp re-evaluated by `updateStamps(account, characters, gilded, reducer, undefined, true)`. */
  stampEvaluations(parsed: ParsedSave, gilded: boolean, reducer?: number): StampEvaluation[];
  // ---- M14 Walkthroughs & Parallel Slot Plans (TR-2) ----
  /** `{ value }`: a skill's efficiency ('mining', 'chopping', 'fishing', 'catching'), as equipped. */
  getSkillEfficiency(
    skill: string,
    character: unknown,
    characters: unknown[],
    account: unknown,
    playerInfo: unknown,
  ): unknown;
  /** `{ value }`: the 3D Printer multi for the account. */
  getPrinterMulti(account: unknown, characters: unknown[]): unknown;
  /** An item's display name from Toolbox's game data ("Forest_Fibres"); null when the pin doesn't know it. */
  itemDisplayName(rawName: string): string | null;
  // ---- M15 Account depth (TR-1): Refinery set-up, build this next, the Talent Book Library ----
  /** Per salt, in Refinery order: `saltMaxSafeRank` (the predecessor limit) and the printer-capped `maxSafeRank`. */
  getSaltsBalance(account: unknown, characters: unknown[]): unknown;
  /** `{ timeLeft, totalTime, ready }`: epoch ms when the salt's bar is full (call inside withFrozenClock). */
  calcTimeToRankUp(
    account: unknown,
    characters: unknown[],
    lastUpdated: number,
    refineryData: unknown,
    includeSquireCycles: boolean,
    rank: number,
    powerCap: number,
    refined: number,
    index: number,
  ): unknown;
  /** Build progress a Construction building needs for its next level (game TowerBuildReq). */
  getBuildCost(towers: unknown, level: number, bonusInc: number, index: number): number;
  /** `{ minBookLv, maxBookLv }`: the Talent Book Library's book level range. */
  getBookLvRange(account: unknown): unknown;
  // ---- M24 World 4 (read-only pages) ----
  /** Toolbox `getChipsAndJewels`: per week from the save's, `{ items: [chip, chip, jewel], date }` (chips and jewel are Toolbox objects with `name`). */
  getChipsAndJewels(account: unknown, weeks: number): unknown;
  // ---- M20 Skills, Parallel Slots and the Daily & Weekly Checklist (TR-1) ----
  /** Killroy room classes ("Warrior", ...) for this account week (index 0) and the next (1), `rooms` rooms each. */
  killroyWeeks(account: unknown, characters: unknown[], rooms: number): { classes: string[] }[];
  /** The next Random Events from the current hour (Toolbox `getRandomEvents`), each with its map's world (1-3, 0 unknown). */
  randomEventSchedule(account: unknown): { at: number; map: string; event: string; world: number }[];
  // ---- M4 Purpose & Milestones (TR-2) ----
  /** Toolbox `getClassExpMulti(character, account, characters).value`; null when not a finite number. */
  classExpMulti(character: unknown, account: unknown, characters: unknown[]): number | null;
  /** A monster's base class EXP per kill (`monsters.json` `ExpGiven`); null for an unknown id. */
  monsterExpGiven(rawName: string): number | null;
  // ---- M19 Alchemy (TR-1) ----
  /**
   * Toolbox `getBubbleUpgradeCost` with no discounts: what one material (`rawName`, a `Liquid<n>`, or an item)
   * costs to take a bubble from `level` to `level + 1`. Every discount is a factor of at most 1, so this is
   * an upper bound of the game's price (M19 F-b).
   */
  bubbleCost(rawName: string, bubbleIndex: number, level: number, baseCost: number): number;
  // ---- M21 Redesign (TR-3, FR-C9) ----
  /**
   * Toolbox `calcTotalStarTalent` on this character alone: the star tab's point total for its active
   * preset, or (`'other'`) for its other preset, from a copy carrying `talentPreset.flatTalents` and
   * `.flatStarTalents`. null without an other preset or a finite result. Throws what Toolbox throws.
   */
  starTotal(character: unknown, account: unknown, preset: 'active' | 'other'): number | null;
  // ---- Exact talent points (ADR 0010) ----
  /**
   * The Toolbox-computed terms of the game's `_customBlock_TotalTalentPoints` for one preset, by term id
   * (bubble, vial1..4, starSign1, stamp1..5, flurbo, arcade16, shiny1..4, vault1/6/40, companion20,
   * t44/t119/t299/t494/t34/t45y/t8/t17/t622, and the W6/W7 class terms). null without that preset.
   * Throws what Toolbox throws.
   */
  talentPointTerms(
    character: unknown,
    account: unknown,
    preset: 'active' | 'other',
  ): Record<string, number> | null;
  // ---- M23 X1 (ADR 0010): Bubba's next-step values ----
  /** Toolbox `getBubba` on a raw Bubba record (possibly edited by the caller); null when it isn't an array. */
  bubbaParse(rawBubba: unknown, account: unknown): ToolboxBubba | null;
  /** The Charisma and gift tables, and Toolbox's Smoker cap constant. */
  bubbaTables(): ToolboxBubbaTables;
}

/** M7 TR-4: one Vault row's Toolbox `cost` at levels L, L+1, ... (`costs[0]` is the parse's `cost`). */
export interface VaultCostRun {
  index: number;
  costs: number[];
}

/** M7 TR-4: one stamp from the worker re-evaluation, the fields the Spend Plan reads. */
export interface StampEvaluation {
  rawName: string;
  /** Toolbox `displayName`, e.g. "Sword_Stamp". */
  name: string;
  level: number;
  maxLevel: number;
  /** reqItemMultiplicationLevel. */
  capStep: number;
  /** Next coin level (Toolbox `goldCost`). */
  goldCost: number;
  /** Toolbox `getGoldCostToMaxLevel`. */
  coinsToCap: number;
  /** Item rawName. */
  material: string;
  /** The material's Toolbox name, e.g. "Spore_Cap". */
  materialName: string;
  /** An equipment item: Toolbox checks its craft ingredients, not the item itself (FR-10). */
  equip: boolean;
  materialCost: number;
  ownedMats: number;
  hasMaterials: boolean;
  enoughPlayerStorage: boolean;
  /** `getMinReduction(...).reduction`; null when even 90% leaves it too big. */
  minReduction: number | null;
  /** `bestCharacter.topCharacters` (names; the adapter joins them to indices and drops the names). */
  topCharacters: { character: string; maxCapacity: number }[];
  /** `futureCosts[0]`. */
  next: { level: number; goldCost: number; reduction: number } | null;
}
