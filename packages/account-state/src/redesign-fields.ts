// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M21's fields come from (M21 TR-3, M1 TR-11): Toolbox paths for provenance, the raw save keys
// behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

/** The account sections Toolbox `calcTotalStarTalent` reads (vendor/parsers/talents.ts, at the pin). */
export const STAR_TOTAL_SECTIONS = [
  'stamps',
  'guild',
  'dungeons',
  'cards',
  'alchemy',
  'achievements',
  'breeding',
  'bribes',
  'islands',
  'upgradeVault',
  'companions',
];

export const REDESIGN_FIELD_SOURCES: Record<string, string> = {
  'characters[].talents.starPoints':
    'calcTotalStarTalent([character]) (active); on a copy with talentPreset.flatTalents + .flatStarTalents (other)',
  'characters[].doorKillsLeft': 'raw KLA_{i} (KillsLeft2Advance, every map, per door, clamped at 0)',
  'account.statues': 'account.statues (statueIndex, name, level), raw StuG (grade), raw StatueLevels_<i>',
};

export const REDESIGN_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].doorKillsLeft': [raw('KLA_{i}', 'json')],
  'account.statues': [raw('StuG', 'json')],
};

export const REDESIGN_FIELD_SECTIONS: Record<string, string[]> = {
  'characters[].talents.starPoints': STAR_TOTAL_SECTIONS,
  'account.statues': ['statues'],
};
