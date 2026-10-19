// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): a sprite kit icon in a fixed box (so nothing moves while its chunk loads). The kit
// is a lazy chunk: the first screen draws the box, then the sprite.
import { Suspense } from 'react';
import type { GameArt } from '../../art/game/game-art';
import { lazyPart } from '../../lazy-part';

const SpriteIcon = lazyPart(
  () => import('./sprite-icon'),
  (m) => m.SpriteIcon,
);

export function Icon({
  name,
  fallback,
  size = 32,
  className,
  art,
}: {
  name: string;
  fallback?: string;
  /** A game thing's own sprite (M25); `name` is then its fallback. */
  art?: GameArt | null;
  size?: 16 | 24 | 32 | 48 | 64;
  className?: string;
}) {
  return (
    <span className={['np-ic', className].filter(Boolean).join(' ')} data-size={size} aria-hidden="true">
      <Suspense fallback={null}>
        <SpriteIcon name={name} fallback={fallback} size={size} art={art} />
      </Suspense>
    </span>
  );
}

/** The sprite of a limit's System ("sys-worship"); the kit falls back to a status sprite. */
export const systemSprite = (system: string | null | undefined) => (system ? `sys-${system}` : 'status-full');
