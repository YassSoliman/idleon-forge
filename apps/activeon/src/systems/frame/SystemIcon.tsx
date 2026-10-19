// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A System's icon: its game sprite (art/game/system-art.ts, ADR 0009 as amended 2026-10-19), else the
// sprite kit's `sys-<id>` sprite, else the M21 pixel glyph (systems/glyphs.ts), so a System the
// registry adds later still gets a picture (spec §8 "Patch day").

import { GameIcon } from '../../art/game/GameIcon';
import { systemGameArt } from '../../art/game/system-art';
import { spriteOf } from '../../art/sprites';
import { Sprite } from '../../art/sprites/Sprite';
import { PixelArt } from '../../design/art/PixelArt';
import { systemArt } from '../glyphs';

type Size = 16 | 24 | 32 | 48 | 64;

/** Our own picture for a System: the kit sprite, else the pixel glyph. */
export function SystemKitIcon({ id, size = 32 }: { id: string; size?: Size }) {
  const name = `sys-${id}`;
  if (spriteOf(name)) return <Sprite name={name} size={size} decorative />;
  const art = systemArt(id);
  return <PixelArt name={art.name} ramp={art.ramp} scale={size >= 48 ? 3 : 2} decorative />;
}

export function SystemIcon({ id, size = 32 }: { id: string; size?: Size }) {
  return (
    <GameIcon
      art={systemGameArt(id)}
      fallback={<SystemKitIcon id={id} size={size} />}
      size={size}
      decorative
    />
  );
}
