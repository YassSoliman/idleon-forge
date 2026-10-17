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
}

export interface ParseOptions {
  /**
   * The moment to parse "as of". The parsers read the clock (timers, time away), so `Date` is frozen
   * to this value for the duration of the parse. Same envelope + same `now` = same output.
   */
  now: Date | number;
}

export interface ParsedSave {
  /** Toolbox's account object (~107 systems). Empty `{}` when the parse failed. */
  account: Record<string, unknown>;
  /** Toolbox's characters. Characters with no save data come back as stubs without `class`. */
  characters: Record<string, unknown>[];
  /** Parser sections that threw and fell back (Toolbox's `safeSection`), in order. */
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
