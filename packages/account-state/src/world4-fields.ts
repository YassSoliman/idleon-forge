// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M24's World 4 fields come from (M1 TR-11): Toolbox paths for provenance, the raw save keys behind
// them, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

export const WORLD4_FIELD_SOURCES: Record<string, string> = {
  'account.lab':
    'account.lab (playersCords, connectedPlayers, playersChips, labBonuses, jewels, totalRawChips), characters[].skillsInfo.laboratory, characters[].afkTarget, accountOptions[91], getChipsAndJewels',
  'account.cooking':
    'account.cooking (meals, spices.toClaim, mealMaxLevel, kitchens[].meal/.mealSpeed), raw Cooking[i][0,6,7,8], Meals[3], Territory[i][4], accountOptions[100]',
  'account.breeding':
    'account.breeding (eggs, eggCapacity, timeToNextEgg, deadCells, territories, petUpgrades, pets), characters[].skillsInfo.breeding, raw Territory[i][3], Meals[3], accountOptions[89]',
};

/** Not required: a save from before World 4 has none of them (the field is then null, not unknown). */
export const WORLD4_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {};

export const WORLD4_FIELD_SECTIONS: Record<string, string[]> = {
  'account.lab': ['lab'],
  'account.cooking': ['cooking'],
  'account.breeding': ['breeding'],
};
