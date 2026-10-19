// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the World 3 System pages: the shrine bonus table Toolbox's `account.shrines` leaves out (an
// unbuilt shrine's bonus at level 1), from Toolbox's game data.
import { shrines } from '@website-data';

/** Each live shrine's `baseBonus` and `bonusPerLevel`, in `account.shrines` order (Toolbox's `liveEntries`). */
export function shrineBonuses(): Array<{ baseBonus: number; bonusPerLevel: number }> {
  return Object.entries(
    shrines as Record<string, { shrineName?: string; baseBonus?: number; bonusPerLevel?: number }>,
  )
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([, v]) => v)
    .filter((v) => v?.shrineName !== 'Unknown')
    .map((v) => ({ baseBonus: Number(v.baseBonus ?? 0), bonusPerLevel: Number(v.bonusPerLevel ?? 0) }));
}
