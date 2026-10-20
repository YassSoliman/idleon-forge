// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where every Account State field comes from, and how to tell whether one can be trusted (M1 TR-11).
// Field paths are written with the character slot: `characters[3].afkTarget`. In these tables the
// slot is left out (`characters[].afkTarget`); `{i}` in a raw key stands for the slot, and a key
// ending in `_*` means that key for every character slot with data.
import type { SideReadName } from '@idleon-forge/toolbox-parsers';
import { ALCHEMY_FIELD_RAW_KEYS, ALCHEMY_FIELD_SECTIONS, ALCHEMY_FIELD_SOURCES } from './alchemy-fields';
import { BUBBA_FIELD_RAW_KEYS, BUBBA_FIELD_SECTIONS, BUBBA_FIELD_SOURCES } from './bubba-fields';
import {
  COLLECTIONS_FIELD_RAW_KEYS,
  COLLECTIONS_FIELD_SECTIONS,
  COLLECTIONS_FIELD_SOURCES,
} from './collections-fields';
import { DEPTH_FIELD_RAW_KEYS, DEPTH_FIELD_SECTIONS, DEPTH_FIELD_SOURCES } from './depth-fields';
import { ELITE_FIELD_RAW_KEYS, ELITE_FIELD_SECTIONS, ELITE_FIELD_SOURCES } from './elite-fields';
import { GEAR_FIELD_RAW_KEYS, GEAR_FIELD_SECTIONS, GEAR_FIELD_SOURCES } from './gear-fields';
import {
  PRODUCTION_FIELD_RAW_KEYS,
  PRODUCTION_FIELD_SECTIONS,
  PRODUCTION_FIELD_SOURCES,
} from './production-fields';
import { PURPOSE_FIELD_RAW_KEYS, PURPOSE_FIELD_SECTIONS, PURPOSE_FIELD_SOURCES } from './purpose-fields';
import { REDESIGN_FIELD_RAW_KEYS, REDESIGN_FIELD_SECTIONS, REDESIGN_FIELD_SOURCES } from './redesign-fields';
import { RIFT_FIELD_RAW_KEYS, RIFT_FIELD_SECTIONS, RIFT_FIELD_SOURCES } from './rift-fields';
import { SLOTS_FIELD_RAW_KEYS, SLOTS_FIELD_SECTIONS, SLOTS_FIELD_SOURCES } from './slots-fields';
import { SPEND_FIELD_SECTIONS, SPEND_FIELD_SOURCES } from './spend-fields';
import {
  STARSIGNS_FIELD_RAW_KEYS,
  STARSIGNS_FIELD_SECTIONS,
  STARSIGNS_FIELD_SOURCES,
} from './starsigns-fields';
import { TALENT_FIELD_RAW_KEYS, TALENT_FIELD_SECTIONS, TALENT_FIELD_SOURCES } from './talent-fields';
import { TALENT_POINT_FIELD_RAW_KEYS, TALENT_POINT_FIELD_SOURCES } from './talent-points-fields';
import { TOME_FIELD_RAW_KEYS, TOME_FIELD_SECTIONS, TOME_FIELD_SOURCES } from './tome-fields';
import type { AccountState } from './types';
import {
  UNSPENT_FIELD_RAW_KEYS,
  UNSPENT_FIELD_SECTIONS,
  UNSPENT_FIELD_SIDE_READS,
  UNSPENT_FIELD_SOURCES,
} from './unspent-fields';
import { W23_FIELD_SECTIONS, W23_FIELD_SOURCES } from './w23-fields';
import {
  WALKTHROUGH_FIELD_RAW_KEYS,
  WALKTHROUGH_FIELD_SECTIONS,
  WALKTHROUGH_FIELD_SOURCES,
} from './walkthrough-fields';
import { WORLD4_FIELD_RAW_KEYS, WORLD4_FIELD_SECTIONS, WORLD4_FIELD_SOURCES } from './world4-fields';

/** How a raw save value must look to count as present. Firestore keeps many values as JSON strings. */
export type RawKind = 'number' | 'string' | 'json';

export interface RawKeySpec {
  key: string;
  kind: RawKind;
}

const raw = (key: string, kind: RawKind): RawKeySpec => ({ key, kind });

