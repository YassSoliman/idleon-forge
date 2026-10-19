// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Class and skill icons by name (ADR 0009 as amended 2026-10-19). The game draws both from one sprite
// family, data/ClassIcons<i>, where <i> is the entry's place in the game's class list (Toolbox
// website-data shared-data.json `classes`, pinned commit 6c37e3d): classes first, then the skills from
// index 42 (Mining) on. Views hold the class's label ("Beast Master") and the skill's id ("catching"),
// so this table turns those into the index; a name it doesn't know draws our own sprite instead.
import type { GameArt } from './game-art';

/** The game's class list in order (shared-data.json `classes`); "Nope" and "Filler" are unused slots. */
const CLASS_LIST = [
  '0',
  'Beginner',
  'Journeyman',
  'Maestro',
  'Voidwalker',
  'Infinilyte',
  'Rage_Basics',
  'Warrior',
  'Barbarian',
  'Squire',
  'Blood_Berserker',
  'Nope',
  'Divine_Knight',
  'Nope',
  'Death_Bringer',
  'Filler',
  'Royal_Guardian',
  'Filler',
  'Calm_Basics',
  'Archer',
  'Bowman',
  'Hunter',
  'Siege_Breaker',
  'Nope',
  'Nope',
  'Beast_Master',
  'Filler',
  'Filler',
  'Filler',
  'Wind_Walker',
  'Savvy_Basics',
  'Mage',
  'Wizard',
  'Shaman',
  'Elemental_Sorcerer',
  'Spiritual_Monk',
  'Bubonic_Conjuror',
  'Nope',
  'Filler',
  'Filler',
  'Arcane_Cultist',
  'Filler',
  'Mining',
  'Smithing',
  'Chopping',
  'Fishing',
  'Alchemy',
  'Bug_Catching',
  'Trapping',
  'Construction',
  'Worship',
  'Cooking',
  'Breeding',
  'Laboratory',
  'Sailing',
  'Divinity',
  'Gaming',
  'Farming',
  'Sneaking',
  'Summoning',
  'Spelunking',
  'Research',
] as const;

const INDEX: ReadonlyMap<string, number> = new Map(
  CLASS_LIST.map((n, i) => [n.toLowerCase(), i] as const).filter(
    ([n]) => n !== 'nope' && n !== 'filler' && n !== '0',
  ),
);
/** Spellings ActiveOn uses that differ from the game's list. */
const ALIAS: Readonly<Record<string, string>> = {
  bubonic_conjurer: 'bubonic_conjuror',
  catching: 'bug_catching',
  lab: 'laboratory',
};

const key = (label: string) => {
  const k = label
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return ALIAS[k] ?? k;
};

/** The class index the game draws a class label with ("Beast Master" -> 25), or null. */
export function classIndexOf(label: string | null | undefined): number | null {
  if (!label) return null;
  const i = INDEX.get(key(label));
  return i !== undefined && i < 42 ? i : null;
}

/** A class's game icon by its label ("Beast Master"). */
export function classArtOf(label: string | null | undefined): GameArt | null {
  const i = classIndexOf(label);
  return i === null ? null : { path: `data/ClassIcons${i}` };
}

/** A skill's game icon by its id ("mining", "catching", "laboratory"). */
export function skillArt(skill: string | null | undefined): GameArt | null {
  if (!skill) return null;
  const i = INDEX.get(key(skill));
  return i !== undefined && i >= 42 ? { path: `data/ClassIcons${i}` } : null;
}

/** The game's display name for a class label, as the wiki titles it ("Beast_Master"). */
export const classWikiName = (label: string) => label.trim().replace(/\s+/g, '_');
