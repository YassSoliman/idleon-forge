// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24: a System's icon. The sprite kit's `sys-<id>` sprite when it has one, else the M21 pixel glyph
// (systems/glyphs.ts), so a System the registry adds later still gets a picture (spec §8 "Patch day").

import { spriteOf } from '../../art/sprites';
import { Sprite } from '../../art/sprites/Sprite';
import { PixelArt } from '../../design/art/PixelArt';
import { systemArt } from '../glyphs';

export function SystemIcon({ id, size = 32 }: { id: string; size?: 16 | 24 | 32 | 48 | 64 }) {
  const name = `sys-${id}`;
  if (spriteOf(name)) return <Sprite name={name} size={size} decorative />;
  const art = systemArt(id);
  return <PixelArt name={art.name} ramp={art.ramp} scale={size >= 48 ? 3 : 2} decorative />;
}
