// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// <WhoGlyph>: the one way a character is drawn (M21 FR-F4, DS-13). The family chibi (a 16-grid motif on
// the blob ramp) at 16, 32 or 48 px, tinted by world on its frame, with an optional 12 px subclass
// letter badge set in Atkinson Hyperlegible Next 700, never a pixel face (DS-14). The blink plays only
// for the character being played (`animate`), never on every Roster row.
import type { JSX } from 'react';
import { PixelArt } from '../art/PixelArt';
import './who.css';

/** The class family a class belongs to, from `classes.fact.class-tree` (the engine adds it to rows). */
export type ClassFamily = 'beginner' | 'journeyman' | 'warrior' | 'archer' | 'mage';

export interface WhoGlyphProps {
  family: ClassFamily;
  /** "Squire", "Bowman": the accessible name when the glyph stands alone. */
  classLabel: string;
  level?: number;
  scale: 1 | 2 | 3;
  /** A subclass letter, only where the glyph stands without its class word (D-19). */
  badge?: string;
  /** The world the character is in (1..7), tints the frame. */
  world?: number;
  animate?: boolean;
  /** Beside its class word: hidden from assistive tech. */
  decorative?: boolean;
}

const CHIBI = {
  beginner: 'now-blob-beginner',
  journeyman: 'now-blob-journeyman',
  warrior: 'now-blob-warrior',
  archer: 'now-blob-archer',
  mage: 'now-blob-mage',
} as const satisfies Record<ClassFamily, string>;

const isWorld = (w: number | undefined): w is 1 | 2 | 3 | 4 | 5 | 6 | 7 =>
  w !== undefined && Number.isInteger(w) && w >= 1 && w <= 7;

export function WhoGlyph({
  family,
  classLabel,
  level,
  scale,
  badge,
  world,
  animate = false,
  decorative = false,
}: WhoGlyphProps): JSX.Element {
  const label = level === undefined ? classLabel : `${classLabel} ${level}`;
  const tinted = isWorld(world);
  const classes = ['who', `who-s${scale}`, tinted ? `who-world px-w${world}` : ''].filter(Boolean).join(' ');
  return (
    <span
      className={classes}
      data-family={family}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
    >
      <PixelArt name={CHIBI[family]} scale={scale} decorative animate={animate} />
      {badge ? (
        <span className="who-badge" aria-hidden="true">
          {badge}
        </span>
      ) : null}
    </span>
  );
}