/** Account State path -> Toolbox path, for provenance (the save fields behind a Next Action). */
export const FIELD_SOURCES: Record<string, string> = {
  ...SPEND_FIELD_SOURCES,
  'account.currentWorld': 'account.currentWorld',
  'account.finishedWorlds': 'account.finishedWorlds',
  'account.lastCloudSave': 'account.timeAway.GlobalTime',
  'account.secondsSinceLastSave': 'account.timeAway.GlobalTime',
  'account.dailyResetInSeconds': 'account.timeAway.ShopRestock',
  'account.accountLevel': 'account.accountLevel',
  'account.gameVersion.serverBuild': 'account.serverVars.GameVERSION',
  'account.gameVersion.saveVersion': 'CSver (raw save)',
  'account.gameVersion.parserTarget': 'UPSTREAM gameVersion',
  'characters[].name': 'characters[i].name',
  'characters[].class': 'characters[i].class',
  'characters[].level': 'characters[i].level',
  'characters[].afkType': 'characters[i].afkType',
  'characters[].afkTarget': 'characters[i].afkTarget',
  'characters[].currentMap': 'characters[i].currentMap',
  'characters[].foodStacks': 'characters[i].food',
  'characters[].secondsSinceLastSave': 'characters[i].afkTime',
  lastPlayedCharacterIndex: 'characters[i].afkTime, account.timeAway.GlobalTime',
  // M2 Stage & Meta Path (M2 TR-3)
  'characters[].classIndex': 'characters[i].classIndex',
  'characters[].npcDialog': 'characters[i].npcDialog',
  'characters[].nextPortal': 'characters[i].nextPortal',
  'account.buildings': 'account.towers.data',
  'account.salts': 'account.refinery.salts',
  'account.gateQuests': 'account.quests',
  'account.worldCrystals': 'account.storage.list, characters[i].inventory',
  'account.frontier': 'getMaxDamage on a frontier clone, KillsLeft2Advance (M2 TR-2)',
  // ---- M3 AFK Safety (M3 TR-2) ----
  'characters[].afk': 'characters[i].afkTime (afkSince)',
  'characters[].afk.food': 'characters[i].food',
  'characters[].afk.fighting':
    'getMaxDamage(character), getMaxDamage({ ...character, food: [] }) and a food clone',
  'characters[].afk.inventory': 'characters[i].inventory, inventorySlots, getItemCapacity',
  'characters[].afk.anvil': 'getPlayerAnvil, getTimeTillCap (with and without fromZero)',
  'characters[].afk.anvilPlan':
    'characters[i].anvil.anvilStats, skillsInfo.smithing.level, getPlayerAnvil at counterfactual points (#70)',
  'characters[].afk.worship': 'characters[i].worship (getPlayerWorship), characters[i].tools',
  'characters[].afk.prayers': 'characters[i].activePrayers, getPrayerBonusAndCurse',
  'characters[].afk.traps': 'account.traps[i] (timeLeft, re-anchored to the cloud save)',
  'characters[].afk.cauldronAssigned': 'account.alchemy.activities',
  'account.afk': 'account.timeAway.GlobalTime (projectedAt)',
  'account.afk.arcade': 'account.timeAway.Arcade, getMaxClaimTime',
  'account.afk.liquids': 'account.alchemy.liquids, account.alchemy.liquidCauldrons[].maxLiquid',
  'account.afk.salts': 'getSaltMatsTimeLeft',
  'account.afk.storageFreeSlots': 'account.storage.slots, account.storage.list',
  'account.afk.coins': 'account.currencies.rawMoney',
  ...UNSPENT_FIELD_SOURCES,
  ...TALENT_FIELD_SOURCES,
  ...COLLECTIONS_FIELD_SOURCES,
  ...WALKTHROUGH_FIELD_SOURCES,
  ...DEPTH_FIELD_SOURCES,
  ...STARSIGNS_FIELD_SOURCES,
  ...SLOTS_FIELD_SOURCES,
  ...PURPOSE_FIELD_SOURCES,
  ...ALCHEMY_FIELD_SOURCES,
  ...GEAR_FIELD_SOURCES,
  ...REDESIGN_FIELD_SOURCES,
  ...BUBBA_FIELD_SOURCES,
  ...WORLD4_FIELD_SOURCES,
  ...RIFT_FIELD_SOURCES,
  ...TOME_FIELD_SOURCES,
  ...ELITE_FIELD_SOURCES,
  ...PRODUCTION_FIELD_SOURCES,
  ...W23_FIELD_SOURCES,
  ...TALENT_POINT_FIELD_SOURCES,
};

