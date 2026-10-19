// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// <GameIcon>: the game's own sprite for an item, card, talent, bubble, vial, class or monster (ADR 0009
// as amended 2026-10-19), drawn from the game-art folder on our origin. Lazy (`loading="lazy"`), so only the
// sprites on screen are fetched and nothing joins the JS bundle. When the id names no sprite, or the
// file is missing or fails to load, it draws our own pixel sprite (`fallback`) instead, so a new item a
// re-sync hasn't copied yet never leaves a hole.
import { type JSX, type ReactNode, useState } from 'react';
import { Sprite, type SpriteProps } from '../sprites/Sprite';
import { type GameArt, gameArtSrc } from './game-art';
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
}

export function GameIcon({
  art,
  fallback,
  size = 32,
  title,
  decorative = false,
  className,
}: GameIconProps): JSX.Element | null {
  const src = gameArtSrc(art);
  // The src that failed; a new src (another item) tries again.
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    if (typeof fallback === 'string')
      return (
        <Sprite name={fallback} size={size} title={title} decorative={decorative} className={className} />
      );
    return (fallback as JSX.Element | undefined) ?? null;
  }
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt={decorative ? '' : (title ?? '')}
      {...(decorative ? { 'aria-hidden': true } : {})}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={['g-art', className].filter(Boolean).join(' ')}
      onError={() => setFailed(src)}
    />
  );
}
