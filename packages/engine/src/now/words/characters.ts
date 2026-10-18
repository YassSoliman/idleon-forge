// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-7: the Characters area's view words (area C).
export const CHARACTERS_WORDS = {
  title: 'Characters',
  overviews: 'Every character',
  /**
   * The Build path (fix/build-points, M21 FR-C1, FR-C2). Tabs 1–3 only know a lower bound of unspent
   * points, so the marker says "at least" and "as of your last save", and a bound of 0 says no points
   * are known, never that none wait.
   */
  buildPath: {
    heading: 'Build steps',
    knownEnd: 'they end here',
    knownPrefix: 'As of your last save: at least',
    knownSuffix: 'points waiting',
    noneKnown: 'No unspent points known from your last save: the totals show where new points go',
    band: {
      done: 'done',
      now: 'can add now',
      part: 'part now',
      next: 'next after these',
      later: 'later',
    },
  },
} as const;

/** "As of your last save: at least 70 points waiting · they end here". */
export function buildKnownLine(points: number): string {
  const w = CHARACTERS_WORDS.buildPath;
  return `${w.knownPrefix} ${points.toLocaleString('en-US')} ${w.knownSuffix} · ${w.knownEnd}`;
}

/** A "part now" step: "+20 of 100 now". */
export function buildPartLine(now: number, need: number): string {
  return `+${now.toLocaleString('en-US')} of ${need.toLocaleString('en-US')} now`;
}
