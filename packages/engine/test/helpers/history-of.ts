// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 RT-21: `historyOf(...)` makes M1 `HistoryEntry` lists (the engine's `EngineHistoryEntry`) from one
// fixture state, with shifted clocks and changed levels, for the pause-point and Away-card stories
// (US-5, FR-N6, FR-N7). It never reads a real history: every entry is a copy of `base` moved in time.
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineHistory, EngineHistoryEntry } from '../../src/core/module';

export interface HistoryStep {
  /** Minutes before `base`'s save that this earlier save was made (positive = earlier). */
  minutesBefore: number;
  /**
   * Class levels on this earlier save, by `CharacterState.index`. A character not listed keeps its level
   * from `base`, so a "levels gained" story lists only the characters it changes.
   */
  levels?: Readonly<Record<number, number>>;
  /** When the save reached the app; defaults to the save time (a live listener sees it at once). */
  receivedLagSeconds?: number;
}

const MINUTE = 60_000;

/** A copy of `state` whose save is `ms` earlier (asOf and lastCloudSave), with `levels` applied. */
export function shiftedState(
  state: AccountState,
  ms: number,
  levels: Readonly<Record<number, number>> = {},
): AccountState {
  const copy = structuredClone(state);
  copy.asOf -= ms;
  if (copy.account.lastCloudSave !== null) copy.account.lastCloudSave -= ms;
  for (const c of copy.characters) {
    const level = levels[c.index];
    if (level !== undefined) c.level = level;
  }
  return copy;
}

/**
 * Earlier saves of `base`, oldest first, as M1's SaveHistory hands them to the engine. Steps may come
 * in any order; each one's save time is `base`'s minus `minutesBefore`. Throws on a step at or after
 * `base` (history is only ever earlier saves) or without a cloud save time.
 */
export function historyOf(base: AccountState, steps: readonly HistoryStep[]): EngineHistoryEntry[] {
  const saved = base.account.lastCloudSave;
  if (saved === null) throw new Error('historyOf: the base state has no lastCloudSave');
  return steps
    .map((s) => {
      if (!(s.minutesBefore > 0)) throw new Error('historyOf: every step is before the base save');
      const ms = s.minutesBefore * MINUTE;
      const state = shiftedState(base, ms, s.levels);
      return {
        lastCloudSave: saved - ms,
        receivedAt: saved - ms + (s.receivedLagSeconds ?? 0) * 1000,
        state,
      };
    })
    .sort((a, b) => a.lastCloudSave - b.lastCloudSave);
}

/**
 * Saves every `everyMinutes` across a Play Session of `lengthMinutes` that ended `endedMinutesBefore`
 * the base save (a previous session, for "away 9h" stories), oldest first.
 */
export function sessionOf(opts: {
  endedMinutesBefore: number;
  lengthMinutes: number;
  everyMinutes?: number;
  levels?: Readonly<Record<number, number>>;
}): HistoryStep[] {
  const every = opts.everyMinutes ?? 5;
  const out: HistoryStep[] = [];
  for (let t = 0; t <= opts.lengthMinutes; t += every)
    out.push({
      minutesBefore: opts.endedMinutesBefore + opts.lengthMinutes - t,
      ...(opts.levels ? { levels: opts.levels } : {}),
    });
  return out;
}

/** An EngineHistory over `entries`, with the session start the caller names (M1 `sessionStart`). */
export const engineHistory = (
  entries: EngineHistoryEntry[],
  sessionStartedAt: number | null,
  learnedExpectedReturnSeconds: number | null = null,
): EngineHistory => ({ entries, sessionStartedAt, learnedExpectedReturnSeconds });
