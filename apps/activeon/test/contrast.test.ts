// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// WCAG AA text contrast for the token pairs the UI puts text on (M10 TR-14), in both themes.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const css = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');
const [light = '', dark = ''] = css.split('@media (prefers-color-scheme: dark)');

/** `#fff` -> `#ffffff`. */
const long = (hex: string) => (hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex);
const tokens = (block: string): Record<string, string> =>
  Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gi)].map((m) => [m[1], long(m[2] ?? '')]),
  );

const luminance = (hex: string) => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

/** Text colour on background: the source label, Ready, Unknown/Stale pills and the save-age chips. */
const PAIRS = [
  ['coin', 'coin-soft'],
  ['ok', 'ok-soft'],
  ['unk', 'unk-soft'],
  ['bad', 'bad-soft'],
  ['fg', 'bg'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['coin', 'bg'],
] as const;

describe.each([
  ['light', tokens(light)],
  ['dark', { ...tokens(light), ...tokens(dark) }],
])('%s theme', (_theme, t) => {
  it.each(PAIRS)('--%s on --%s passes 4.5:1', (fg, bg) => {
    const [a, b] = [t[fg], t[bg]];
    if (!a || !b) throw new Error(`missing token ${fg} or ${bg}`);
    expect(ratio(a, b)).toBeGreaterThanOrEqual(4.5);
  });
});
