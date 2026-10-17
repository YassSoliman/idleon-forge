// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Where every Account State field comes from, and how to tell whether one can be trusted (M1 TR-11).
// Field paths are written with the character slot: `characters[3].afkTarget`. In these tables the
// slot is left out (`characters[].afkTarget`); `{i}` in a raw key stands for the slot, and a key
// ending in `_*` means that key for every character slot with data.
import type { SideReadName } from '@idleon-forge/toolbox-parsers';
import type { AccountState } from './types';

/** How a raw save value must look to count as present. Firestore keeps many values as JSON strings. */
export type RawKind = 'number' | 'string' | 'json';

export interface RawKeySpec {
  key: string;
  kind: RawKind;
}

const raw = (key: string, kind: RawKind): RawKeySpec => ({ key, kind });

/** Account State path -> Toolbox path, for provenance (the save fields behind a Next Action). */
export const FIELD_SOURCES: Record<string, string> = {
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
};

/**
 * The Toolbox `safeSection`s each field is computed in. None of today's fields is: characters, worlds
 * and time away are parsed outside any section, so a section failure can't fall back under them.
 * Fields added later (stamps, obols, ...) list theirs here.
 */
export const FIELD_SECTIONS: Record<string, string[]> = {};

/** The side reads each field depends on. */
export const FIELD_SIDE_READS: Record<string, SideReadName[]> = {
  'account.gameVersion.serverBuild': ['serverVars'],
  'characters[].name': ['charNames'],
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
