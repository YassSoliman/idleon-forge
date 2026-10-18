// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M8's collections fields come from (M8 TR-15, M1 TR-11): Toolbox paths for provenance, the raw
// save keys behind each, and the parser sections they are computed in. Merged into fields.ts's tables.
// Each section list includes the ones Toolbox silently defaults to empty on failure (M8 FR-26), so a
// failed read is "unknown", never "you have none".
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });

export const COLLECTIONS_FIELD_SOURCES: Record<string, string> = {
  'account.stampLevels': 'account.stamps[tab][].{rawName,level,maxLevel}',
  'account.storageItems': 'account.storage.list',
  'account.refineryStorage': 'account.refinery.refineryStorage',
  'account.bankCoins': 'account.currencies.bankMoney',
  'account.shopStock': 'raw ShopStock with shared-data shops (toolboxCalls.shopStockAll)',
  'account.heldItemTypes':
    'account.storage.list, account.refinery.refineryStorage, characters[i].inventory (typeGen)',
  'account.cards': 'account.cards',
  'account.cardSets': 'getCardSets(account)',
  'account.familyObols': 'account.obols.list',
  'account.storedObols': 'account.obols.inventory',
  'account.obolDropMerit': 'account.tasks[2][1][0]',
  'characters[].quests': 'characters[i].quests',
  'characters[].inventoryItems': 'characters[i].inventory',
  'characters[].freeInventorySlots': 'characters[i].inventorySlots, characters[i].inventory',
  'characters[].carryPerSlot': 'getItemCapacity(typeGen, character, account)',
  'characters[].money': 'characters[i].money',
  'characters[].smithingLevel': 'characters[i].skillsInfo.smithing.level',
  'characters[].targetMonster': 'characters[i].targetMonster',
  'characters[].cardLoadout':
    'characters[i].cards.equippedCards, .cards.cardSet, characters[i].cardPresets, .selectedCardPreset',
  'characters[].personalObols': 'characters[i].obols.list',
};

export const COLLECTIONS_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.stampLevels': [raw('StampLv', 'json'), raw('StampLvM', 'json')],
  'account.storageItems': [raw('ChestOrder', 'json'), raw('ChestQuantity', 'json')],
  'account.refineryStorage': [raw('Refinery', 'json')],
  'account.bankCoins': [raw('MoneyBANK', 'number')],
  'account.shopStock': [raw('ShopStock', 'json')],
  'account.cards': [raw('Cards0', 'json')],
  'account.cardSets': [raw('Cards0', 'json')],
  'account.familyObols': [raw('ObolEqO1', 'json')],
  'account.storedObols': [raw('ObolInvOr', 'json')],
  'account.obolDropMerit': [raw('TaskZZ2', 'json')],
  'characters[].quests': [raw('QuestComplete_{i}', 'json')],
  'characters[].inventoryItems': [raw('InventoryOrder_{i}', 'json'), raw('ItemQTY_{i}', 'json')],
  'characters[].freeInventorySlots': [raw('InventoryOrder_{i}', 'json')],
  'characters[].carryPerSlot': [raw('MaxCarryCap_{i}', 'json')],
  'characters[].money': [raw('Money_{i}', 'number')],
  'characters[].smithingLevel': [raw('Lv0_{i}', 'json')],
  'characters[].targetMonster': [raw('AFKtarget_{i}', 'string')],
  'characters[].cardLoadout': [raw('CardEquip_{i}', 'json'), raw('CardPreset_{i}', 'json')],
  'characters[].personalObols': [raw('ObolEqO0_{i}', 'json')],
};

export const COLLECTIONS_FIELD_SECTIONS: Record<string, string[]> = {
  'account.stampLevels': ['stamps'],
  'account.storageItems': ['storage'],
  'account.refineryStorage': ['refinery'],
  'account.bankCoins': ['currencies'],
  'account.shopStock': ['shopStock'],
  'account.heldItemTypes': ['storage', 'refinery'],
  'account.cards': ['cards'],
  'account.cardSets': ['cards'],
  'account.familyObols': ['obols'],
  'account.storedObols': ['obols'],
  'account.obolDropMerit': ['tasks'],
  'characters[].quests': ['quests'],
  'characters[].carryPerSlot': ['stamps', 'gemShopPurchases', 'lab', 'upgradeVault', 'bundlesOwned'],
  'characters[].cardLoadout': ['cards'],
  'characters[].personalObols': ['obols'],
};
