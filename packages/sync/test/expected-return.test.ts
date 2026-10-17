// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The learned Expected Return (M3 FR-2, D5, RT-6 ruling; M3 US-3).
import { describe, expect, it } from 'vitest';
import { HOUR_MS, learnedExpectedReturn, type PlaySession, returnGaps } from '../src';

const H = HOUR_MS;
const DAY = 24 * H;
const BASE = Date.UTC(2026, 9, 1);

/** Play Sessions that each end at `leaveHour` (UTC) on successive days and return `gapH` later. */
function sessionsFrom(gaps: Array<{ leaveHour: number; gapH: number }>): PlaySession[] {
  const out: PlaySession[] = [];
  let start = BASE;
  gaps.forEach(({ leaveHour, gapH }, i) => {
    const end = BASE + i * 2 * DAY + leaveHour * H;
    out.push({ start: Math.min(start, end), end, saves: 3 });
    start = end + gapH * H;
  });
  out.push({ start, end: start + H, saves: 3 });
  return out;
}

const lastEnd = (s: PlaySession[]) => s.at(-1)?.end ?? 0;
/** A `now` on the day after the last session, at `hour` UTC. */
const nowAt = (s: PlaySession[], hour: number) => Math.floor(lastEnd(s) / DAY) * DAY + DAY + hour * H;

describe('learned Expected Return', () => {
  it('no history, or fewer than 3 gaps: no learned value', () => {
    expect(learnedExpectedReturn({ sessions: [], now: BASE, timeZoneOffsetMin: 0 }).learnedMs).toBeNull();
    const two = sessionsFrom([
      { leaveHour: 22, gapH: 9 },
      { leaveHour: 22, gapH: 9 },
    ]);
    expect(learnedExpectedReturn({ sessions: two, now: nowAt(two, 22), timeZoneOffsetMin: 0 })).toEqual({
      learnedMs: null,
      basis: null,
      gapsUsed: 0,
    });
  });

  it('M3 US-3: 4 of 10 gaps left within 2 h of now (8.5, 9, 9.2, 7.9 h): 9 h', () => {
    const sessions = sessionsFrom([
      { leaveHour: 13, gapH: 3 },
      { leaveHour: 22, gapH: 8.5 },
      { leaveHour: 14, gapH: 4 },
      { leaveHour: 23, gapH: 9 },
      { leaveHour: 12, gapH: 2 },
      { leaveHour: 21, gapH: 9.2 },
      { leaveHour: 15, gapH: 3.5 },
      { leaveHour: 22.5, gapH: 7.9 },
      { leaveHour: 11, gapH: 2.5 },
      { leaveHour: 16, gapH: 4.5 },
    ]);
    const r = learnedExpectedReturn({ sessions, now: nowAt(sessions, 22), timeZoneOffsetMin: 0 });
    expect(r).toEqual({ learnedMs: 9 * H, basis: 'time-of-day', gapsUsed: 4 });
  });

  it('the window wraps around midnight', () => {
    const sessions = sessionsFrom([
      { leaveHour: 23.5, gapH: 7 },
      { leaveHour: 0.5, gapH: 7 },
      { leaveHour: 23, gapH: 7.2 },
    ]);
    const r = learnedExpectedReturn({ sessions, now: nowAt(sessions, 0), timeZoneOffsetMin: 0 });
    expect(r.basis).toBe('time-of-day');
    expect(r.learnedMs).toBe(7 * H); // median of 7, 7 and 7.2 h
  });

  it('uses the local time of day through the injected offset', () => {
    // Left at 22:00 local in UTC-5 (03:00 UTC).
    const sessions = sessionsFrom([
      { leaveHour: 3, gapH: 10 },
      { leaveHour: 3, gapH: 10 },
      { leaveHour: 3, gapH: 10 },
    ]);
    const now = nowAt(sessions, 3); // 22:00 local
    expect(learnedExpectedReturn({ sessions, now, timeZoneOffsetMin: -300 }).basis).toBe('time-of-day');
    // A function offset (DST-aware) gives the same answer here.
    expect(learnedExpectedReturn({ sessions, now, timeZoneOffsetMin: () => -300 }).learnedMs).toBe(10 * H);
  });

  it('RT-6: with fewer than 3 matches, the larger of 8 h and the 75th percentile of all gaps', () => {
    // Daytime player, asked at bedtime: gaps of 3, 4 and 5 h, none left near 23:00.
    const short = sessionsFrom([
      { leaveHour: 12, gapH: 3 },
      { leaveHour: 14, gapH: 4 },
      { leaveHour: 16, gapH: 5 },
    ]);
    expect(learnedExpectedReturn({ sessions: short, now: nowAt(short, 23), timeZoneOffsetMin: 0 })).toEqual({
      learnedMs: 8 * H,
      basis: 'all-gaps',
      gapsUsed: 3,
    });
    // Long gaps: the 75th percentile (nearest rank) of 6, 9, 11, 13 h is 11 h.
    const long = sessionsFrom([
      { leaveHour: 12, gapH: 6 },
      { leaveHour: 14, gapH: 9 },
      { leaveHour: 16, gapH: 11 },
      { leaveHour: 10, gapH: 13 },
    ]);
    expect(
      learnedExpectedReturn({ sessions: long, now: nowAt(long, 23), timeZoneOffsetMin: 0 }).learnedMs,
    ).toBe(11 * H);
  });

  it('rounds up to a whole hour, at least 1 h', () => {
    const tiny = sessionsFrom([
      { leaveHour: 10, gapH: 0.3 },
      { leaveHour: 10, gapH: 0.3 },
      { leaveHour: 10, gapH: 0.3 },
    ]);
    expect(
      learnedExpectedReturn({ sessions: tiny, now: nowAt(tiny, 10), timeZoneOffsetMin: 0 }).learnedMs,
    ).toBe(H);
  });

  it('only gaps within the last 30 days count', () => {
    const sessions = sessionsFrom([
      { leaveHour: 22, gapH: 9 },
      { leaveHour: 22, gapH: 9 },
      { leaveHour: 22, gapH: 9 },
    ]);
    const now = lastEnd(sessions) + 40 * DAY;
    expect(returnGaps(sessions, now)).toEqual([]);
    expect(returnGaps(sessions, nowAt(sessions, 0))).toHaveLength(3);
  });
});
