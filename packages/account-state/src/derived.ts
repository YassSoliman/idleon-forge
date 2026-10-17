// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Small, pure readings of an Account State that several modules need and that depend on the clock:
// which character the player is on, the next daily reset, and what a report may carry.
import type { AccountState } from './types';

/**
 * How fresh the last cloud save must be for the last-played character to count as the one being
 * played now (M1 FR-19: M10 opens that row on its own only while the save is under 5 minutes old).
 */
export const ACTIVE_CHARACTER_FRESH_MS = 5 * 60_000;

/**
 * The character the player is on now: `lastPlayedCharacterIndex` while the last cloud save is under
 * `freshMs` old at `now`, else null (a tie, an unknown save time, or the game probably closed).
 * Null never means "nobody": it means "don't act on it" (don't open a row, don't count a switch).
 */
export function activeCharacterIndex(
  state: AccountState,
  now: number,
  freshMs = ACTIVE_CHARACTER_FRESH_MS,
): number | null {
  const saved = state.account.lastCloudSave;
  if (saved === null || state.lastPlayedCharacterIndex === null) return null;
  return now - saved < freshMs ? state.lastPlayedCharacterIndex : null;
}

/** The game's daily reset repeats every 24 h. */
export const DAILY_RESET_PERIOD_MS = 24 * 3600 * 1000;

/**
 * The next game daily reset after `now` (epoch ms): `lastCloudSave + dailyResetInSeconds`, rolled
 * forward in 24 h steps until it is after `now` (the rolling rule M6 TR-3 uses). Null only when the
 * save has no countdown or no save time. For M10's Skip today rule (M10 D3).
 */
export function nextDailyReset(state: AccountState, now: number): number | null {
  const { lastCloudSave, dailyResetInSeconds } = state.account;
  if (lastCloudSave === null || dailyResetInSeconds === null) return null;
  const at = lastCloudSave + Math.round(dailyResetInSeconds * 1000);
  if (at > now) return at;
  return at + (Math.floor((now - at) / DAILY_RESET_PERIOD_MS) + 1) * DAILY_RESET_PERIOD_MS;
}

/**
 * The Account-State part of a Suggestion or Report this context (M1 TR-22, M13 `SuggestionContext`,
 * ADR 0008): the save's server build, its age, and the class and level of the character in question.
 * Nothing else: never names, uid, email, `charNames`, the save, or `diagnostics.failedSections`.
 */
export interface AccountReportFields {
  /** `account.gameVersion.serverBuild`. */
  gameBuild: number | null;
  /** Seconds between the last cloud save and `now`, never negative; null without a save time. */
  saveAgeSeconds: number | null;
  /** The character in question; null when none is given or the slot isn't a readable character. */
  character: { class: string; level: number } | null;
}

export function accountReportFields(
  state: AccountState,
  characterIndex: number | null = null,
  now: number = state.asOf,
): AccountReportFields {
  const saved = state.account.lastCloudSave;
  const c = characterIndex === null ? undefined : state.characters.find((x) => x.index === characterIndex);
  return {
    gameBuild: state.account.gameVersion.serverBuild,
    saveAgeSeconds: saved === null ? null : Math.max(0, Math.floor((now - saved) / 1000)),
    character: c ? { class: c.class, level: c.level } : null,
  };
}
