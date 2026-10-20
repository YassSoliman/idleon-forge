// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Bubba's game sprites (M25, ADR 0009 as amended 2026-10-19), named as IdleOn Toolbox draws them
// (pages/account/clickers/bubba.jsx, components/account/clickers/bubba/Upgrades.jsx): a Boon bonus is
// etc/Bubba_<n> in Toolbox's bonus order (parsers/clickers/bubba.ts `bonusMap` ids 1-7), a Megaflesh
// data/BubbaMF<row - 1>, an upgrade etc/Bubbo_Upgrade_<index>.
import type { GameArt } from './game-art';

/** Toolbox's Boon bonus order: Bubba_1 is Build Rate ... Bubba_7 is Atom Cost. */
const BOONS = ['buildRate', 'critterGain', 'soulGain', 'totalDamage', 'allKills', 'expMulti', 'atomCost'];

/** A Boon bonus by its key. */
export const boonArt = (key: string): GameArt | null => {
  const i = BOONS.indexOf(key);
  return i < 0 ? null : { path: `etc/Bubba_${i + 1}` };
};
/** A Megaflesh by its row (1-based; row 12 is the Chromatic Megaflesh). */
export const megafleshArt = (row: number): GameArt | null =>
  Number.isInteger(row) && row >= 1 ? { path: `data/BubbaMF${row - 1}` } : null;
/** A Bubba upgrade by its index. */
export const bubbaUpgradeArt = (index: number): GameArt | null =>
  Number.isInteger(index) && index >= 0 ? { path: `etc/Bubbo_Upgrade_${index}` } : null;
