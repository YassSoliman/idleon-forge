// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `construction.fact.buildings` (M6 TR-5): the Construction building catalogue: the index the save
// uses (Death Note is 2), the building rawName (shared-data towers key) and its max level.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

export interface BuildingRow {
  id: string;
  index: number;
  rawName: string;
  maxLevel: number | null;
}

export function buildingRows(towers: Record<string, { index?: number; maxLevel?: number }>): BuildingRow[] {
  const rows = Object.entries(towers).map(([rawName, t]) => {
    if (typeof t.index !== 'number') throw new Error(`construction: ${rawName} has no index`);
    return {
      id: slugify(rawName),
      index: t.index,
      rawName,
      maxLevel: typeof t.maxLevel === 'number' ? t.maxLevel : null,
    };
  });
  const idx = rows.map((r) => r.index);
  if (new Set(idx).size !== idx.length) throw new Error('construction: duplicate building index');
  return rows.sort((a, b) => a.index - b.index);
}

const generator = defineGenerator({
  name: 'construction',
  system: 'construction',
  inputs: ['website-data/shared-data.json#towers'],
  run({ data, pin }) {
    const fact: FactTableT = {
      id: 'construction.fact.buildings',
      system: 'construction',
      origin: 'generated',
      title: 'Construction buildings: index and max level',
      rows: buildingRows(
        data.towers as Record<string, { index?: number; maxLevel?: number }>,
      ) as unknown as FactTableT['rows'],
      sources: [generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: towers')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
