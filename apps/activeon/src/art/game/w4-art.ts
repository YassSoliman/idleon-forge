// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// World 4's game sprites (M25, ADR 0009 as amended 2026-10-19), named as IdleOn Toolbox draws them
// (components/account/Worlds/World4/*): a class icon data/ClassIcons<class index>, a meal
// data/CookingMB<i>, a spice data/CookingSpice<i>, a chip data/ConsoleChip<i>, a jewel data/ConsoleJwl<i>,
// a Lab bonus data/LabBonus<i>, a Breeding upgrade data/PetUpg<i - 1>, an egg data/PetEgg<rarity>.
// The name tables are copied from Toolbox's shared-data.json at the pin (6c37e3d) and checked against it
// by game-art-coverage-alchemy.test.tsx.
import type { GameArt } from './game-art';

/** Toolbox's class names by class index (shared-data `classes`); "Nope" and "Filler" are gaps. */
export const CLASS_NAMES: readonly string[] = [
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
  'Skill_3_Lol',
];
/** Meals by meal index (shared-data `cookingMenu`). */
export const MEAL_NAMES: readonly string[] = [
  'Turkey_of_Thank',
  'Egg',
  'Salad',
  'Pie',
  'Frenk_Fries',
  'Spaghetti',
  'Corn',
  'Garlic_Bread',
  'Garlicles_Bread',
  'Pizza',
  'Apple',
  'Pancakes',
  'Corndog',
  'Cabbage',
  'Potato_P_Pastry',
  'Dango',
  'Sourish_Fish',
  'Octoplop',
  'Croissant',
  'Canopy',
  'Cannoli',
  'Cheese',
  'Sawdust',
  'Eggplant',
  'Cheesy_Bread',
  'Wild_Boar',
  'Donut',
  'Riceball',
  'Cauliflower',
  'Durian_Fruit',
  'Orange',
  'Bunt_Cake',
  'Chocala_Truffle',
  'Leek',
  'Fortune_Cookie',
  'Pretzel',
  'Sea_Urchin',
  'Mashed_Potato',
  'Mutton',
  'Wedding_Cake',
  'Eel',
  'Whipped_Cocoa',
  'Onion',
  'Soda',
  'Sushi_Roll',
  'Buncha_Banana',
  'Pumpkin',
  'Cotton_Candy',
  'Massive_Fig',
  'Chef_Geustloaf',
  'Kiwi_Fruit',
  'Popped_Corn',
  'Double_Cherry',
  'Ratatouey',
  'Giant_Tomato',
  'Wrath_Grapes',
  'Sausy_Sausage',
  'Seasoned_Marrow',
  'Sticky_Bun',
  'Frazzleberry',
  'MrLoin_Steak',
  'Large_Pohayoh',
  'Bill_Jack_Pep',
  'Burned_Mello',
  'Yumi_Peachring',
  'Plumpcakes',
  'Nyanborgir',
  'Tempura_Shrimp',
  'Woahtermelon',
  'Cookies',
  'Singing_Seed',
  'Tasty_Treat',
  'Giga_Chip',
  'Divorce_Cake',
];
/** Lab chips by chip index (shared-data `chips`). */
export const CHIP_NAMES: readonly string[] = [
  'Grounded_Nanochip',
  'Grounded_Motherboard',
  'Grounded_Software',
  'Grounded_Processor',
  'Potato_Chip',
  'Conductive_Nanochip',
  'Conductive_Motherboard',
  'Conductive_Software',
  'Conductive_Processor',
  'Chocolatey_Chip',
  'Galvanic_Nanochip',
  'Galvanic_Motherboard',
  'Galvanic_Software',
  'Galvanic_Processor',
  'Wood_Chip',
  'Silkrode_Nanochip',
  'Silkrode_Motherboard',
  'Silkrode_Software',
  'Silkrode_Processor',
  'Poker_Chip',
  'Omega_Nanochip',
  'Omega_Motherboard',
];
/** Lab jewels by jewel index (shared-data `jewels`). */
export const JEWEL_NAMES: readonly string[] = [
  'Amethyst_Rhinestone',
  'Purple_Navette',
  'Purple_Rhombol',
  'Sapphire_Rhinestone',
  'Sapphire_Navette',
  'Sapphire_Rhombol',
  'Sapphire_Pyramite',
  'Pyrite_Rhinestone',
  'Pyrite_Navette',
  'Pyrite_Rhombol',
  'Pyrite_Pyramite',
  'Emerald_Rhinestone',
  'Emerald_Navette',
  'Emerald_Rhombol',
  'Emerald_Pyramite',
  'Emerald_Ulthurite',
  'Black_Diamond_Rhinestone',
  'Black_Diamond_Ulthurite',
  'Pure_Opal_Rhinestone',
  'Pure_Opal_Navette',
  'Pure_Opal_Rhombol',
  'Deadly_Wrath_Jewel',
  'North_Winds_Jewel',
  'Eternal_Energy_Jewel',
];

/** "Turkey_of_Thank", "Turkey of Thank" and "turkey of thank" all match. */
const norm = (s: string) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const indexIn = (list: readonly string[]) => {
  const m = new Map(list.map((n, i) => [norm(n), i]));
  return (name: string | null | undefined) => (name ? (m.get(norm(name)) ?? null) : null);
};
const classIndex = indexIn(CLASS_NAMES);
const mealIndex = indexIn(MEAL_NAMES);
const chipIndex = indexIn(CHIP_NAMES);
const jewelIndex = indexIn(JEWEL_NAMES);
const at = (dir: string, i: number | null): GameArt | null =>
  i === null ? null : { path: `data/${dir}${i}` };

/** A class by its Toolbox name ("Bubonic_Conjuror"). */
export const classArtOfName = (cls: string | null | undefined): GameArt | null =>
  at('ClassIcons', classIndex(cls));
/** A meal by its name. */
export const mealArt = (name: string | null | undefined): GameArt | null => at('CookingMB', mealIndex(name));
/** A spice by its index. */
export const spiceArt = (index: number | null): GameArt | null => at('CookingSpice', index);
/** A Lab chip by its name. */
export const chipArt = (name: string | null | undefined): GameArt | null =>
  at('ConsoleChip', chipIndex(name));
/** A Lab jewel by its index. */
export const jewelArt = (index: number | null): GameArt | null => at('ConsoleJwl', index);
/** A Lab jewel by its name. */
export const jewelArtOfName = (name: string | null | undefined): GameArt | null =>
  at('ConsoleJwl', jewelIndex(name));
/** A Lab Mainframe bonus by its index. */
export const labBonusArt = (index: number | null): GameArt | null => at('LabBonus', index);
/** A Breeding upgrade by its index (index 0 is the game's "no upgrade" slot, which has no picture). */
export const petUpgradeArt = (index: number | null): GameArt | null =>
  index === null || index < 1 ? null : at('PetUpg', index - 1);
/** A pet egg (the common egg unless a rarity is given). */
export const eggArt = (rarity = 1): GameArt => ({ path: `data/PetEgg${rarity}` });

/** The number at the end of an engine row key ("jewel-3" -> 3, "t12" -> 12, "u4" -> 4). */
export const keyIndex = (key: string): number | null => {
  const m = /(\d+)$/.exec(key);
  return m ? Number(m[1]) : null;
};
