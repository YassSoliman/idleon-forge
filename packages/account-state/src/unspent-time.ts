// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M6 TR-6 time arithmetic on a save's countdowns, shared by M6's Detectors (they may import only
// Account State and zod, so these live here). Pure: every function takes `now` or `t` explicitly.
import { DAILY_RESET_PERIOD_MS } from './derived';
import type { AccountState } from './types';

/** The first moment a countdown taken at the save ends: `lastCloudSave + seconds`. Null if either is unknown. */
export function countdownEnd(state: AccountState, seconds: number | null): number | null {
  const saved = state.account.lastCloudSave;
  if (saved === null || seconds === null) return null;
  return saved + Math.round(seconds * 1000);
}

/** How many 24 h events, the first at `first`, fall in `(from, to]`. 0 when `to < first`. */
export function eventsBetween(first: number, from: number, to: number): number {
  const count = (t: number) => (t < first ? 0 : Math.floor((t - first) / DAILY_RESET_PERIOD_MS) + 1);
  return Math.max(0, count(to) - count(from));
}

/** The first 24 h event at or after `first` that is strictly after `t`. */
export function nextEventAfter(first: number, t: number): number {
  if (first > t) return first;
  return first + (Math.floor((t - first) / DAILY_RESET_PERIOD_MS) + 1) * DAILY_RESET_PERIOD_MS;
}

/** Daily resets between the save and `t` (M6 TR-6 `resetsBefore(t)`); null without a save time or countdown. */
export function resetsSinceSave(state: AccountState, t: number): number | null {
  const first = countdownEnd(state, state.account.dailyResetInSeconds);
  const saved = state.account.lastCloudSave;
  if (first === null || saved === null) return null;
  return eventsBetween(first, saved, t);
}

/** The next daily reset strictly after `t`; null without a save time or countdown. */
export function dailyResetAfter(state: AccountState, t: number): number | null {
  const first = countdownEnd(state, state.account.dailyResetInSeconds);
  return first === null ? null : nextEventAfter(first, t);
}
