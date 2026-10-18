// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 TR-15 format guard (FR-F6, DS-6): one time language. No component formats a duration, a clock time
// or a date itself; they go through design/format.ts. Allowed: non-display arithmetic (the report's hours,
// the retry hours, the worker) and, until area N moves them onto the formatter, today's display uses.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(import.meta.dirname, '../src');

/** What a component must not do itself. */
const RULES: { name: string; re: RegExp }[] = [
  { name: 'toLocaleTimeString', re: /\.toLocaleTimeString\(/ },
  { name: 'toLocaleDateString', re: /\.toLocaleDateString\(/ },
  // A number's toLocaleString('en-US') is fine; a date's is a clock time.
  { name: 'toLocaleString on a date', re: /(new Date\([^)]*\)|\bDate\b[^;]*)\.toLocaleString\(/ },
  { name: 'hand-rolled / 3600', re: /\/\s*3_?600\b/ },
];

/** The formatter itself. */
const FORMATTER = 'design/format.ts';

/** Non-display arithmetic: never formats a time for a player to read. These stay. */
const NON_DISPLAY: readonly (string | RegExp)[] = [
  'suggestions/context.ts', // the report's Expected Return in hours (M13 context)
  'suggestions/client.ts', // the retry-after hours of a rate limit
  /^worker\//,
];

/**
 * SHRINKING: today's display uses, allowed only so CI is green on Phase F's merge. Area N moves each onto
 * design/format.ts and deletes its line; Integration (FR-I3) checks only NON_DISPLAY is left. A line whose
 * file no longer matches fails below, so the list can only shrink.
 */
const DISPLAY_TODAY: readonly string[] = [
  'App.tsx', // the footer's clock
  'components/CantRead.tsx', // "Last good save: … (09:12)"
  'components/Header.tsx', // the save-age chip's title
  'suggestions/Panel.tsx', // timeText and the date of a filed suggestion
  'format.ts', // formatAge
];

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(path.join(dir, d.name)) : /\.tsx?$/.test(d.name) ? [path.join(dir, d.name)] : [],
  );

const files = walk(SRC).map((abs) => path.relative(SRC, abs).split(path.sep).join('/'));
const hits = (rel: string): string[] => {
  const text = readFileSync(path.join(SRC, rel), 'utf8');
  return text.split('\n').flatMap((line, n) =>
    // Comments don't format anything.
    /^\s*(\/\/|\*|\/\*)/.test(line)
      ? []
      : RULES.filter((r) => r.re.test(line)).map((r) => `${rel}:${n + 1} ${r.name}`),
  );
};
const allowed = (rel: string) =>
  rel === FORMATTER ||
  NON_DISPLAY.some((a) => (typeof a === 'string' ? a === rel : a.test(rel))) ||
  DISPLAY_TODAY.includes(rel);

describe('format guard (TR-15)', () => {
  it('no component formats a duration, a clock time or a date itself', () => {
    expect(files.filter((f) => !allowed(f)).flatMap(hits)).toEqual([]);
  });

  it('the display allowlist only shrinks: every listed file still has a use to move', () => {
    expect(DISPLAY_TODAY.filter((f) => !files.includes(f) || hits(f).length === 0)).toEqual([]);
  });

  it('catches the patterns it names', () => {
    const t = (s: string) => RULES.some((r) => r.re.test(s));
    expect(t('new Date(at).toLocaleTimeString()')).toBe(true);
    expect(t("d.toLocaleDateString([], { month: 'short' })")).toBe(true);
    expect(t('title={new Date(saved).toLocaleString()}')).toBe(true);
    expect(t('`${Math.floor(s / 3600)}h`')).toBe(true);
    expect(t("n.toLocaleString('en-US')")).toBe(false);
  });
});
