// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Buttons and row links (M21 FR-F5): every one is at least 44 x 44 px (DS-15). A glyph beside its word
// is decorative; a glyph alone carries the accessible name (TR-17).
import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import type { ArtName } from '../art/names';
import { PixelArt } from '../art/PixelArt';
import { GLYPH } from './glyphs';

export type ButtonTone = 'primary' | 'quiet' | 'plain';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: ButtonTone;
  glyph?: ArtName;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone = 'plain', glyph, children, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx('a-btn', `a-btn--${tone}`, className)} {...rest}>
      {glyph ? <PixelArt name={glyph} decorative /> : null}
      <span>{children}</span>
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** The accessible name; also the tooltip. */
  label: string;
  glyph: ArtName;
  scale?: 1 | 2;
  animate?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, glyph, scale = 1, animate, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('a-icon-btn', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <PixelArt name={glyph} scale={scale} animate={animate} decorative />
    </button>
  );
});

export interface LinkRowProps {
  href: string;
  children: ReactNode;
  glyph?: ArtName;
  /** A second, muted line under the label. */
  detail?: ReactNode;
  onClick?(e: React.MouseEvent<HTMLAnchorElement>): void;
}

/** A whole-row link (G6 "See it", footer links, list rows): the row is the target, with an arrow. */
export function LinkRow({ href, children, glyph, detail, onClick }: LinkRowProps) {
  return (
    <a className="a-link-row" href={href} onClick={onClick}>
      {glyph ? <PixelArt name={glyph} decorative /> : null}
      <span className="a-link-row__text">
        <span>{children}</span>
        {detail ? <span className="a-link-row__detail">{detail}</span> : null}
      </span>
      <PixelArt name={GLYPH.arrowRight} decorative className="a-link-row__arrow" />
    </a>
  );
}

export const cx = (...names: (string | false | null | undefined)[]): string =>
  names.filter(Boolean).join(' ');
