// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Rift's number (M26 FR-4, MASTER X1). The save stores the completed level count, `Rift[0]`; the
// game and the wiki show the level being played, one more. ActiveOn stores and compares `Rift[0]`
// (`account.rift.level` from Wave 1) and prints only through this function, so the two can't mix.

/** The Rift number the game shows for a stored `Rift[0]`: Rift[0] + 1. */
export const riftLabel = (level: number): number => level + 1;

/** "Rift 26" for a stored 25 (Stamp Mastery). */
export const riftText = (level: number): string => `Rift ${riftLabel(level)}`;
