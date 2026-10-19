// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Turns a sprite's mask (materials) and overlay (hand-placed tones and inks) into a 16x16 grid of
// colours. Deterministic house rules, so every sprite shares one light source and one line:
// - outline: every empty pixel that touches a filled one (4-neighbour, so corners come out soft) takes
//   the darkest tone of that material;
// - shading: a pixel lit from the top-left (open above or left) takes the highlight, one open below or
//   right takes the shadow, the rest the base; a pixel open on both sides stays base;
// - the overlay wins: '1'..'4' force a tone of the pixel's own material, 'W' / 'K' paint an ink.
import { INKS, MATERIALS, type Material, TONES } from './palette';

export const GRID = 16;

export interface SpriteDef {
  title: string;
  /** 16 rows of 16 keys: '.' empty, or a material letter (palette.ts). */
  mask: readonly string[];
  /** Optional 16 rows of 16 keys: '.' leave, '1'..'4' a tone of the pixel's material, 'W' / 'K' an ink. */
  over?: readonly string[];
  /** Optional single pixels on top of `over`: "W:4,6 5,6 K:5,7 2:9,9" (a key, then x,y points). */
  dots?: string;
}

/** Parses `dots` into [x, y, key] triples (key is an overlay key). */
export function dotsOf(dots: string | undefined): Array<readonly [number, number, string]> {
  const out: Array<readonly [number, number, string]> = [];
  let key = '.';
  for (const tok of (dots ?? '').trim().split(/\s+/).filter(Boolean)) {
    const m = /^(?:(\w):)?(\d+),(\d+)$/.exec(tok);
    if (!m) throw new Error(`bad dot ${tok}`);
    if (m[1]) key = m[1];
    out.push([Number(m[2]), Number(m[3]), key]);
  }
  return out;
}

/** The overlay as a 16x16 grid of keys: `over`, then `dots` on top. */
export function overlayOf(def: SpriteDef): string[][] {
  const grid = Array.from({ length: GRID }, (_, y) =>
    Array.from({ length: GRID }, (_, x) => def.over?.[y]?.[x] ?? '.'),
  );
  for (const [x, y, k] of dotsOf(def.dots)) if (grid[y]?.[x] !== undefined) (grid[y] as string[])[x] = k;
  return grid;
}

/** A baked sprite: rows of `#rrggbb` or null (transparent). */
export type Pixels = ReadonlyArray<ReadonlyArray<string | null>>;

const N4: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

export function bake(def: SpriteDef): Pixels {
  const at = (x: number, y: number): string =>
    x < 0 || y < 0 || x >= GRID || y >= GRID ? '.' : (def.mask[y]?.[x] ?? '.');
  const over = overlayOf(def);
  const rows: (string | null)[][] = [];
  for (let y = 0; y < GRID; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < GRID; x++) {
      const c = at(x, y);
      const o = over[y]?.[x] ?? '.';
      if (o === 'W' || o === 'K') {
        row.push(INKS[o]);
        continue;
      }
      if (c === '.') {
        let edge: string | null = null;
        for (const [dx, dy] of N4) {
          const n = at(x + dx, y + dy);
          if (n !== '.') {
            edge = MATERIALS[n as Material].ramp[0];
            break;
          }
        }
        row.push(edge);
        continue;
      }
      const ramp = MATERIALS[c as Material].ramp;
      if (o in TONES) {
        row.push(ramp[TONES[o as keyof typeof TONES]]);
        continue;
      }
      const open = (dx: number, dy: number) => (at(x + dx, y + dy) === c ? 0 : 1);
      const lit = open(0, -1) + open(-1, 0) - open(0, 1) - open(1, 0);
      row.push(ramp[lit > 0 ? 3 : lit < 0 ? 1 : 2]);
    }
    rows.push(row);
  }
  return rows;
}

/** One SVG path per colour: each horizontal run of a colour becomes a 1-px-tall rectangle. */
export function pathsOf(px: Pixels): Array<{ fill: string; d: string }> {
  const byFill = new Map<string, string[]>();
  px.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const fill = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === fill) end++;
      if (fill) {
        const list = byFill.get(fill) ?? [];
        list.push(`M${x} ${y}h${end - x}v1h${x - end}z`);
        byFill.set(fill, list);
      }
      x = end;
    }
  });
  return [...byFill].map(([fill, ds]) => ({ fill, d: ds.join('') }));
}
