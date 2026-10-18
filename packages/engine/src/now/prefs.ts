// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The player's Now-screen choices as plain data (M10 TR-8) and the pure rules over them. Storage
// (localStorage, cross-tab sync) lives in the app; these functions decide what is hidden and when.

/** Skip today (D3): until the next local midnight or the end of the Play Session, whichever is later. */
export interface SkipEntry {
  /** The next local midnight after the skip (epoch ms). */
  midnightAt: number;
  /** The Play Session the skip was made in; null in paste mode. */
  sessionStartedAt: number | null;
}

export interface NowPrefs {
  /** `NextAction.key`, `unknown@c<index>`, `unknown@account`, or a Spend Plan line key. */
  skips: Readonly<Record<string, SkipEntry>>;
  /** Not for me: key -> the game build it was dismissed at (null when unknown). */
  dismissals: Readonly<Record<string, number | null>>;
  /** Next Action keys seen while the window had focus (FR-34); null to skip the count. */
  seenKeys: readonly string[] | null;
  /**
   * M20 FR-15: Done ticks on checklist rows the save can't judge, `checklist@<rowId>@<periodIndex>` -> the
   * period's end (epoch ms). The prefs store is already per account, and a tick never outlives its period.
   */
  ticks?: Readonly<Record<string, number>>;
}

export const EMPTY_PREFS: NowPrefs = { skips: {}, dismissals: {}, seenKeys: null };

/** M20 FR-15: drops ticks whose period has ended, keeping at most `PREFS_CAP`. */
export function pruneTicks(ticks: Readonly<Record<string, number>>, now: number): Record<string, number> {
  return Object.fromEntries(
    Object.entries(ticks)
      .filter(([, end]) => end > now)
      .sort(([, a], [, b]) => a - b)
      .slice(-PREFS_CAP),
  );
}

/** M1 TR-15: a gap of 15 minutes with no cloud save ends a Play Session. */
export const SESSION_GAP_MS = 15 * 60_000;

/** The next local midnight after `at`, for a time-zone offset in minutes east of UTC. */
export function nextLocalMidnight(at: number, offsetMinutes: number): number {
  const day = 86_400_000;
  const local = at + offsetMinutes * 60_000;
  return Math.floor(local / day) * day + day - offsetMinutes * 60_000;
}

export interface SessionClock {
  now: number;
  /** The current Play Session (EngineResult.sessionStartedAt). */
  sessionStartedAt: number | null;
  /** The account's last cloud save: the session can end 15 minutes after it. */
  lastCloudSave: number | null;
}

/** When the current Play Session can end (last cloud save + 15 min), or null. */
export const sessionEndsAt = (c: SessionClock): number | null =>
  c.sessionStartedAt === null || c.lastCloudSave === null ? null : c.lastCloudSave + SESSION_GAP_MS;

/** D3: a skip holds while `now < midnightAt` or its Play Session is still the current one. */
export function skipActive(s: SkipEntry, c: SessionClock): boolean {
  if (c.now < s.midnightAt) return true;
  if (s.sessionStartedAt === null || s.sessionStartedAt !== c.sessionStartedAt) return false;
  const end = sessionEndsAt(c);
  return end === null || c.now < end;
}

/** When an active skip stops holding (assuming no new save). */
export function skipExpiresAt(s: SkipEntry, c: SessionClock): number {
  const end =
    s.sessionStartedAt !== null && s.sessionStartedAt === c.sessionStartedAt ? sessionEndsAt(c) : null;
  return Math.max(s.midnightAt, end ?? 0);
}

/**
 * FR-29: Not for me holds until the save's game build changes. A save with no known build keeps it
 * hidden, and so does a dismissal made while the build was unknown (it is re-stamped by `pruneDismissals`).
 */
export const dismissActive = (dismissedAt: number | null, build: number | null): boolean =>
  build === null || dismissedAt === null || dismissedAt === build;

/** Each preference map is capped at this many entries, oldest first out (TR-8). */
export const PREFS_CAP = 500;

/** Drops expired skips (TR-8 prune on load), keeping at most `PREFS_CAP`. */
export function pruneSkips(
  skips: Readonly<Record<string, SkipEntry>>,
  c: SessionClock,
): Record<string, SkipEntry> {
  const kept = Object.entries(skips)
    .filter(([, s]) => skipActive(s, c))
    .sort(([, a], [, b]) => a.midnightAt - b.midnightAt);
  return Object.fromEntries(kept.slice(-PREFS_CAP));
}

/**
 * Drops dismissals from another game build; a dismissal stamped with an unknown build takes the
 * current build once it is known, so it lasts until the next patch from there.
 */
export function pruneDismissals(
  dismissals: Readonly<Record<string, number | null>>,
  build: number | null,
): Record<string, number | null> {
  if (build === null) return { ...dismissals };
  const kept = Object.entries(dismissals)
    .filter(([, b]) => b === null || b === build)
    .map(([k]) => [k, build] as const);
  return Object.fromEntries(kept.slice(-PREFS_CAP));
}
