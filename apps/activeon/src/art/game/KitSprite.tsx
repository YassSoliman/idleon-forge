// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// <KitSprite>: a sprite-kit name, upgraded to the game's sprite where the name stands for a game thing
// (M25, ADR 0009 as amended 2026-10-19). Today that is a System (`sys-<id>`, SYSTEM_ART); every other
// name, and any game sprite that fails to load, draws our own kit sprite. Use it wherever a view picks
// a kit name for a System, so the Systems grid, Now, Timeline and Goals all show the same picture.
import type { JSX } from 'react';
import { spriteOf } from '../sprites';
import { Sprite } from '../sprites/Sprite';
import { GameIcon } from './GameIcon';
import { systemGameArt } from './system-art';

export function KitSprite({
  name,
  fallback = 'status-full',
  size,
  className,
}: {
  name: string;
  /** The kit name drawn when the kit has no `name`. */
  fallback?: string;
  size: 16 | 24 | 32 | 48 | 64;
  className?: string;
}): JSX.Element {
  const kit = <Sprite name={spriteOf(name) ? name : fallback} size={size} decorative className={className} />;
  const art = name.startsWith('sys-') ? systemGameArt(name.slice(4)) : null;
  return art ? <GameIcon art={art} fallback={kit} size={size} decorative className={className} /> : kit;
}