/** The raw save keys each field depends on. A missing or unparseable key makes the field Unknown. */
export const FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.currentWorld': [raw('OptLacc', 'json'), raw('NPCdialogue_*', 'json')],
  'account.finishedWorlds': [raw('OptLacc', 'json'), raw('NPCdialogue_*', 'json')],
  'account.lastCloudSave': [raw('TimeAway', 'json')],
  'account.secondsSinceLastSave': [raw('TimeAway', 'json')],
  'account.dailyResetInSeconds': [raw('TimeAway', 'json')],
  'account.accountLevel': [raw('Lv0_*', 'json')],
  'account.gameVersion.saveVersion': [raw('CSver', 'number')],
  'characters[].class': [raw('CharacterClass_{i}', 'number')],
  'characters[].level': [raw('Lv0_{i}', 'json')],
  'characters[].afkType': [raw('AFKtarget_{i}', 'string')],
  'characters[].afkTarget': [raw('AFKtarget_{i}', 'string')],
  'characters[].currentMap': [raw('CurrentMap_{i}', 'number')],
  'characters[].foodStacks': [raw('EquipOrder_{i}', 'json'), raw('EquipQTY_{i}', 'json')],
  'characters[].secondsSinceLastSave': [raw('PTimeAway_{i}', 'number')],
  lastPlayedCharacterIndex: [raw('TimeAway', 'json'), raw('PTimeAway_*', 'number')],
  // M2 Stage & Meta Path (M2 TR-3)
  'characters[].classIndex': [raw('CharacterClass_{i}', 'number')],
  'characters[].npcDialog': [raw('NPCdialogue_{i}', 'json')],
  'characters[].nextPortal': [raw('KLA_{i}', 'json'), raw('CurrentMap_{i}', 'number')],
  'account.frontier': [raw('KLA_*', 'json')],
  // ---- M3 AFK Safety (M3 TR-2) ----
  'characters[].afk': [raw('PTimeAway_{i}', 'number')],
  'characters[].afk.food': [raw('EquipOrder_{i}', 'json'), raw('EquipQTY_{i}', 'json')],
  'account.afk': [raw('TimeAway', 'json')],
  ...UNSPENT_FIELD_RAW_KEYS,
  ...TALENT_FIELD_RAW_KEYS,
  ...COLLECTIONS_FIELD_RAW_KEYS,
  ...WALKTHROUGH_FIELD_RAW_KEYS,
  ...DEPTH_FIELD_RAW_KEYS,
  ...STARSIGNS_FIELD_RAW_KEYS,
  ...SLOTS_FIELD_RAW_KEYS,
  ...PURPOSE_FIELD_RAW_KEYS,
  ...ALCHEMY_FIELD_RAW_KEYS,
  ...GEAR_FIELD_RAW_KEYS,
  ...REDESIGN_FIELD_RAW_KEYS,
  ...BUBBA_FIELD_RAW_KEYS,
  ...WORLD4_FIELD_RAW_KEYS,
  ...RIFT_FIELD_RAW_KEYS,
  ...TOME_FIELD_RAW_KEYS,
  ...ELITE_FIELD_RAW_KEYS,
  ...PRODUCTION_FIELD_RAW_KEYS,
  ...TALENT_POINT_FIELD_RAW_KEYS,
};

/** The account sections `getMaxDamage` reads at the pin (damage.ts, 6c37e3d), for `account.frontier`. */
export const FRONTIER_SECTIONS = [
  'achievements',
  'alchemy',
  'arcade',
  'breeding',
  'bribes',
  'cards',
  'companions',
  'deathNote',
  'divinity',
  'dungeons',
  'equinox',
  'farming',
  // M26 FR-8: getMaxDamage reads these too (misc.ts friend bonuses; damage.ts gearBonus has the gallery
  // and the hat rack), so a failure in one of them can't feed a kill rate either.
  'friendBonusStats',
  'gallery',
  'grimoire',
  'guild',
  'hatRack',
  'hole',
  'islands',
  'kangaroo',
  'killroy',
  'lab',
  'obols',
  'owl',
  'prayers',
  'refinery',
  'rift',
  'sailing',
  'saltLick',
  'shrines',
  'stamps',
  'statues',
  'tome',
  'towers',
  'upgradeVault',
];

/**
 * The Toolbox `safeSection`s each field is computed in. None of today's fields is: characters, worlds
 * and time away are parsed outside any section, so a section failure can't fall back under them.
 * Fields added later (stamps, obols, ...) list theirs here.
 */
