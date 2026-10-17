// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `trapping.fact.trap-durations` (M3 FR-21): the trap times each trap kind offers, from Toolbox's
// trapsInfo (shared-data `traps`, indexed by the save's trap type exactly as world-3/traps.ts reads it),
// for M3's "re-place traps sized to {expectedReturn}". Durations are in seconds, as the data has them.
//
// `trapping.fact.trap-set-capacity` is NOT generated: no value field in items.json holds a trap set's
// trap count (TrapBoxSet rows carry stats only), and the item name's last digit is the known-wrong
// method (M3 RT-8). It needs an authored tier-2 table or an exported constant first.
import type { FactTableT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';

export interface TrapKindRow {
  /** Index in trapsInfo: the trap type the save records for a placed trap. */
  kind: number;
  durations: { seconds: number; quantity: number; exp: number; trapType: number }[];
}

export function trapDurations(traps: unknown): TrapKindRow[] {
  if (!Array.isArray(traps) || traps.length === 0) throw new Error('trapping: trapsInfo is empty');
  return traps.map((list, kind) => {
    if (!Array.isArray(list)) throw new Error(`trapping: trapsInfo[${kind}] is not a list`);
    return {
      kind,
      durations: list.map((t: Record<string, unknown>, i) => {
        for (const k of ['trapTime', 'quantity', 'exp', 'trapType'])
          if (typeof t[k] !== 'number')
            throw new Error(`trapping: trapsInfo[${kind}][${i}].${k} is not a number`);
        return {
          seconds: t.trapTime as number,
          quantity: t.quantity as number,
          exp: t.exp as number,
          trapType: t.trapType as number,
        };
      }),
    };
  });
}

const generator = defineGenerator({
  name: 'trapping',
  system: 'trapping',
  inputs: ['website-data/shared-data.json#traps'],
  run({ data, pin }) {
    const fact: FactTableT = {
      id: 'trapping.fact.trap-durations',
      system: 'trapping',
      origin: 'generated',
      title: 'Trap durations by trap kind',
      rows: trapDurations(data.traps) as unknown as FactTableT['rows'],
      sources: [
        generatedSource(pin, 'website-data/shared-data.json', 'IdleOn Toolbox game data: traps (trapsInfo)'),
      ],
      generatedBy: generatedBy(generator, pin),
    };
    return { facts: [fact] };
  },
});

export default generator;
