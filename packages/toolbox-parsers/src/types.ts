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
}
