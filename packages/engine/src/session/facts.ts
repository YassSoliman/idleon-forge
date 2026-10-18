// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-11, V-6: what the save history says about Play Sessions, for the pause points (FR-N6) and the
// Away card (FR-N7). Pure: it reads M1's history entries (oldest first) and the save being shown.
//
// - A Play Session is a run of saves with no gap of `SESSION_GAP_MS` (15 min, M1 `PLAY_SESSION_GAP_MS`)
//   or more. `sessionStartedAt` is M1's `sessionStart`, passed in by the caller (the worker).
// - The previous Play Session ended at the last save before this one started: M9's baseline save
//   (`builds/module.ts` `levelUpSignal`), which M1's engine history keeps whole for exactly this.
// - Level gains compare that baseline with the save being shown, per character (M9 FR-12a's rule).
import type { AccountState } from '@idleon-forge/account-state';
import type { EngineHistory } from '../core/module';
import { SESSION_GAP_MS } from '../now/prefs';
import type { SessionFacts } from '../result';

/** The medians use the last 10 finished Play Sessions; fewer than 3 is no history (FR-N6). */
export const MEDIAN_SESSIONS = 10;
export const MEDIAN_MIN_SESSIONS = 3;

/** [start, end] of every Play Session in `times` (cloud-save times, any order). */
export function sessionRanges(times: readonly number[]): [number, number][] {
  const sorted = [...times].sort((a, b) => a - b);
  const out: [number, number][] = [];
  for (const t of sorted) {
    const last = out[out.length - 1];
    if (last && t - last[1] < SESSION_GAP_MS) last[1] = t;
    else out.push([t, t]);
  }
  return out;
}

const median = (xs: readonly number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

export function sessionFacts(state: AccountState, history: EngineHistory): SessionFacts {
  const start = history.sessionStartedAt;
  const entries = history.entries;
  const baseline = start === null ? undefined : [...entries].reverse().find((e) => e.lastCloudSave < start);
  // Finished Play Sessions only: the one still running never counts toward the median.
  const earlier = entries.map((e) => e.lastCloudSave).filter((t) => start === null || t < start);
  const finished = sessionRanges(earlier).slice(-MEDIAN_SESSIONS);
  const medianSessionMs =
    finished.length >= MEDIAN_MIN_SESSIONS ? median(finished.map(([a, b]) => b - a)) : null;
  const levelGains: SessionFacts['levelGains'] = [];
  for (const c of state.characters) {
    const was = baseline?.state.characters.find((x) => x.index === c.index);
    if (was && c.level > was.level)
      levelGains.push({ characterIndex: c.index, from: was.level, to: c.level });
  }
  return {
    sessionStartedAt: start,
    previousSessionEndedAt: baseline?.lastCloudSave ?? null,
    medianSessionMs,
    levelGains,
  };
}
