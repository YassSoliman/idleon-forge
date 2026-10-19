// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The sprite kit's palette (M24, ADR 0009: our own pixel art). Each material is a four-step ramp:
// outline, shadow, base, highlight. The ramps reuse the art tokens in design/tokens.css (tiers and
// materials) and add paper, teal, dark and pink for the kit. Light comes from the top-left.

/** A material key: one lowercase letter in a sprite's mask. */
export type Material =
  | 'w' // wood
  | 's' // stone
  | 'l' // leaf
  | 'b' // blob (water blue)
  | 'f' // fire
  | 'z' // bronze
  | 'i' // silver
  | 'g' // gold
  | 'p' // platinum (sky)
  | 'r' // ruby
  | 'm' // majestic (violet)
  | 'k' // paper (cream, bone, wax)
  | 't' // teal (sea)
  | 'd' // dark (void, ink)
  | 'n'; // pink

/** Outline, shadow, base, highlight. */
export type Ramp = readonly [string, string, string, string];

export const MATERIALS: Readonly<Record<Material, { name: string; ramp: Ramp }>> = {
  w: { name: 'wood', ramp: ['#3b2414', '#6e4527', '#a8703f', '#e2b07a'] },
  s: { name: 'stone', ramp: ['#22262e', '#4d5563', '#808b9c', '#c9d1dc'] },
  l: { name: 'leaf', ramp: ['#12331f', '#2c6b3a', '#57a957', '#b5e58c'] },
  b: { name: 'blob', ramp: ['#1d3b52', '#3f7fa8', '#7cc6e8', '#d8f3ff'] },
  f: { name: 'fire', ramp: ['#5a1a0c', '#d2481c', '#ff9f2e', '#ffe78a'] },
  z: { name: 'bronze', ramp: ['#4a2a18', '#a65a2c', '#e0843f', '#ffd9a8'] },
  i: { name: 'silver', ramp: ['#26323a', '#6d7b80', '#a9bcc0', '#eef8fa'] },
  g: { name: 'gold', ramp: ['#57390a', '#c07d14', '#f2c443', '#fff6cc'] },
  p: { name: 'platinum', ramp: ['#14284f', '#2a78c4', '#62c2f5', '#dcf6ff'] },
  r: { name: 'ruby', ramp: ['#5c1230', '#b02a48', '#e85a5a', '#ffd6b8'] },
  m: { name: 'majestic', ramp: ['#2e0a4a', '#8a1fc0', '#e45cf5', '#ffe0f0'] },
  k: { name: 'paper', ramp: ['#3d2f22', '#b59c74', '#e8d6ae', '#fff7e2'] },
  t: { name: 'teal', ramp: ['#0d3634', '#1f7a6e', '#3fbfa6', '#bdf5e4'] },
  d: { name: 'dark', ramp: ['#0b0c11', '#232633', '#383d4f', '#5f6880'] },
  n: { name: 'pink', ramp: ['#5c1a3a', '#c4507a', '#f08cb0', '#ffd2e4'] },
};

/** Absolute colours an overlay may paint: eye white and ink (pupils, marks). */
export const INKS = { W: '#ffffff', K: '#141018' } as const;

/** Overlay keys: a tone of the pixel's own material (1 outline .. 4 highlight), or an ink. */
export const TONES = { '1': 0, '2': 1, '3': 2, '4': 3 } as const;

export const MASK_KEYS: ReadonlySet<string> = new Set(['.', ...Object.keys(MATERIALS)]);
export const OVERLAY_KEYS: ReadonlySet<string> = new Set(['.', ...Object.keys(TONES), ...Object.keys(INKS)]);
