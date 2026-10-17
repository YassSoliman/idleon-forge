// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Stands in for Toolbox's @parsers/safeSection with the same behaviour (run the section, fall back on
// a throw or on null/undefined, log the throw), and also reports every outcome, success included.
// parseData runs its dynamic sections three times; only the outcome of the last run of each section
// says whether it really failed, and console.error alone can't tell a pass-1 failure that recovered
// from one that never did. See src/section-outcomes.ts.

export type SectionReporter = (name: string, ok: boolean) => void;

let reporter: SectionReporter | null = null;

/** Set while one parse runs (parsing is synchronous), cleared afterwards. */
export function setSectionReporter(next: SectionReporter | null): void {
  reporter = next;
}

export const safeSection = <T>(name: string, fallback: T, fn: () => T): T => {
  try {
    const result = fn();
    reporter?.(name, true);
    return result === undefined || result === null ? fallback : result;
  } catch (err) {
    reporter?.(name, false);
    console.error(`[parsers] section "${name}" failed, using fallback:`, err);
    return fallback;
  }
};
