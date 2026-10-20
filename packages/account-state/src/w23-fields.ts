// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M24's World 3 page fields come from (M1 TR-11). Merged into fields.ts's tables.
export const W23_FIELD_SOURCES: Record<string, string> = {
  'account.prayers':
    'account.prayers (name, effect, curse, x1, x2, prayerIndex, level, unlockZone, unlockWave)',
  'account.shrines':
    'account.shrines (name, desc, mapId, shrineLevel), website-data shrines (baseBonus, bonusPerLevel)',
  'account.equinoxUnlocked':
    'game client, not Toolbox: raw Dream[2..] (Dream Upgrade levels), raw ChestOrder and InventoryOrder_{i} (Quest78, the Equinox Mirror)',
};

export const W23_FIELD_SECTIONS: Record<string, string[]> = {
  'account.prayers': ['prayers'],
  'account.shrines': ['shrines'],
};
