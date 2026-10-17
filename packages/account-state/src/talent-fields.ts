// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M9's Builds fields come from (M9 TR-3, TR-4, M1 TR-11): Toolbox paths for provenance, the raw
// save keys behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const TALENT_FIELD_SOURCES: Record<string, string> = {
  'characters[].talents':
    'characters[i].talents, .flatStarTalents, .selectedTalentPreset, .talentPreset; AttackLoadout_<i>, AttackLoadoutpre_<i> (raw)',
  'characters[].talents.active':
    'characters[i].talents, characters[i].flatStarTalents, AttackLoadout_<i> (raw)',
  'characters[].talents.other':
    'characters[i].talentPreset.talents, .flatStarTalents (SLpre_<i>), AttackLoadoutpre_<i> (raw)',
  'characters[].talents.selectedPreset': 'characters[i].selectedTalentPreset (PlayerStuff_<i>[1])',
  'account.resetItems': 'account.storage.list, characters[i].inventory (ResetCompleted, ResetFrag)',
};

export const TALENT_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].talents': [
    raw('SL_{i}', 'json'),
    raw('SM_{i}', 'json'),
    raw('PlayerStuff_{i}', 'json'),
    raw('AttackLoadout_{i}', 'json'),
  ],
};

export const TALENT_FIELD_SECTIONS: Record<string, string[]> = {
  'account.resetItems': ['storage'],
};
