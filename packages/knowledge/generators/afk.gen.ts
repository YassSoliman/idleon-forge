// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `afk.fact.food-kinds` (M3): which items are health, boost or golden food, from items.json `Type`
// (HEALTH_FOOD, BOOST_FOOD, GOLDEN_FOOD). Dungeon food is not AFK food and is left out.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

export const FOOD_KINDS = { HEALTH_FOOD: 'health', BOOST_FOOD: 'boost', GOLDEN_FOOD: 'golden' } as const;

/** rawName -> 'health' | 'boost' | 'golden', sorted by rawName. */
export function foodKinds(items: Record<string, { Type?: string }>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of Object.keys(items).sort()) {
    const kind = FOOD_KINDS[items[raw]?.Type as keyof typeof FOOD_KINDS];
    if (kind) out[raw] = kind;
  }
  return out;
}

const generator = defineGenerator({
  name: 'afk',
  system: 'afk',
  inputs: ['website-data/items.json'],
  run({ data, pin }) {
    const rows = foodKinds(data.items as Record<string, { Type?: string }>);
    if (Object.keys(rows).length === 0) throw new Error('afk: no food items in items.json');
    const fact: FactTableT = {
      id: 'afk.fact.food-kinds',
      system: 'afk',
      origin: 'generated',
      title: 'Food kinds: health, boost, golden',
      rows,
      sources: [generatedSource(pin, 'website-data/items.json', 'IdleOn Toolbox game data: items')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
