// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the game facts the read-only Laboratory, Cooking and Breeding pages and the World 4
// welcome state next to the save's numbers. Facts only, no judgement: nothing here ranks, fires or
// decides (World 4 advice needs its own spec and red team). Every table names its Source; all were read
// on 2026-10-18 for game v1.23 "Luminous Menagerie" (2.3.540) in the M24 World 4 research note.

export interface Source {
  url: string;
  title: string;
}

export const SOURCES = {
  gobo: { url: 'https://idleon.wiki/wiki/Gobo', title: 'IdleOn Wiki: Gobo' },
  eliteus: { url: 'https://idleon.wiki/wiki/Eliteus', title: 'IdleOn Wiki: Eliteus' },
  lab: { url: 'https://idleon.wiki/wiki/Laboratory', title: 'IdleOn Wiki: Laboratory' },
  cooking: { url: 'https://idleon.wiki/wiki/Cooking', title: 'IdleOn Wiki: Cooking' },
  breeding: { url: 'https://idleon.wiki/wiki/Breeding', title: 'IdleOn Wiki: Breeding' },
  arena: { url: 'https://idleon.wiki/wiki/Pet_Arena', title: 'IdleOn Wiki: Pet Arena' },
  toolbox: { url: 'https://idleontoolbox.com/account/world-4/laboratory', title: 'IdleOn Toolbox 2.3.540' },
} as const satisfies Record<string, Source>;

export const VERIFIED = '2026-10-18';

// ---- Laboratory (IdleOn Wiki: Laboratory; Toolbox lab.ts) ----

/** The prism's board position and the game's distance formula (Toolbox `getDistance`, lab.ts). */
export const PRISM = { x: 43, y: 229 } as const;
export const labDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return 0.9604339 * Math.max(dx, dy) + 0.397824735 * Math.min(dx, dy);
};
/** A new character's beam (Line Width 50 at Lab level 0, +2 a level) and a lit character's reach. */
export const LAB_BEAM = { base: 50, perLevel: 2, reach: 80 } as const;
/** Chip slots open at these Lab levels (slot 1 to 7). */
export const CHIP_SLOT_LEVELS = [5, 10, 15, 25, 35, 50, 75] as const;
/** Holding these once opens the Chip Repository and the Jewel Spinner. */
export const LAB_OPENERS = { processorChips: 3, strungJewels: 7 } as const;

/** Plain words for the first Mainframe bonuses, by Toolbox name (the wiki's effect, shortened). */
export const NODE_WORDS: Readonly<Record<string, { short: string; effect?: string }>> = {
  Animal_Farm: { short: 'Animal Farm', effect: '+1% Total Damage for every Mob species you have bred' },
  Wired_In: { short: 'Wired In', effect: 'Uploaded characters print 2x in the 3D Printer' },
  Gilded_Cyclical_Tubing: { short: 'Gilded Tubing', effect: 'Refinery cycles run 3x faster' },
  No_Bubble_Left_Behind: {
    short: 'No Bubble Left Behind',
    effect: 'Your 3 lowest Alchemy bubbles +1 level a day you log in',
  },
  Sigils_of_Olden_Alchemy: { short: 'Sigils', effect: 'Lets your Sigils charge' },
  "Killer's_Brightside": {
    short: "Killer's Brightside",
    effect: 'Kills count 2x for portal doors and the Death Note',
  },
  Shrine_World_Tour: {
    short: 'Shrine World Tour',
    effect: 'A shrine in town works on every map of that world',
  },
  Viaduct_of_the_Gods: { short: 'Viaduct' },
  Certified_Stamp_Book: { short: 'Stamp Book 2x', effect: 'Every stamp except MISC gives 2x' },
  Spelunker_Obol: { short: 'Spelunker Obol', effect: 'Lit jewels give 1.5x' },
  Fungi_Finger_Pocketer: { short: 'Fungi Finger' },
  My_1st_Chemistry_Set: { short: 'Chemistry Set 2x', effect: 'Every vial gives 2x' },
  Unadulterated_Banking_Fury: { short: 'Banking Fury' },
  Viral_Connection: { short: 'Viral Connection' },
};

/** The Lab class of each subclass line (IdleOn Wiki: Eliteus): the elite the subclass becomes. */
export const ELITE_OF: Readonly<Record<string, string>> = {
  Barbarian: 'Blood_Berserker',
  Squire: 'Divine_Knight',
  Bowman: 'Siege_Breaker',
  Hunter: 'Beast_Master',
  Wizard: 'Elemental_Sorcerer',
  Shaman: 'Bubonic_Conjuror',
};
/** What each elite is known for in World 4 (IdleOn Wiki: Eliteus; class pages). */
export const ELITE_NOTE: Readonly<Record<string, string>> = {
  Blood_Berserker: 'the Cooking class',
  Bubonic_Conjuror: 'the Lab class',
  Beast_Master: 'the Breeding class',
};

// ---- Cooking (IdleOn Wiki: Cooking, Kitchen) ----