export const FIELD_SECTIONS: Record<string, string[]> = {
  // M2 Stage & Meta Path (M2 TR-3)
  'account.buildings': ['towers'],
  'account.salts': ['refinery'],
  'account.gateQuests': ['quests'],
  'account.worldCrystals': ['storage'],
  /** The sections Toolbox's damage.ts reads off the account at the pin (M2 TR-2); a kill rate is never taken from a fallback. */
  'account.frontier': FRONTIER_SECTIONS,
  // ---- M3 AFK Safety (M3 TR-2): getMaxDamage reads the same sections as M2's frontier ----
  'characters[].afk.fighting': [...FRONTIER_SECTIONS, 'storage'],
  'characters[].afk.inventory': ['stamps', 'gemShopPurchases', 'lab', 'upgradeVault', 'bundlesOwned'],
  'characters[].afk.anvil': ['stamps', 'alchemy', 'statues', 'starSigns', 'upgradeVault'],
  'characters[].afk.anvilPlan': ['stamps', 'alchemy', 'statues', 'starSigns', 'upgradeVault'],
  'characters[].afk.worship': ['alchemy', 'cards', 'stamps', 'upgradeVault', 'arcade'],
  'characters[].afk.prayers': ['prayers'],
  'characters[].afk.traps': ['traps'],
  'characters[].afk.cauldronAssigned': ['alchemy'],
  'account.afk.arcade': ['arcade', 'stamps'],
  'account.afk.liquids': ['alchemy', 'alchemy.liquidCauldrons'],
  'account.afk.salts': ['refinery', 'storage'],
  'account.afk.storageFreeSlots': ['storage'],
  ...UNSPENT_FIELD_SECTIONS,
  ...TALENT_FIELD_SECTIONS,
  ...COLLECTIONS_FIELD_SECTIONS,
  ...SPEND_FIELD_SECTIONS,
  ...WALKTHROUGH_FIELD_SECTIONS,
  ...DEPTH_FIELD_SECTIONS,
  ...STARSIGNS_FIELD_SECTIONS,
  ...SLOTS_FIELD_SECTIONS,
  ...PURPOSE_FIELD_SECTIONS,
  ...ALCHEMY_FIELD_SECTIONS,
  ...GEAR_FIELD_SECTIONS,
  ...REDESIGN_FIELD_SECTIONS,
  ...BUBBA_FIELD_SECTIONS,
  ...WORLD4_FIELD_SECTIONS,
  ...RIFT_FIELD_SECTIONS,
  ...TOME_FIELD_SECTIONS,
  ...ELITE_FIELD_SECTIONS,
  ...PRODUCTION_FIELD_SECTIONS,
  ...W23_FIELD_SECTIONS,
  // M4 TR-2: the current-map rate is getMaxDamage, which reads the frontier's sections.
  'characters[].fighting': [...FRONTIER_SECTIONS, 'storage'],
};

/** The side reads each field depends on. */
export const FIELD_SIDE_READS: Record<string, SideReadName[]> = {
  'account.gameVersion.serverBuild': ['serverVars'],
  'characters[].name': ['charNames'],
  ...UNSPENT_FIELD_SIDE_READS,
};

/** `characters[3].foodStacks[0].item` -> `characters[].foodStacks[].item`. */
export const fieldTemplate = (path: string): string => path.replace(/\[\d+\]/g, '[]');

/** The declared field a path belongs to (the path itself, or the field it is inside of). */
export function declaredField(path: string): string | null {
  const template = fieldTemplate(path);
  let best: string | null = null;
  for (const field of Object.keys(FIELD_SOURCES)) {
    const inside = template === field || template.startsWith(`${field}.`) || template.startsWith(`${field}[`);
    if (inside && (best === null || field.length > best.length)) best = field;
  }
  return best;
}

const overlaps = (a: string, b: string) =>
  a === b || a.startsWith(`${b}.`) || a.startsWith(`${b}[`) || b.startsWith(`${a}.`) || b.startsWith(`${a}[`);

/**
 * Whether a Detector may decide from `path` (e.g. `characters[2].afkTarget`). False when the field's
 * raw key was missing or its id unknown (`diagnostics.unknownFields`), its character couldn't be read,
 * a parser section or side read it depends on failed, or the path is not a declared field.
 */
export function isKnown(state: AccountState, path: string): boolean {
  const d = state.diagnostics;
  const field = declaredField(path);
  if (field === null) return false;
  const slot = /^characters\[(\d+)\]/.exec(path)?.[1];
  if (slot !== undefined) {
    const index = Number(slot);
    if (d.unreadableCharacters.includes(index)) return false;
    if (!state.characters.some((c) => c.index === index)) return false;
  }
  if (d.unknownFields.some((f) => overlaps(path, f))) return false;
  if (FIELD_SECTIONS[field]?.some((s) => d.failedSections.includes(s))) return false;
  if (FIELD_SIDE_READS[field]?.some((r) => d.failedSideReads.includes(r))) return false;
  return true;
}
