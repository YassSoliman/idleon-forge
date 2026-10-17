// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Statues (M7 TR-6): one generated Acquisition per statue, `statues.acquisition.statue-<i>`, where i
// is the statue's own `index` field in Toolbox data (the game's statue number, which the save's
// statue arrays use). `goldOrder` is that index: statues turn Gold in index order (M7 TR-6).
import type { GeneratedEntryT } from '../src/schema';
import { defineGenerator, generatedBy, generatedSource } from './types';
import { humanName } from './world-maps';

interface Statue {
  index: number;
  name: string;
  effect: string;
  bonus: number;
}

const generator = defineGenerator({
  name: 'statues',
  system: 'statues',
  inputs: ['website-data/shared-data.json#statues'],
  run({ data, pin }) {
    const statues = data.statues as Statue[];
    if (!Array.isArray(statues) || statues.length === 0)
      throw new Error('statues: shared-data statues is empty');
    const source = generatedSource(
      pin,
      'website-data/shared-data.json#statues',
      'IdleOn Toolbox game data: statues',
    );
    const by = generatedBy(generator, pin);
    const entries: GeneratedEntryT[] = statues.map((s) => {
      if (typeof s.index !== 'number') throw new Error(`statues: ${s.name} has no numeric index`);
      const display = humanName(s.name);
      return {
        id: `statues.acquisition.statue-${s.index}`,
        system: 'statues',
        type: 'acquisition',
        origin: 'generated',
        title: `Statue: ${display}`.slice(0, 80),
        text: `${display} Statue`.slice(0, 240),
        why: 'Statues level up from statue items and can be turned Gold for a bigger bonus.',
        values: { index: s.index, name: s.name, goldOrder: s.index, bonusPerLevel: s.bonus },
        sources: [source],
        appliesTo: { stages: 'all' },
        confidence: 'H',
        status: 'active',
        thing: { kind: 'other', rawName: s.name.slice(0, 64) },
        generatedBy: by,
      };
    });
    return { entries };
  },
});

export default generator;
