// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Authoring helpers for the sprite grids.

/** A grid from a block of text: one row per line, surrounding whitespace ignored. */
export const g = (block: string): string[] =>
  block
    .trim()
    .split('\n')
    .map((line) => line.trim());

/** The same grid with some material letters swapped (recolours one drawing). */
export const swap = (rows: readonly string[], map: Readonly<Record<string, string>>): string[] =>
  rows.map((row) => [...row].map((c) => map[c] ?? c).join(''));

/** Big round eyes: a 2x2 white with a pupil at the bottom-right, at (x, y) and (x2, y). */
export const eyes = (x: number, y: number, x2: number): string =>
  `W:${x},${y} ${x + 1},${y} ${x},${y + 1} ${x2},${y} ${x2 + 1},${y} ${x2},${y + 1} K:${x + 1},${y + 1} ${x2 + 1},${y + 1}`;
