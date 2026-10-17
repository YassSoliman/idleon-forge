// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Bribes (M7 TR-6): one generated Acquisition per bribe, `bribes.acquisition.bribe-<i>`. The index is
// the game's identifier (the save's `BribeStatus[i]`), so it is the id. The effect number is the
// bribe's `value` field, never its description: Insider Trading reads "5%" but its value is 8.
//
// Sets and sellers come from the data, not from a typed table:
// - every `BribeExpansion` bribe's value is the index at which the next set starts, so set k runs
//   from the previous expansion's value to this one's value minus one;
// - a bribe sold somewhere other than the Bribe book says so in its own text: the first expansion
//   naming the Garbage Tuna makes it and every later bribe `garbage-tuna`, the first naming the Jade
//   Emporium makes it and every later bribe `jade-emporium`; everything before is `book`.
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';
import { humanName } from './world-maps';

interface Bribe {
  name: string;
  desc: string;
  npc: string;
  price: number;
  effectName: string;
  value: number;
}

export type BribeSeller = 'book' | 'garbage-tuna' | 'jade-emporium';

const SELLERS: [RegExp, BribeSeller][] = [
  [/Garbage_Tuna/, 'garbage-tuna'],
  [/Jade_Emporium/, 'jade-emporium'],
];

const generator = defineGenerator({
  name: 'bribes',
  system: 'bribes',
  inputs: ['website-data/shared-data.json#bribes'],
  run({ data, pin }) {
    const bribes = data.bribes as Bribe[];
    if (!Array.isArray(bribes) || bribes.length === 0) throw new Error('bribes: shared-data bribes is empty');
    const source = generatedSource(
      pin,
      'website-data/shared-data.json#bribes',
      'IdleOn Toolbox game data: bribes',
    );
    const by = generatedBy(generator, pin);
    let set = 1;
    let setStart = 0;
    let seller: BribeSeller = 'book';
    const entries: GeneratedEntryT[] = bribes.map((b, index) => {
      if (typeof b.value !== 'number' || typeof b.price !== 'number')
        throw new Error(`bribes: bribe ${index} has no numeric value/price`);
      if (index > 0 && index === setStart) set++;
      const isExpansion = b.effectName === 'BribeExpansion';
      if (isExpansion) for (const [re, s] of SELLERS) if (re.test(b.desc) && seller !== s) seller = s;
      const thisSet = set;
      if (isExpansion) setStart = b.value;
      const display = humanName(b.name);
      return {
        id: `bribes.acquisition.bribe-${index}`,
        system: 'bribes',
        type: 'acquisition',
        origin: 'generated',
        title: `Bribe: ${display}`.slice(0, 80),
        text: `Bribe ${index}: ${display}`.slice(0, 240),
        why: 'A bribe is a one-time coin purchase with a permanent bonus.',
        values: {
          index,
          name: b.name,
          set: thisSet,
          soldBy: seller,
          price: b.price,
          codeValue: b.value,
          effectName: b.effectName,
          ...(isExpansion ? { opensSet: thisSet + 1, opensAtIndex: b.value } : {}),
        },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'other', rawName: b.name.slice(0, 64) },
        generatedBy: by,
      };
    });
    return { entries };
  },
});

export default generator;
