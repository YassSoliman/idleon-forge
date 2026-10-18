// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M19's Alchemy fields come from (M19 TR-2, M1 TR-11): Toolbox paths for provenance, the raw save
// keys behind them, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const ALCHEMY_FIELD_SOURCES: Record<string, string> = {
  'account.alchemyPlan':
    'account.alchemy.bubbles[*][*].level, .vials[0..41].level, .multiplierArray, .p2w.player; characters[i].skillsInfo.alchemy.level',
};

export const ALCHEMY_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.alchemyPlan': [raw('CauldronInfo', 'json'), raw('CauldronP2W', 'json')],
};

export const ALCHEMY_FIELD_SECTIONS: Record<string, string[]> = {
  'account.alchemyPlan': ['alchemy'],
};
