// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M26 FR-17's `characters[].eliteStep` comes from (M1 TR-11). Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const ELITE_FIELD_SOURCES: Record<string, string> = {
  'characters[].eliteStep':
    'characters[i].class (CharacterClass_i), raw QuestComplete_i.Eliteus1 and QuestStatus_i.Eliteus1[0] (the Greenie Gang count)',
};

export const ELITE_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].eliteStep': [raw('QuestComplete_{i}', 'json'), raw('QuestStatus_{i}', 'json')],
};

export const ELITE_FIELD_SECTIONS: Record<string, string[]> = {};
