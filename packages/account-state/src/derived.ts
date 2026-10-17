// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Small, pure readings of an Account State that several modules need and that depend on the clock:
// which character the player is on, the next daily reset, and the context a report may carry.
import type { SideReadName } from '@idleon-forge/toolbox-parsers';
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
 * The next game daily reset after `now` (epoch ms): the reset the save was counting down to
 * (`account.dailyResetAt`), rolled forward in 24 h steps until it is after `now` (the rolling rule M6
 * uses). Null only when the save has no countdown. For M10's Skip today rule (M10 D3).
 */
export function nextDailyReset(state: AccountState, now: number): number | null {
  const at = state.account.dailyResetAt;
  if (at === null) return null;
  if (at > now) return at;
  return at + (Math.floor((now - at) / DAILY_RESET_PERIOD_MS) + 1) * DAILY_RESET_PERIOD_MS;
}

/**
 * The only facts about a save that may leave the device with a report or Suggestion (M1 TR-22): the
 * game and parser versions, which parser sections and side reads failed, and the class and level of
 * the character the report is about. Never names, uid, email or the save. Stage is added by M2.
 */
export interface ReportContext {
  gameVersion: { serverBuild: number | null; saveVersion: number | null; parserTarget: string };
  parserPin: { commit: string; gameVersion: string };
  failedSections: string[];
  failedSideReads: SideReadName[];
  character: { class: string; level: number } | null;
}

export function reportContext(state: AccountState, characterIndex: number | null = null): ReportContext {
  const { gameVersion } = state.account;
  const d = state.diagnostics;
  const c = characterIndex === null ? undefined : state.characters.find((x) => x.index === characterIndex);
  return {
    gameVersion: {
      serverBuild: gameVersion.serverBuild,
      saveVersion: gameVersion.saveVersion,
      parserTarget: gameVersion.parserTarget,
    },
    parserPin: { commit: d.parserPin.commit, gameVersion: d.parserPin.gameVersion },
    failedSections: [...d.failedSections],
    failedSideReads: [...d.failedSideReads],
    character: c ? { class: c.class, level: c.level } : null,
  };
}