/** Coins for kitchens 2 to 10 (kitchen 1 is open in every save). */
export const KITCHEN_PRICES = [8.2e6, 75e6, 400e6, 8e9, 50e9, 2.13e12, 60e12, 2e15, 1e17] as const;
/** Each kitchen's Speed, Fire and Luck upgrades cost one spice each: kitchen i uses spices 2i, 2i+1, 2i+2. */
export const kitchenSpices = (kitchen: number): [number, number, number] => [
  2 * kitchen,
  2 * kitchen + 1,
  2 * kitchen + 2,
];
/** A brand-new kitchen cooks 10 progress an hour. */
export const BASE_MEAL_SPEED = 10;
/** The surest discoveries: one spice alone finds these meals (Toolbox meal names, by spice index). */
export const SINGLE_SPICE_MEALS: Readonly<Record<number, string[]>> = {
  0: ['Turkey_of_Thank'],
  1: ['Egg', 'Pie'],
  2: ['Salad', 'Spaghetti'],
  3: ['Garlicles_Bread'],
  4: ['Frenk_Fries', 'Apple'],
  5: ['Cabbage'],
  6: ['Corn', 'Dango'],
};
/** The meals World 4 spices reach early, in the order the wiki's spice table finds them. */
export const EARLY_MEALS = [
  'Turkey_of_Thank',
  'Egg',
  'Pie',
  'Salad',
  'Spaghetti',
  'Garlicles_Bread',
  'Frenk_Fries',
  'Apple',
  'Cabbage',
  'Corn',
  'Dango',
  'Pancakes',
] as const;
/** Gobo's quests give this many Cooking Ladles; one ladle pushes every kitchen 1 hour. */
export const GOBO_LADLES = 19;
/** Spice claims a day (Toolbox `maxNumberOfSpiceClicks`). */
export const SPICE_CLAIMS_A_DAY = 100;

// ---- Breeding (IdleOn Wiki: Breeding, Pet Arena) ----

/** A new egg every 2 hours. */
export const EGG_SECONDS = 7200;
/** The Mob Arena opens at this Breeding level. */
export const ARENA_LEVEL = 8;
/** Mob Arena wave bonuses (IdleOn Wiki: Pet Arena), the ones a casual player meets first. */
export const ARENA_WAVES: ReadonlyArray<{ wave: number; what: string; key?: true }> = [
  { wave: 2, what: '3rd battle slot' },
  { wave: 5, what: '+25% Library VIP' },
  { wave: 8, what: '1.2x Total Damage' },
  { wave: 15, what: '4th battle slot' },
  { wave: 20, what: '1.5x monster cash' },
  { wave: 35, what: 'Kitchen upgrades half price', key: true },
  { wave: 50, what: '5th battle slot' },
  { wave: 100, what: '3rd large bubble', key: true },
  { wave: 150, what: '+20% Lab beam' },
  { wave: 200, what: '1.4x Total Damage' },
];
/** Breeding upgrades by the start of their Toolbox name: the Breeding level that opens it, what it does, its first cost. */
export const UPGRADE_FACTS: ReadonlyArray<{
  name: string;
  opens: number;
  what?: string;
  firstCost?: string;
}> = [
  {
    name: 'Gene_Splicing',
    opens: 1,
    what: 'cheaper gene boosts, raises new-Mob odds',
    firstCost: '6 Dead DNA · 3 Turkey of Thank',
  },
  {
    name: 'Egg_Capacity',
    opens: 5,
    what: '+1 nest slot a level, up to 5 · longer away before the nest fills',
    firstCost: '20 Dead DNA · 10 Pie',
  },
  {
    name: 'Breedability',
    opens: 10,
    what: 'switches on the 2nd new-Mob multiplier',
    firstCost: '5 Dead DNA · 10 Corn',
  },
  { name: 'Fence_Extension', opens: 15, what: '+1 Fence Yard slot', firstCost: '30 Dead DNA · 10 Pancakes' },
  {
    name: 'Rarity_of_the_Egg',
    opens: 20,
    what: 'better eggs; switches on the 3rd multiplier',
    firstCost: '35 Dead DNA · 10 Potato P Pastry',
  },
  { name: 'Blooming_Axe', opens: 25 },
  { name: 'Pastpresent_Brood', opens: 30 },
  { name: 'Paint_Bucket', opens: 40, what: 'shiny Mobs' },
  { name: 'Overwhelmed_Golden_Egg', opens: 50 },
];
/** Shiny Mobs open at this Breeding level. */
export const SHINY_LEVEL = 40;

// ---- The World 4 welcome (IdleOn Wiki: Gobo, Eliteus; the community guides in the research note) ----

/** Gobo's five quests, in order (Toolbox quest names). */
export const GOBO_QUESTS = ['Gobo1', 'Gobo2', 'Gobo3', 'Gobo4', 'Gobo5'] as const;
/** Kitchens 2, 3 and 4 together (KITCHEN_PRICES[0..2]). */
export const FIRST_KITCHENS = 4;
