// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M26 Wave 2's fields come from (M1 TR-11). Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

export const GAPS_FIELD_SOURCES: Record<string, string> = {
  'account.saltLick':
    'account.saltLick (rawName, level, maxLevel, baseBonus, unlocked), account.towers (Salt_Lick level); liquidRatePct: game client, not Toolbox (LiquidHRrate adds SaltLick(5))',
  'account.forge':
    'account.forge (list[].ore/bar/barrel/isBrimestone/speed/timeTillEmpty, upgrades[].level/maxLevel, oreCapacity.value), account.storage.list and characters[].inventory (typeGen bOre, cOil)',
  'account.salts[].held': 'account.storage.list (rawName, amount): the Storage Chest only',
  'account.salts[].inRefinery': 'account.refinery.refineryStorage (Refinery[1] names, Refinery[2] amounts)',
};

/** Not required: a save from before World 3 has no Salt Lick (the field is then null, not unknown). */
export const GAPS_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {};

export const GAPS_FIELD_SECTIONS: Record<string, string[]> = {
  'account.saltLick': ['saltLick'],
  'account.forge': ['forge'],
  'account.salts[].held': ['storage'],
  'account.salts[].inRefinery': ['refinery'],
};
