// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `gem-shop.fact.items` (M6 TR-5, FR-21): the gem shop's priced items: rawName, the index the save's
// GemItemsPurchased array uses (globalIndex), display name, price (cost), price increment per buy
// (costIncrement) and max purchases. Only the "usables" and "bonuses" tabs, which share that index
// space; "Blank" slots and rows with no price are left out. Not generated: the "oddities" tab (its
// globalIndex is a separate index space), real-money bundles ("mtx") and past limited specials.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

export const GEM_TABS = ['usables', 'bonuses'] as const;

interface GemItem {
  rawName: string;
  displayName: string;
  cost: number | null;
  globalIndex: number;
  maxPurchases: number;
  costIncrement: number;
}

export interface GemFactRow {
  id: string;
  rawName: string;
  index: number;
  name: string;
  tab: string;
  section: string;
  price: number;
  increment: number;
  max: number;
}

export function gemRows(tabs: { name: string; sections: Record<string, GemItem[]> }[]): GemFactRow[] {
  const rows: GemFactRow[] = [];
  for (const t of tabs) {
    if (!(GEM_TABS as readonly string[]).includes(t.name)) continue;
    for (const [section, items] of Object.entries(t.sections))
      for (const i of items) {
        if (i.rawName === 'Blank' || typeof i.cost !== 'number') continue;
        rows.push({
          id: slugify(i.rawName),
          rawName: i.rawName,
          index: i.globalIndex,
          name: i.displayName,
          tab: t.name,
          section,
          price: i.cost,
          increment: i.costIncrement ?? 0,
          max: i.maxPurchases,
        });
      }
  }
  const ids = rows.map((r) => r.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`gem-shop: slug collision on ${dup}`);
  return rows.sort((a, b) => a.index - b.index || (a.id < b.id ? -1 : 1));
}

const generator = defineGenerator({
  name: 'gem-shop',
  system: 'gem-shop',
  inputs: ['website-data/gemShop.json'],
  run({ data, pin }) {
    const fact: FactTableT = {
      id: 'gem-shop.fact.items',
      system: 'gem-shop',
      origin: 'generated',
      title: 'Gem shop items: index, price, increment, max',
      rows: gemRows(data.gemShop as Parameters<typeof gemRows>[0]) as unknown as FactTableT['rows'],
      sources: [generatedSource(pin, 'website-data/gemShop.json', 'IdleOn Toolbox game data: gem shop')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
