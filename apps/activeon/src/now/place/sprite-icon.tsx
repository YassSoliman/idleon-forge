// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): a sprite kit icon by name, falling back to another name when the kit has no
// drawing for it (a System's limit drawn by `sys-<id>`, else a status sprite). Loaded lazily by
// `Icon` (icon.tsx), so the kit's grids stay out of the first load.

import { spriteOf } from '../../art/sprites';
import { Sprite } from '../../art/sprites/Sprite';

export function SpriteIcon({
  name,
  fallback = 'status-full',
  size,
}: {
  name: string;
  fallback?: string;
  size: 16 | 24 | 32 | 48 | 64;
}) {
  return <Sprite name={spriteOf(name) ? name : fallback} size={size} decorative />;
}
