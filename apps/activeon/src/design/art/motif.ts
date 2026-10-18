// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The shape scripts/art/import.mjs generates for each of our pixel-art motifs (M21 TR-4).

/** A slot key: one fill colour of a motif, drawn by the `.pxs-<slot>` class in art.css. */
export type Slot = string;
/** The token expression a slot fills with, e.g. `var(--mat-blob-3)` or `currentColor`. */
export type TokenExpr = string;

export interface Motif {
  title: string;
  /** Width and height in art pixels: 16, 24 or 32 for most motifs. */
  grid: readonly [number, number];
  /** Frames per second of the loop; 0 for a still motif. */
  fps: number;
  /** A celebration: plays once and holds its last frame. */
  once?: boolean;
  /** Per frame, each slot's pixels as one merged `d` path. */
  frames: ReadonlyArray<Record<Slot, string>>;
}

/** The Lab groups, one lazy chunk each; the first-screen motifs ship in `core`. */
export type ArtGroup = 'now' | 'cards' | 'flows' | 'ui' | 'character' | 'map' | 'systems' | 'time';
