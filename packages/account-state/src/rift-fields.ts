// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M26 FR-11's `account.rift` comes from (M1 TR-11). Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

export const RIFT_FIELD_SOURCES: Record<string, string> = {
  'account.rift':
    'account.rift (currentRift = Rift[0], currentProgress = Rift[1], chars = Rift[2], list = riftInfo task/monsterName/riftBonus), account.quests Rift_Ripper1 (itemReq, progress[].status), raw AFKtarget_i, characters[i].class',
};

/** Not required: a save from before World 4 may have no Rift record (the field is then null, not unknown). */
export const RIFT_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {};

export const RIFT_FIELD_SECTIONS: Record<string, string[]> = {
  'account.rift': ['rift', 'quests'],
};
