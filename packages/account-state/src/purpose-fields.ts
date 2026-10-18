// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M4's Purpose fields come from (M4 TR-2, M1 TR-11): Toolbox paths for provenance, the raw save
// keys behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const PURPOSE_FIELD_SOURCES: Record<string, string> = {
  'characters[].classExp': 'characters[i].skillsInfo.character (level, exp, expReq)',
  'characters[].fighting':
    'getMaxDamage(character) on the saved map; monsters[targetMonster].ExpGiven × getClassExpMulti(character)',
  'characters[].tools': 'characters[i].tools[].rawName',
  'characters[].portalKillsLeft': 'raw KLA_{i}[mapIndex] (KillsLeft2Advance on the current map)',
  'account.deathNote': 'account.deathNote[world].mobs (rawName, kills)',
  'account.vault':
    'account.upgradeVault.vaultTotalKills, account.upgradeVault.upgrades (name, level, maxLevel)',
};

export const PURPOSE_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].classExp': [raw('Lv0_{i}', 'json'), raw('Exp0_{i}', 'json'), raw('ExpReq0_{i}', 'json')],
  'characters[].fighting': [raw('AFKtarget_{i}', 'string'), raw('CurrentMap_{i}', 'number')],
  'characters[].tools': [raw('EquipOrder_{i}', 'json')],
  'characters[].portalKillsLeft': [raw('KLA_{i}', 'json'), raw('CurrentMap_{i}', 'number')],
  'account.deathNote': [raw('KLA_*', 'json')],
  'account.vault': [raw('KLA_*', 'json')],
};

/** `getMaxDamage` reads the same sections as M2's frontier (fields.ts FRONTIER_SECTIONS), added there. */
export const PURPOSE_FIELD_SECTIONS: Record<string, string[]> = {
  'account.deathNote': ['deathNote'],
  'account.vault': ['upgradeVault'],
};
