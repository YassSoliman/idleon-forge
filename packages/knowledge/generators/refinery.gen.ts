// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `refinery.fact.salts` (M6 TR-5): the salt catalogue in Refinery order: rawName (Refinery1…), display
// name (saltName) and its position, from shared-data refinery (the order Toolbox's refinery parser
// lists salts in).
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource, slugify } from './types';

export interface SaltRow {
  id: string;
  rawName: string;
  name: string;
  order: number;
}

export function saltRows(refinery: Record<string, { saltName?: string }>): SaltRow[] {
  return Object.entries(refinery).map(([rawName, s], order) => {
    if (!s.saltName) throw new Error(`refinery: ${rawName} has no saltName`);
    return { id: slugify(s.saltName), rawName, name: s.saltName, order };
  });
}

const generator = defineGenerator({
  name: 'refinery',
  system: 'refinery',
  inputs: ['website-data/shared-data.json#refinery'],
  run({ data, pin }) {
    const rows = saltRows(data.refinery as Record<string, { saltName?: string }>);
    const ids = rows.map((r) => r.id);
    const dup = ids.find((id, i) => ids.indexOf(id) !== i);
    if (dup) throw new Error(`refinery: slug collision on ${dup}`);
    const fact: FactTableT = {
      id: 'refinery.fact.salts',
      system: 'refinery',
      origin: 'generated',
      title: 'Refinery salts in order',
      rows: rows as unknown as FactTableT['rows'],
      sources: [generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: refinery')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
