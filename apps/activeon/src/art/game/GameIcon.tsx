// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// <GameIcon>: the game's own sprite for an item, card, talent, bubble, vial, class, monster or System
// (ADR 0009 as amended 2026-10-19), drawn from the game-art folder on our origin. Lazy
// (`loading="lazy"`, `decoding="async"`), with its box's width and height set so nothing moves when it
// arrives, and nothing joins the JS bundle. When the path names no sprite, or the file is missing or
// fails to load, it draws our own pixel sprite (`fallback`) instead, so a new item a re-sync hasn't
// copied yet never leaves a hole.
//
// Pixel art stays crisp: when the sprite fits its box at a whole-number scale it is drawn
// nearest-neighbour (`data-px`); other scales keep the browser's smooth filter, which reads cleaner
// than uneven pixel doubling.
//
// `wiki`: the thing's display name. The icon then opens its IdleOn Wiki page in a new tab. Never pass
// it to an icon inside a button or link that already does something.
import { type JSX, type ReactNode, type SyntheticEvent, useState } from 'react';
import { Sprite, type SpriteProps } from '../sprites/Sprite';
import { type GameArt, gameArtSrc } from './game-art';
import { wikiHref, wikiLabel } from './wiki';
import './game-icon.css';

export interface GameIconProps {
  art: GameArt | null | undefined;
  /** Our own sprite drawn when there's no game sprite (a kit name), or any node. */
  fallback?: string | ReactNode;
  /** The box in px; the sprite is fitted inside it. */
  size?: SpriteProps['size'];
  /** The accessible name; ignored when decorative. */
  title?: string;
  /** Beside its word: hidden from assistive tech. */
  decorative?: boolean;
  className?: string;
  /** The thing's display name: the icon links to its IdleOn Wiki page. */
  wiki?: string | null;
}

/** True when a sprite of this natural size fits a `box` square at a whole-number scale. */
export function wholeScale(box: number, w: number, h: number): boolean {
  if (!(w > 0 && h > 0)) return false;
  const k = Math.min(box / w, box / h);
  return k >= 1 && Math.abs(k - Math.round(k)) < 1e-6;
}

export function GameIcon({
  art,
  fallback,
  size = 32,
  title,
  decorative = false,
  className,
  wiki,
}: GameIconProps): JSX.Element | null {
  const src = gameArtSrc(art);
  // The src that failed; a new src (another item) tries again.
  const [failed, setFailed] = useState<string | null>(null);
  const [crisp, setCrisp] = useState<string | null>(null);
  let pic: JSX.Element | null;
  if (!src || failed === src) {
    pic =
      typeof fallback === 'string' ? (
        <Sprite name={fallback} size={size} title={title} decorative={decorative} className={className} />
      ) : (
        ((fallback as JSX.Element | undefined) ?? null)
      );
  } else {
    pic = (
      <img
        src={src}
        width={size}
        height={size}
        alt={decorative ? '' : (title ?? '')}
        {...(decorative ? { 'aria-hidden': true } : {})}
        {...(crisp === src ? { 'data-px': '' } : {})}
        loading="lazy"
        decoding="async"
        draggable={false}
        className={['g-art', className].filter(Boolean).join(' ')}
        onLoad={(e: SyntheticEvent<HTMLImageElement>) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (wholeScale(size, w, h)) setCrisp(src);
        }}
        onError={() => setFailed(src)}
      />
    );
  }
  const href = wiki ? wikiHref(wiki) : null;
  if (!href || !pic) return pic;
  return (
    <a
      className="g-wiki"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={wikiLabel(wiki ?? '')}
    >
      {pic}
    </a>
  );
}
