// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The blob avatar (M24, the UX rework canvas): our own guide blob (ADR 0009: never the game's art), its
// hat in the class family's colour, drawn as a 12 x 12 grid of crisp SVG rects. It stands beside the
// class and level ("Hunter 70"), so it is decorative unless given a label. The size is a custom
// property, the one inline style the CSP allows (style-src 'self' still permits CSSOM writes).
import type { CSSProperties, JSX } from 'react';
import type { ClassFamily } from '../who/WhoGlyph';

/** The hat colours from the canvas: warrior copper, archer leaf, mage violet, beginner gold. */
export const HAT: Record<ClassFamily, string> = {
  beginner: '#E9B949',
  journeyman: '#E9B949',
  warrior: '#C27A4A',
  archer: '#6FBF73',
  mage: '#A77FE0',
};
const BODY = '#8CC4EE';
const EYES = '#14161B';

export interface BlobProps {
  family?: ClassFamily;
  /** Edge in px (the canvas uses 24, 28, 36, 40, 56 and 64). */
  size?: number;
  /** Set only when the blob stands alone; beside its words it is decorative. */
  label?: string;
}

export function Blob({ family = 'beginner', size = 36, label }: BlobProps): JSX.Element {
  return (
    <span
      className="a-blob"
      style={{ '--blob-size': `${size}px` } as CSSProperties}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
        <rect x="3" y="0" width="6" height="2" fill={HAT[family]} />
        <rect x="2" y="2" width="8" height="1" fill={BODY} />
        <rect x="1" y="3" width="10" height="7" fill={BODY} />
        <rect x="2" y="10" width="8" height="1" fill={BODY} />
        <rect x="3" y="5" width="2" height="2" fill={EYES} />
        <rect x="7" y="5" width="2" height="2" fill={EYES} />
      </svg>
    </span>
  );
}
