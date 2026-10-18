// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M14's walkthrough fields come from (M14 TR-2, M1 TR-11): Toolbox paths for provenance, the raw
// save keys behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
// The holdings and quest rows M14 also reads are M8's (collections-fields.ts).
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const WALKTHROUGH_FIELD_SOURCES: Record<string, string> = {
  'account.anvilTabsOwned': 'raw CYAnvilTabsOwned',
  'account.forgeOutput': 'account.forge.list[].bar',
  'account.printer':
    'account.printer, account.towers.data[3D_Printer], account.gemShopPurchases[111, 112], getPrinterMulti',
  'account.supplyRates':
    'frontierRates and getDropRate on the clone moved to each supply map (worker, M14 TR-3)',
  'characters[].mapIndex': 'characters[i].mapIndex',
  'characters[].skillLevels': 'characters[i].skillsInfo.{mining,chopping,fishing,catching}.level',
  'characters[].skillEfficiency':
    'getSkillEfficiency(skill, character, characters, account, getMaxDamage(...))',
  'characters[].anvilSpeed': 'getPlayerAnvil(character, characters, account).stats.anvilSpeed',
  'characters[].talentPresets': 'characters[i].selectedTalentPreset, .talents, .talentPreset.talents',
  'characters[].cardPresets': 'characters[i].selectedCardPreset, .cardPresets, account.gemShopPurchases[66]',
};

export const WALKTHROUGH_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.anvilTabsOwned': [raw('CYAnvilTabsOwned', 'number')],
  'account.forgeOutput': [raw('ForgeItemOrder', 'json')],
  'account.printer': [raw('Print', 'json'), raw('Tower', 'json')],
  'characters[].mapIndex': [raw('CurrentMap_{i}', 'number')],
  'characters[].skillLevels': [raw('Lv0_{i}', 'json')],
  'characters[].skillEfficiency': [raw('Lv0_{i}', 'json')],
  'characters[].talentPresets': [raw('SL_{i}', 'json')],
  'characters[].cardPresets': [raw('CardPreset_{i}', 'json')],
};

export const WALKTHROUGH_FIELD_SECTIONS: Record<string, string[]> = {
  'account.forgeOutput': ['forge'],
  'account.printer': ['printer', 'towers'],
  'characters[].cardPresets': ['cards'],
};
