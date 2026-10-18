// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M23's Bubba fields come from (M23 TR-2, M1 TR-11): Toolbox paths for provenance, the raw save key
// behind them, and the parser section they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

export const BUBBA_FIELD_SOURCES: Record<string, string> = {
  'account.bubba':
    'account.bubba (meatSlices, meatsliceRate, progress, progressReq, totalUpgTypesAvailable, upgrades[].level/.prestige/.cost, megafleshOwned, bonuses, smokerUnlocked, smokerSeconds); raw Bubba[0][1,2,3,5,6,8,13,15], [3], [4]; bubbaX1 (ADR 0010)',
};

export const BUBBA_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {};

export const BUBBA_FIELD_SECTIONS: Record<string, string[]> = {
  'account.bubba': ['bubba'],
};
