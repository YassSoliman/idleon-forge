// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C (FR-C7, section 9): `production-plan.fact.anvil-exp`, the anvil products a hammer can make
// (shared-data `anvilProducts` 0-10; 11-13 need level 999 and are never offered), with the work one item
// takes (`requiredAmount`), the Smithing level that opens it and the Smithing EXP it gives. The
// Production Plan's EXP fallback (section 7.4) is arithmetic on these numbers.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

interface Product {
  rawName: string;
  requiredAmount: number;
  levelReq: number;
  exp: number;
}

/** Products 0-10: the ones with a reachable level. */
export const ANVIL_PRODUCT_COUNT = 11;

const generator = defineGenerator({
  name: 'production-plan',
  system: 'production-plan',
  inputs: ['website-data/shared-data.json#anvilProducts', 'website-data/items.json'],
  run({ data, pin }) {
    const raw = data.anvilProducts as Record<string, Product> | Product[] | undefined;
    const list = Array.isArray(raw) ? raw : Object.values(raw ?? {});
    if (list.length < ANVIL_PRODUCT_COUNT) throw new Error('production-plan: anvilProducts has too few rows');
    const items = (data.items ?? {}) as Record<string, { displayName?: string }>;
    const rows = list.slice(0, ANVIL_PRODUCT_COUNT).map((p, index) => {
      if (typeof p.requiredAmount !== 'number' || typeof p.exp !== 'number' || typeof p.levelReq !== 'number')
        throw new Error(`production-plan: anvil product ${index} has no numbers`);
      return {
        index,
        rawName: p.rawName,
        name: (items[p.rawName]?.displayName ?? p.rawName).replace(/_/g, ' '),
        requiredAmount: p.requiredAmount,
        levelReq: p.levelReq,
        exp: p.exp,
        expPer1000: Math.round((p.exp * 1000) / p.requiredAmount),
      };
    });
    const fact: FactTableT = {
      id: 'production-plan.fact.anvil-exp',
      system: 'production-plan',
      origin: 'generated',
      title: 'Anvil products: work per item, level and Smithing EXP',
      rows,
      sources: [
        generatedSource(
          pin,
          'website-data/shared-data.json#anvilProducts',
          'IdleOn Toolbox game data: anvilProducts',
        ),
      ],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
