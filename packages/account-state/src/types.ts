// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account State (see GLOSSARY.md): a normalized snapshot of one player's account at the moment of
// a cloud save. It grows as the advice engine needs more (M1 TR-11: add the field here with its
// Toolbox source, read it in adapter.ts only, declare it in fields.ts, bump SCHEMA_VERSION).
// String identifiers (class, map, AFK target, food) are Toolbox's, e.g. "Siege_Breaker"; use
// `humanize()` to display them.
import type { SideReadName } from '@idleon-forge/toolbox-parsers';

/**
 * Bumped whenever a field is added, renamed or changes meaning. 1 was slice 1's unversioned shape.
 * 3: `account.dailyResetAt` (for M10's Skip today rule).
 */
export const SCHEMA_VERSION = 3;

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

export interface CharacterState {
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
}

export interface AccountSummary {
  /** The world the account is working on (1-based): one past the highest finished world (Toolbox's rule). */
  currentWorld: number | null;
  /** Worlds whose exit has been used (a character met the gatekeeper past it), ascending. */
  finishedWorlds: number[];
  /** When the account last cloud-saved (epoch ms), from the save's own clock (`TimeAway.GlobalTime`). */
  lastCloudSave: number | null;
  /** Seconds between `lastCloudSave` and `AccountState.asOf` (never negative). */
  secondsSinceLastSave: number | null;
  /**
   * When the game's daily reset that this save was counting down to happens (epoch ms):
   * `TimeAway.GlobalTime + TimeAway.ShopRestock`. The time of day differs per account. Read it with
   * `nextDailyReset(state, now)`, which rolls it forward in 24 h steps.
   */
  dailyResetAt: number | null;
  gameVersion: {
    /** The game server's build (`_vars.GameVERSION`) at the last `_vars` read, e.g. 142; not in the save. */
    serverBuild: number | null;
    /** The save format version (`CSver`). */
    saveVersion: number | null;
    /** The game version the parser pin targets, e.g. "2.3.540". */
    parserTarget: string;
  };
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
