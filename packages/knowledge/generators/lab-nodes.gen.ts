// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `lab.fact.lab-nodes` (M5 TR-6): the Lab's mainframe bonuses and jewels with their names and board
// positions (x, y, range), for M5's "would switch off" text. From Toolbox's labBonuses and jewels.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

export interface LabNodeRow {
  kind: 'bonus' | 'jewel';
  /** Toolbox's index within its kind (the save's slot), kept for joining with the parsed Lab. */
  index: number;
  slug: string;
  name: string;
  x: number;
  y: number;
  range: number;
}

interface Placed {
  index: number;
  name: string;
  x: number;
  y: number;
  range: number;
}

export function labNodes(bonuses: Placed[], jewels: Placed[]): LabNodeRow[] {
  const row = (kind: LabNodeRow['kind'], n: Placed): LabNodeRow => {
    for (const k of ['index', 'x', 'y', 'range'] as const)
      if (typeof n[k] !== 'number') throw new Error(`lab-nodes: ${kind} ${n.name} has no numeric ${k}`);
    return { kind, index: n.index, slug: slugify(n.name), name: n.name, x: n.x, y: n.y, range: n.range };
  };
  const rows = [...bonuses.map((b) => row('bonus', b)), ...jewels.map((j) => row('jewel', j))];
  const slugs = rows.map((r) => `${r.kind}:${r.slug}`);
  const dup = slugs.find((s, i) => slugs.indexOf(s) !== i);
  if (dup) throw new Error(`lab-nodes: slug collision on ${dup}`);
  return rows.sort((a, b) => (a.kind === b.kind ? a.index - b.index : a.kind < b.kind ? -1 : 1));
}

const generator = defineGenerator({
  name: 'lab-nodes',
  system: 'lab',
  inputs: ['website-data/shared-data.json#labBonuses', 'website-data/shared-data.json#jewels'],
  run({ data, pin }) {
    const rows = labNodes(data.labBonuses as Placed[], data.jewels as Placed[]);
    const fact: FactTableT = {
      id: 'lab.fact.lab-nodes',
      system: 'lab',
      origin: 'generated',
      title: 'Lab mainframe bonuses and jewels: names and positions',
      rows: rows as unknown as FactTableT['rows'],
      sources: [
        generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: labBonuses, jewels'),
      ],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
