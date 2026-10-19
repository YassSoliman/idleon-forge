// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M26 F-C's anvil fields come from (M1 TR-11). Merged into fields.ts's tables. `AnvilPAselect_i`
// is read straight from the raw save (it may be a bare number, so it has no raw-key kind here).
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const PRODUCTION_FIELD_SOURCES: Record<string, string> = {
  'characters[].anvil':
    'raw AnvilPAselect_i (save order), characters[i].anvil.anvilProduction[p][0], getPlayerAnvil stats.anvilCapacity, anvilSpeedTerms (getAnvilSpeed arguments), calcAnvilExp',
};

export const PRODUCTION_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].anvil': [raw('AnvilPA_{i}', 'json')],
};

export const PRODUCTION_FIELD_SECTIONS: Record<string, string[]> = {
  'characters[].anvil': ['stamps', 'alchemy', 'statues', 'starSigns', 'upgradeVault'],
};
