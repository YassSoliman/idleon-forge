// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): a sprite kit icon by name, falling back to another name when the kit has no
// drawing for it (a System's limit drawn by `sys-<id>`, else a status sprite). Loaded lazily by
// `Icon` (icon.tsx), so the kit's grids stay out of the first load. M25: a System draws its game
// sprite first (KitSprite); any other game thing passes its own `art`, our kit sprite is its fallback.
import { GameIcon } from '../../art/game/GameIcon';
import type { GameArt } from '../../art/game/game-art';
import { KitSprite } from '../../art/game/KitSprite';

export function SpriteIcon({
  name,
  fallback = 'status-full',
  size,
  art,
}: {
  name: string;
  fallback?: string;
  size: 16 | 24 | 32 | 48 | 64;
  art?: GameArt | null;
}) {
  const kit = <KitSprite name={name} fallback={fallback} size={size} />;
  return art ? <GameIcon art={art} fallback={kit} size={size} decorative /> : kit;
}
