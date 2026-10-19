// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The M24 surfaces (the UX rework canvas's .frame, .tile, .tile2, .pip, .badge): the shared primitives
// every place builds its boards from. The rules they carry (docs/specs/M24-ux-rework.md):
// - One Frame per screen: the answer, notched like IdleOn's windows. Coral by default (losing value
//   now), gold for "do it", mint for "done or fine" (rule 7).
// - Tiles are tonal steps (surface, then sunk); no border, no radius, no ring (surface-guard.test.ts).
// - A Pip is a 10 px square of meaning beside a word, never alone (DS-8).
// - A Tag is a short word or count on a quiet square.
import type { ElementType, HTMLAttributes, JSX, ReactNode } from 'react';
import { cx } from './Button';

export type Tone = 'coral' | 'gold' | 'mint' | 'sky';

export interface FrameProps extends HTMLAttributes<HTMLElement> {
  /** coral: losing value now (default) · gold: do it · ok: done or fine. */
  tone?: 'coral' | 'gold' | 'ok';
  /** The canvas's 24 x 28 padding (16 x 20 on a phone). On by default. */
  pad?: boolean;
  as?: ElementType;
  children: ReactNode;
}

/** The one framed block on a screen: the answer (rule 1). */
export function Frame({
  tone = 'coral',
  pad = true,
  as: Tag = 'section',
  className,
  children,
  ...rest
}: FrameProps) {
  return (
    <Tag
      className={cx('a-frame', tone !== 'coral' && `a-frame--${tone}`, pad && 'a-frame--pad', className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface TileProps extends HTMLAttributes<HTMLElement> {
  /** 1: the surface step (16 x 18 padding) · 2: the sunk step (12 x 14). */
  level?: 1 | 2;
  as?: ElementType;
  children?: ReactNode;
}

export function Tile({ level = 1, as: Tag = 'div', className, children, ...rest }: TileProps) {
  return (
    <Tag className={cx(level === 2 ? 'a-tile2' : 'a-tile', className)} {...rest}>
      {children}
    </Tag>
  );
}

/** A 10 px square of meaning; grey (no tone) is "later". Decorative: the word beside it says it. */
export function Pip({ tone, className }: { tone?: Tone; className?: string }): JSX.Element {
  return <span className={cx('a-pip', tone && `a-pip--${tone}`, className)} aria-hidden="true" />;
}

/** A short word or count: plain by default; gold and coral fill only when the word is the call. */
export function Tag({ tone, children }: { tone?: 'gold' | 'coral' | 'mint'; children: ReactNode }) {
  return <span className={cx('a-tag', tone && `a-tag--${tone}`)}>{children}</span>;
}
