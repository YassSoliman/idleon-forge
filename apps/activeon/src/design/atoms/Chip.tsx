// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Chips (M21 FR-F5): a small labelled control, 44 px tall (DS-15). `GlyphChip` is a character as a
// who-glyph plus its label ("Squire 51 · 6"); one tap opens that character (cards.goal-details pick).
import type { ReactNode } from 'react';
import type { ArtName } from '../art/names';
import { PixelArt } from '../art/PixelArt';
import { type ClassFamily, WhoGlyph } from '../who/WhoGlyph';
import { cx } from './Button';

export interface ChipProps {
  children: ReactNode;
  glyph?: ArtName;
  /** A toggle chip (filters): renders aria-pressed. */
  pressed?: boolean;
  onClick?(): void;
  /** Renders a link instead of a button. */
  href?: string;
}

export function Chip({ children, glyph, pressed, onClick, href }: ChipProps) {
  const inner = (
    <>
      {glyph ? <PixelArt name={glyph} decorative /> : null}
      <span>{children}</span>
    </>
  );
  if (href)
    return (
      <a className="a-chip" href={href} onClick={onClick}>
        {inner}
      </a>
    );
  if (!onClick) return <span className="a-chip a-chip--static">{inner}</span>;
  return (
    <button
      type="button"
      className={cx('a-chip', pressed && 'a-chip--pressed')}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {inner}
    </button>
  );
}

export interface GlyphChipProps {
  family: ClassFamily;
  /** "Squire 51" */
  label: string;
  /** A per-character detail after the name ("6"). */
  detail?: string;
  /** The 12 px subclass letter: only where the glyph stands without its class word (D-19). */
  badge?: string;
  world?: number;
  href?: string;
  onClick?(): void;
}

export function GlyphChip({ family, label, detail, badge, world, href, onClick }: GlyphChipProps) {
  const inner = (
    <>
      <WhoGlyph family={family} classLabel={label} scale={1} badge={badge} world={world} decorative />
      <span>{label}</span>
      {detail ? <span className="a-chip__detail num">{detail}</span> : null}
    </>
  );
  if (href)
    return (
      <a className="a-chip a-glyph-chip" href={href} onClick={onClick}>
        {inner}
      </a>
    );
  return (
    <button type="button" className="a-chip a-glyph-chip" onClick={onClick}>
      {inner}
    </button>
  );
}

export interface BadgeProps {
  count: number;
  /** The count in words for screen readers ("2 to fix before you leave"). */
  label: string;
  /** M24 rule 7: coral losing value now (default), gold do it, plain a count, text a bare gold number. */
  tone?: 'coral' | 'gold' | 'plain' | 'text';
}

/** A count, named in words for screen readers (nav badges, tab badges). Zero renders nothing. */
export function Badge({ count, label, tone = 'coral' }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <span className={tone === 'coral' ? 'a-badge' : `a-badge a-badge--${tone}`}>
      <span className="num" aria-hidden="true">
        {count}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
