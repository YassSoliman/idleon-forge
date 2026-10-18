// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where the exact talent point fields come from (ADR 0010, M1 TR-11): Toolbox paths for provenance,
// the raw save keys behind each, and the parser sections the Toolbox terms are computed in. Merged
// into fields.ts's tables.
import type { RawKeySpec } from './fields';
import { STAR_TOTAL_SECTIONS } from './redesign-fields';
import type { TabKey } from './talent-types';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

/** Per tab, the account sections its Toolbox terms read (toolbox-parsers talent-points.ts). */
export const TALENT_POINT_SECTIONS: Record<TabKey, readonly string[]> = {
  1: [
    'alchemy',
    'starSigns',
    'lab',
    'stamps',
    'dungeons',
    'arcade',
    'breeding',
    'upgradeVault',
    'companions',
  ],
  2: ['alchemy', 'stamps', 'dungeons', 'breeding', 'upgradeVault', 'companions'],
  3: ['alchemy', 'stamps', 'dungeons', 'breeding', 'upgradeVault', 'companions'],
  4: ['alchemy', 'stamps', 'dungeons', 'breeding', 'companions'],
  5: [
    'stamps',
    'dungeons',
    'companions',
    'grimoire',
    'compass',
    'tesseract',
    'royalGuardian',
    'jellyOperator',
    'spelunking',
  ],
  star: STAR_TOTAL_SECTIONS,
};

const SOURCE =
  'game TotalTalentPoints (N.js) over raw Lv0_<i>, CYTalentPoints, AchieveReg, OptLacc[436|158], TaskZZ2, Spelunk and toolboxCalls.talentPointTerms (bubbles, vials, star signs, stamps, shinies, Vault, companions, talents); star tab: calcTotalStarTalent';
const KEYS = [
  raw('Lv0_{i}', 'json'),
  raw('CYTalentPoints', 'json'),
  raw('AchieveReg', 'json'),
  raw('OptLacc', 'json'),
];

/**
 * Per-tab section failures turn only that tab to `bound` (TALENT_POINT_SECTIONS), so no section is
 * declared for the whole field: a failed Lab must not hide tabs 2–5.
 */
export const TALENT_POINT_FIELD_SOURCES: Record<string, string> = {
  'characters[].talents.active.talentPoints': SOURCE,
  'characters[].talents.other.talentPoints': `${SOURCE}; the other preset's talents (talentPreset)`,
};

export const TALENT_POINT_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].talents.active.talentPoints': KEYS,
  'characters[].talents.other.talentPoints': KEYS,
};
