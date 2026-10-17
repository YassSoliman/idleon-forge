// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `alchemy-bubbles.fact.bubbles` (M6 TR-5): the bubble catalogue: cauldron, index, the equip code the
// save stores (`_3`, `a5`, ...), the rawName Toolbox builds (`aUpgrades<letter><index>`, from its
// exported CAULDRON_INFO, so M6's pairing table can key on it), and the display name.
//
// Not generated: an active/passive flag. No website-data field marks which bubbles are the big
// (active) ones; it needs an authored tier-2 table or an exported Toolbox list first.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

interface CauldronInfo {
  name: string;
  imageLetter: string;
  bubblePrefix: string;
}

export interface BubbleRow {
  cauldron: string;
  cauldronIndex: number;
  index: number;
  code: string;
  rawName: string;
  name: string;
}

export function bubbleRows(
  cauldrons: Record<string, { bubbleIndex: string; bubbleName: string }[]>,
  info: readonly CauldronInfo[],
): BubbleRow[] {
  const rows: BubbleRow[] = [];
  info.forEach((c, cauldronIndex) => {
    const list = cauldrons[c.name];
    if (!Array.isArray(list))
      throw new Error(`alchemy-bubbles: cauldron ${c.name} is missing from cauldrons.json`);
    list.forEach((b, index) => {
      if (b.bubbleIndex !== `${c.bubblePrefix}${index}`)
        throw new Error(
          `alchemy-bubbles: ${c.name}[${index}] has code ${b.bubbleIndex}, expected ${c.bubblePrefix}${index}`,
        );
      rows.push({
        cauldron: c.name,
        cauldronIndex,
        index,
        code: b.bubbleIndex,
        rawName: `aUpgrades${c.imageLetter}${index}`,
        name: b.bubbleName,
      });
    });
  });
  return rows;
}

const generator = defineGenerator({
  name: 'alchemy-bubbles',
  system: 'alchemy-bubbles',
  inputs: ['website-data/cauldrons.json', 'parsers/world-2/alchemy.ts#CAULDRON_INFO'],
  constants: { CAULDRON_INFO: 'parsers/world-2/alchemy.ts' },
  run({ data, constants, pin }) {
    const info = constants.CAULDRON_INFO as CauldronInfo[];
    if (!Array.isArray(info) || info.length === 0)
      throw new Error('alchemy-bubbles: CAULDRON_INFO is not exported');
    const fact: FactTableT = {
      id: 'alchemy-bubbles.fact.bubbles',
      system: 'alchemy-bubbles',
      origin: 'generated',
      title: 'Alchemy bubble catalogue',
      rows: bubbleRows(
        data.cauldrons as Parameters<typeof bubbleRows>[0],
        info,
      ) as unknown as FactTableT['rows'],
      sources: [generatedSource(pin, 'website-data/cauldrons.json', 'IdleOn Toolbox game data: cauldrons')],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
