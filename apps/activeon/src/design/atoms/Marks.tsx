// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Kind seals, status glyphs, the NPC speech box and the section heading (M21 FR-F5).
import type { ReactNode } from 'react';
import { PixelArt } from '../art/PixelArt';
import { cx } from './Button';
import { GLYPH, SEAL_GLYPH, type SealKind, STATUS_GLYPH, type SystemStatus } from './glyphs';

export interface SealProps {
  kind: SealKind;
  /** The kind's small word ("Fix", "Grow"), from the engine's words. */
  word: string;
}

/** A Goal's kind: its pixel seal plus a small word (the 4 px rule is the card's, `.a-kind-<kind>`). */
export function Seal({ kind, word }: SealProps) {
  return (
    <span className={cx('a-seal', `a-seal--${kind}`)}>
      <PixelArt name={SEAL_GLYPH[kind]} decorative />
      <span className="a-seal__word">{word}</span>
    </span>
  );
}

export interface StatusGlyphProps {
  status: SystemStatus;
  /** The engine's status word (STATUS_WORDS); status is never colour alone (DS-8). */
  word: string;
  /** Glyph only, for a tile that prints the word elsewhere: the word becomes the title. */
  glyphOnly?: boolean;
}

export function StatusGlyph({ status, word, glyphOnly }: StatusGlyphProps) {
  return (
    <span className={cx('a-status', `a-status--${status}`)}>
      <PixelArt name={STATUS_GLYPH[status]} decorative={!glyphOnly} title={glyphOnly ? word : undefined} />
      {glyphOnly ? null : <span>{word}</span>}
    </span>
  );
}

export interface SpeechProps {
  children: ReactNode;
  /** The guide's name tag (owner Q3: "Scout"). Omit for the app's own voice. */
  name?: string;
}

/**
 * The NPC why (the Quest Log accent, cards.why-sheet "NPC speech"): our scout-hat guide blob and a
 * navy speech box. It opts its subtree into Quest Log's tokens with data-direction="quest".
 */
export function Speech({ children, name }: SpeechProps) {
  return (
    <div className="a-speech" data-direction="quest">
      <PixelArt name={GLYPH.scout} scale={2} decorative className="a-speech__guide" />
      <div className="a-speech__box">
        {name ? <span className="a-speech__name">{name}</span> : null}
        <div className="a-speech__text">{children}</div>
      </div>
    </div>
  );
}

export interface SectionProps {
  title: string;
  children: ReactNode;
  /** Extra content on the heading row (a count chip, a link). */
  aside?: ReactNode;
  level?: 2 | 3;
  id?: string;
}

/** A section with its heading in the pixel display face, 16 px and up (DS-14). */
export function Section({ title, children, aside, level = 2, id }: SectionProps) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <section className="a-section" aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="a-section__head">
        <H className="a-section__title" id={id ? `${id}-h` : undefined}>
          {title}
        </H>
        {aside}
      </div>
      {children}
    </section>
  );
}
