// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M15's account-depth fields come from (M15 TR-2, M1 TR-11): Toolbox paths for provenance, the
// raw save keys behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const DEPTH_FIELD_SOURCES: Record<string, string> = {
  'account.refinery':
    'account.refinery.salts (rank, refined, powerCap, autoRefinePercentage), getSaltsBalance, calcTimeToRankUp',
  'account.construction':
    'account.towers.data, account.construction.totalBuildRate, getBuildCost, raw Tower[54..61], account.gemShopPurchases[117], account.tasks[2][2][0]',
  'account.library':
    'account.libraryTimes, account.towers.data[Talent_Book_Library], getBookLvRange, raw Lab[16][3], account.storage.list, characters[i].inventory (TalentBook2..5)',
};

export const DEPTH_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.refinery': [raw('Refinery', 'json')],
  'account.construction': [raw('Tower', 'json')],
  'account.library': [raw('OptLacc', 'json'), raw('Tower', 'json')],
};

export const DEPTH_FIELD_SECTIONS: Record<string, string[]> = {
  'account.refinery': ['refinery'],
  'account.construction': ['towers', 'construction', 'gemShopPurchases', 'tasks'],
  'account.library': ['libraryTimes', 'towers', 'storage'],
};
