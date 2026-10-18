// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Card level ladders (M4 TR-4): one Goal per monster and resource card of W1–W4, `cards.goal.<card>`.
// Toolbox's calculateStars (parsers/cards.ts) gives a card star k (1-based) once copies exceed
// perTier × (k + floor((k-1)/3) + 16·floor((k-1)/4) + 100·floor((k-1)/5))², which for the four base
// stars is perTier × 1, 4, 9, 25. Copies are whole, so the step is at floor(perTier × m) + 1. The first
// step is the first copy. Higher stars need the rift or spelunking unlocks and are not on the ladder.
// `values.afkType` is the AFK type of the monster or resource that drops the card (monsters.json
// `AFKtype`), so a fighting Contribution expands only over fighting cards (M4 TR-4, `familyMembers`).
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

export const CARDS_FILE = 'parsers/cards.ts';
/** Stars every account can reach (calculateStars' maxStars without the rift or spelunking bonus). */
export const BASE_STARS = 4;
/** Card pages for the monsters and resources of W1–W4 (cards.json `category`). */
export const CATEGORIES = [
  'Blunder_Hills',
  'Yum_Yum_Desert',
  'Frostbite_Tundra',
  'Hyperion_Nebula',
  'Easy_Resources',
  'Medium_Resources',
  'Hard_Resources',
] as const;

interface Card {
  rawName: string;
  displayName: string;
  perTier: number;
  category: string;
}

/** The star multiplier calculateStars squares for star index i (0-based). */
export const starMultiplier = (i: number) =>
  i + 1 + (Math.floor(i / 3) + (16 * Math.floor(i / 4) + 100 * Math.floor(i / 5)));

/** Copies needed for each base star: the smallest whole amount strictly above perTier × m². */
export const starSteps = (perTier: number, stars = BASE_STARS) =>
  Array.from({ length: stars }, (_, i) => Math.floor(perTier * starMultiplier(i) ** 2) + 1);

const generator = defineGenerator({
  name: 'card-levels',
  system: 'cards',
  inputs: [`${CARDS_FILE}#calculateStars`, 'website-data/cards.json', 'website-data/monsters.json'],
  run({ data, pin }) {
    const cards = data.cards as Record<string, Card>;
    const monsters = (data.monsters ?? {}) as Record<string, { AFKtype?: string }>;
    const by = generatedBy(generator, pin);
    const source = generatedSource(pin, CARDS_FILE, 'IdleOn Toolbox: calculateStars and cards.json perTier');
    const entries: GeneratedEntryT[] = [];
    for (const c of Object.values(cards)) {
      if (!(CATEGORIES as readonly string[]).includes(c.category)) continue;
      if (typeof c.perTier !== 'number' || !(c.perTier > 0)) continue;
      const name = c.displayName.replace(/_/g, ' ');
      const steps = starSteps(c.perTier);
      const milestones = [
        { at: 1, reward: 'first copy (card level 1)' },
        ...steps.map((at, i) => ({ at, reward: `${i + 1} star${i ? 's' : ''}` })),
      ].filter((m, i, a) => i === 0 || m.at > (a[i - 1] as { at: number }).at);
      entries.push({
        id: `cards.goal.${slugify(c.rawName)}`,
        system: 'cards',
        type: 'goal',
        origin: 'generated',
        title: `Card: ${name}`.slice(0, 80),
        text: `{value:int} ${name} cards; next card level at {next:int}`.slice(0, 240),
        why: `Each card level raises the ${name} card's bonus.`.slice(0, 240),
        values: {
          card: c.rawName,
          perTier: c.perTier,
          ...(typeof monsters[c.rawName]?.AFKtype === 'string'
            ? { afkType: monsters[c.rawName]?.AFKtype as string }
            : {}),
        },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        scope: 'account',
        category: 'compounding',
        unit: 'cards',
        progress: { id: 'cards/copies', params: { card: c.rawName } },
        milestones,
        generatedBy: by,
      });
    }
    return { entries };
  },
});

export default generator;
