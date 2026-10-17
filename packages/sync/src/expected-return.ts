// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The learned Expected Return (M3 FR-2, D5 and Yasser's RT-6 ruling), computed from M1's Play
// Sessions. M3's `resolveExpectedReturn` puts the player's choice and the 8 h default around it.
//
//   1. Gaps are the time between the end of one Play Session and the start of the next, over the last
//      30 days. With fewer than 3 gaps there is no learned value.
//   2. Keep the gaps whose leaving time of day is within ±2 h of the current local time of day. With
//      3 or more, the value is the median of the last 10 kept gaps.
//   3. Otherwise (RT-6) it is the larger of 8 h and the 75th percentile of the last 10 gaps, so a
//      short daytime gap can never become the overnight answer.
//   4. Round up to a whole hour, at least 1 h.
// The engine never reads the clock or the locale: `now` and the time-zone offset are inputs.
import type { PlaySession } from './history';

export const HOUR_MS = 3600 * 1000;
export const DEFAULT_EXPECTED_RETURN_MS = 8 * HOUR_MS;
export const TIME_OF_DAY_WINDOW_MS = 2 * HOUR_MS;
const DAY_MS = 24 * HOUR_MS;
const WINDOW_GAPS = 10;
const MIN_GAPS = 3;
const LOOKBACK_MS = 30 * DAY_MS;

export interface ReturnGap {
  /** When the player left: the last save of the Play Session (epoch ms). */
  leftAt: number;
  /** How long until the next Play Session started (ms). */
  gapMs: number;
}

/** Gaps between consecutive Play Sessions (oldest first), within 30 days of `now`. */
export function returnGaps(sessions: PlaySession[], now: number): ReturnGap[] {
  const gaps: ReturnGap[] = [];
  for (let i = 1; i < sessions.length; i++) {
    const prev = sessions[i - 1];
    const next = sessions[i];
    if (!prev || !next || prev.end < now - LOOKBACK_MS) continue;
    gaps.push({ leftAt: prev.end, gapMs: next.start - prev.end });
  }
  return gaps;
}

/** Minutes east of UTC at an instant (local = UTC + offset). A function handles DST changes. */
export type TimeZoneOffset = number | ((at: number) => number);

/** The browser's own offset at an instant, for callers outside the engine. */
export const localOffsetAt = (at: number): number => -new Date(at).getTimezoneOffset();

const timeOfDay = (at: number, offset: TimeZoneOffset) => {
  const min = typeof offset === 'function' ? offset(at) : offset;
  return (((at + min * 60_000) % DAY_MS) + DAY_MS) % DAY_MS;
};

const median = (values: number[]) => {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
};

/** Nearest-rank percentile (p in 0..1). */
const percentile = (values: number[], p: number) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil(p * s.length) - 1)] ?? 0;
};

const roundUpToHour = (ms: number) => Math.max(HOUR_MS, Math.ceil(ms / HOUR_MS) * HOUR_MS);

export interface LearnedReturn {
  /** The learned Expected Return (ms, whole hours), or null without enough history. */
  learnedMs: number | null;
  /** Which rule produced it. */
  basis: 'time-of-day' | 'all-gaps' | null;
  /** The gaps the value was taken from. */
  gapsUsed: number;
}

export function learnedExpectedReturn(input: {
  sessions: PlaySession[];
  now: number;
  timeZoneOffsetMin: TimeZoneOffset;
}): LearnedReturn {
  const gaps = returnGaps(input.sessions, input.now);
  if (gaps.length < MIN_GAPS) return { learnedMs: null, basis: null, gapsUsed: 0 };
  const current = timeOfDay(input.now, input.timeZoneOffsetMin);
  const near = gaps.filter((g) => {
    const d = Math.abs(timeOfDay(g.leftAt, input.timeZoneOffsetMin) - current);
    return Math.min(d, DAY_MS - d) <= TIME_OF_DAY_WINDOW_MS;
  });
  if (near.length >= MIN_GAPS) {
    const used = near.slice(-WINDOW_GAPS).map((g) => g.gapMs);
    return { learnedMs: roundUpToHour(median(used)), basis: 'time-of-day', gapsUsed: used.length };
  }
  const used = gaps.slice(-WINDOW_GAPS).map((g) => g.gapMs);
  const value = Math.max(DEFAULT_EXPECTED_RETURN_MS, percentile(used, 0.75));
  return { learnedMs: roundUpToHour(value), basis: 'all-gaps', gapsUsed: used.length };
}
