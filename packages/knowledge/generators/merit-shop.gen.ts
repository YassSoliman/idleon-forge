// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `merit-shop.fact.rows` (M6 TR-5, R6): the merit rows of each world: a stable row id from the row's
// icon rawName (never its position or a guide's nickname), the slot the save indexes it by, the row
// text, the cost per level (meritCost) and the max level (totalLevels). Rows with a null cost are
// placeholders (W1 slot 7 "IDK YET") and are left out. Worlds are 1-based.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

interface MeritRow {
  descLine1?: string;
  descLine2?: string;
  meritCost?: number | null;
  totalLevels?: number;
  icon?: string;
}

export interface MeritFactRow {
  id: string;
  world: number;
  /** Position in the world's merit list, as the save stores levels. */
  slot: number;
  text: string;
  cost: number;
  max: number;
}

export function meritRows(merits: MeritRow[][]): MeritFactRow[] {
  const rows: MeritFactRow[] = [];
  merits.forEach((list, w) => {
    const world = w + 1;
    list.forEach((m, slot) => {
      if (typeof m.meritCost !== 'number') return;
      if (typeof m.totalLevels !== 'number')
        throw new Error(`merit-shop: W${world} slot ${slot} has no totalLevels`);
      rows.push({
        id: `w${world}-${slugify(m.icon ?? `slot-${slot}`)}`,
        world,
        slot,
        text: [m.descLine1, m.descLine2].filter((x) => x && x !== 'Filler').join('_'),
        cost: m.meritCost,
        max: m.totalLevels,
      });
    });
  });
  const ids = rows.map((r) => r.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`merit-shop: slug collision on ${dup}`);
  return rows;
}

const generator = defineGenerator({
  name: 'merit-shop',
  system: 'merit-shop',
  inputs: ['website-data/shared-data.json#merits'],
  run({ data, pin }) {
    const fact: FactTableT = {
      id: 'merit-shop.fact.rows',
      system: 'merit-shop',
      origin: 'generated',
      title: 'Merit shop rows by world: cost and max level',
      rows: meritRows(data.merits as MeritRow[][]) as unknown as FactTableT['rows'],
      sources: [generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: merits')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
