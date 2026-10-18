// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 F-a, FR-3: the four reset clocks, projected to `now` (docs/specs/M20-skills-parallel-slots.md). The
// daily reset is M6 TR-6's (`ShopRestock`, 24 h steps); the account week ends `ShopRestock + 86400 ×
// OLA[39]` seconds after the save, in 7-day steps; the server week starts Thursday 00:00 UTC (the Unix
// epoch was a Thursday); the Bonus Ballot week is `floor((t + 197860 s) / 1 week)`. Pure.
import { type AccountState, dailyResetAfter, resetsSinceSave } from '@idleon-forge/account-state';

export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;
/** checklist.fact.clocks `ballotOffsetSeconds` (N.js @11766234): the ballot rolls Monday about 17:02 UTC. */
export const BALLOT_OFFSET_MS = 197_860_000;

/** The account week's first end after the save, or null without a save time, countdown or OLA[39]. */
export function firstAccountWeekEnd(state: AccountState): number | null {
  const saved = state.account.lastCloudSave;
  const restock = state.account.dailyResetInSeconds;
  const days = state.account.resets?.weeklyOffsetDays;
  if (saved === null || restock === null || days === null || days === undefined) return null;
  return saved + Math.round((restock + 86_400 * days) * 1000);
}

/** The end of the account week that holds `t` (strictly after `t`). */
export function accountWeekEnd(state: AccountState, t: number): number | null {
  const first = firstAccountWeekEnd(state);
  if (first === null) return null;
  return first > t ? first : first + (Math.floor((t - first) / WEEK_MS) + 1) * WEEK_MS;
}

/** Account weekly resets between the save and `t`. */
export function accountWeeksSinceSave(state: AccountState, t: number): number | null {
  const first = firstAccountWeekEnd(state);
  if (first === null) return null;
  return t < first ? 0 : Math.floor((t - first) / WEEK_MS) + 1;
}

/** The server week index of `t` (OLA[191]'s unit). */
export const serverWeekOf = (t: number) => Math.floor(t / WEEK_MS);
/** When the server week holding `t` ends: the next Thursday 00:00 UTC. */
export const serverWeekEnd = (t: number) => (serverWeekOf(t) + 1) * WEEK_MS;
/** The Bonus Ballot week index of `t` (OLA[309]'s unit). */
export const ballotWeekOf = (t: number) => Math.floor((t + BALLOT_OFFSET_MS) / WEEK_MS);
/** When the ballot week holding `t` ends. */
export const ballotWeekEnd = (t: number) => (ballotWeekOf(t) + 1) * WEEK_MS - BALLOT_OFFSET_MS;

export { dailyResetAfter, resetsSinceSave };

/**
 * FR-15: an integer per period, for the manual tick's key. A period end rounded to whole periods, so the
 * few seconds `ShopRestock` drifts between saves (the 1 h tolerance) never changes it.
 */
export const periodIndex = (end: number, length: number) => Math.round(end / length);
