// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where M6's unspent-and-idle fields come from (M6 TR-3, M1 TR-11): Toolbox paths for provenance, the
// raw save keys behind each, the parser sections they are computed in, and the side reads they need.
// Merged into fields.ts's tables.
import type { SideReadName } from '@idleon-forge/toolbox-parsers';
import type { RawKeySpec } from './fields';

const raw = (key: string, kind: RawKeySpec['kind']): RawKeySpec => ({ key, kind });
const OPT = raw('OptLacc', 'json');

export const UNSPENT_FIELD_SOURCES: Record<string, string> = {
  'account.highestLevel': 'characters[i].level',
  'account.alchemy':
    'account.alchemy.cauldrons, .bubbles, .bubblesFlat, .vials, .p2w.vialsAttempts; storage, inventories',
  'account.bigBubbleSlots':
    'account.bribes[Changing_the_Code].done, account.accountOptions (OLA.ARENA_MAX_WAVE)',
  'account.merits': 'account.tasks[4], account.tasks[2], account.meritsDescriptions',
  'account.taskUnlocks': 'account.taskUnlocks',
  'account.gems': 'account.currencies.gems',
  'account.gemPurchases': 'account.gemShopPurchases',
  'account.keys':
    'account.currencies.KeysAll, account.accountOptions (OLA.KEYS_*_DAYS), characters[i].npcDialog',
  'account.colosseumTickets': 'account.accountOptions (OLA.TICKETS_*_DAYS), account.finishedWorlds',
  'account.minigames': 'account.accountOptions, account.currencies.minigamePlays, account.highscores',
  'account.pets': 'account.companions (companion side read)',
  'account.petMart':
    'account.accountOptions (OLA.PET_MART_LAST_CLAIMED_DAY), account.tournament.global.S, account.serverVars.GemPM_x',
  'account.postOffice':
    'characters[i].questComplete.Postboy_Pablob1, account.postOfficeShipments, account.timeAway.PostOfficeRefresh',
  'account.poppy':
    'account.kangaroo (upgrades, tarUpgrades, resetBonuses, allMultipliers, bonuses, fish, totalFish, fishRate), accountOptions[274], [279], [281..286]',
  'account.deathNoteBuilding':
    'account.towers.data[Death_Note], account.storage, account.refinery.refineryStorage',
  'characters[].bigBubbles': 'characters[i].equippedBubbles',
  'characters[].postOfficeUnspent': 'characters[i].postOffice.unspentPoints',
  'characters[].anvilPointsAvailable':
    'characters[i].skillsInfo.smithing.level + anvil.anvilStats (pointsFromCoins, pointsFromMats, pointsFromAcme) - spent; else availablePoints',
};

export const UNSPENT_FIELD_RAW_KEYS: Record<string, RawKeySpec[]> = {
  'account.alchemy': [raw('CauldronInfo', 'json'), raw('CauldronP2W', 'json')],
  'account.bigBubbleSlots': [raw('BribeStatus', 'json'), OPT],
  'account.merits': [raw('TaskZZ2', 'json'), raw('TaskZZ4', 'json')],
  'account.taskUnlocks': [raw('TaskZZ3', 'json'), raw('TaskZZ4', 'json')],
  'account.gemPurchases': [raw('GemItemsPurchased', 'json')],
  'account.keys': [OPT],
  'account.colosseumTickets': [OPT],
  'account.minigames': [OPT],
  'account.petMart': [OPT],
  'account.deathNoteBuilding': [raw('Tower', 'json')],
};

export const UNSPENT_FIELD_SECTIONS: Record<string, string[]> = {
  'account.alchemy': ['alchemy', 'alchemy.cauldrons', 'storage'],
  'account.bigBubbleSlots': ['bribes'],
  'account.merits': ['tasks'],
  'account.taskUnlocks': ['tasks'],
  'account.gems': ['currencies'],
  'account.gemPurchases': ['gemShopPurchases'],
  'account.keys': ['currencies', 'currencies.KeysAll'],
  'account.colosseumTickets': ['currencies.ColosseumTickets'],
  'account.minigames': ['currencies', 'highscores'],
  'account.pets': ['companions'],
  'account.petMart': ['tournament'],
  'account.postOffice': ['postOfficeShipments'],
  'account.poppy': ['kangaroo'],
  'account.deathNoteBuilding': ['towers', 'storage', 'refinery'],
};

export const UNSPENT_FIELD_SIDE_READS: Record<string, SideReadName[]> = {
  'account.pets': ['companion'],
  'account.petMart': ['tournament', 'serverVars'],
};
