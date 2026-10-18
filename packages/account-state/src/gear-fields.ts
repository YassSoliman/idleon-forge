// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M18's fields come from (M18 TR-2, M1 TR-11): Toolbox paths for provenance, the raw save keys
// behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const GEAR_FIELD_SOURCES: Record<string, string> = {
  'characters[].gear':
    'characters[i].equipment[0..7], characters[i].tools[0..3] (createItemsWithUpgrades: item data with stones)',
  'account.gearItems':
    'base stats (stones taken off via changes) of characters[i].equipment, .tools, account.storage.list, characters[i].inventory',
  'account.anvilRecipes': 'raw AnvilCraftStatus ([tab][recipe]: -1 locked, 0 available, 1 crafted)',
  'account.armorSmithy':
    'account.armorSmithy (getArmorSmithy: isSmithyUnlocked, smithyUnlocked, days, unlockedSets)',
};

export const GEAR_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'characters[].gear': [raw('EquipOrder_{i}', 'json')],
  'account.gearItems': [raw('ChestOrder', 'json'), raw('InventoryOrder_*', 'json')],
  'account.anvilRecipes': [raw('AnvilCraftStatus', 'json')],
  'account.armorSmithy': [raw('OptLacc', 'json')],
};

export const GEAR_FIELD_SECTIONS: Record<string, string[]> = {
  'account.gearItems': ['storage'],
  'account.armorSmithy': ['armorSmithy'],
};
