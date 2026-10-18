// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M16's star sign fields come from (M16 TR-2, M1 TR-11): Toolbox paths for provenance, the raw save
// keys behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const STARSIGNS_FIELD_SOURCES: Record<string, string> = {
  'account.starSigns':
    'account.starSigns (unlocked, isInfiniteStar), account.constellations (completedChars, done, rawIndex), characters[i].quests.Telescope',
  'account.starSigns.pointsUnspent': 'account.accountOptions[40] (raw OptLacc[40])',
  'characters[].starSigns': 'characters[i].starSigns[].starName (PersonalValuesMap.StarSign)',
  'characters[].telescopeRoute': 'raw KLA_{i} (KillsLeft2Advance) on the three tree doors',
};

export const STARSIGNS_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.starSigns.pointsUnspent': [raw('OptLacc', 'json')],
  'characters[].telescopeRoute': [raw('KLA_{i}', 'json')],
};

export const STARSIGNS_FIELD_SECTIONS: Record<string, string[]> = {
  'account.starSigns': ['starSigns', 'constellations'],
  'characters[].starSigns': ['starSigns'],
};
