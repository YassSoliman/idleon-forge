// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Class level ladder (M4 TR-4): `classes.goal.level`, one step per character level up to the
// highest personal obol slot gate, with the level gates labelled. The gates generated here are the
// personal obol slots (shared-data obols.character levelReq, the field Toolbox's obols parser attaches
// to each slot). The talent tab 4 (90) and Post Office (50) gates the spec also names are not in
// Toolbox's data or exported constants at the pin, so they wait for an authored tier-2 fact table.
import { defineGenerator, generatedBy, generatedSource } from './types';

interface ObolSlot {
  shape: string;
  levelReq: number;
}

export function obolGates(slots: Record<string, ObolSlot>) {
  const byLevel = new Map<number, string[]>();
  for (const s of Object.values(slots)) {
    if (!(typeof s.levelReq === 'number' && s.levelReq > 1)) continue; // 0: open from the start
    byLevel.set(s.levelReq, [...(byLevel.get(s.levelReq) ?? []), s.shape]);
  }
  return [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, shapes]) => ({ level, shapes: shapes.sort() }));
}

const generator = defineGenerator({
  name: 'class-gates',
  system: 'classes',
  inputs: ['website-data/shared-data.json#obols'],
  run({ data, pin }) {
    const obols = data.obols as { character?: Record<string, ObolSlot> };
    if (!obols?.character) throw new Error('class-gates: shared-data obols.character is missing');
    const gates = obolGates(obols.character);
    if (gates.length === 0) throw new Error('class-gates: no personal obol slot gates');
    const top = (gates[gates.length - 1] as { level: number }).level;
    const label = new Map(
      gates.map((g) => [
        g.level,
        `level ${g.level}: personal obol slot${g.shapes.length > 1 ? 's' : ''} (${g.shapes.join(', ')})`,
      ]),
    );
    const milestones = Array.from({ length: top - 1 }, (_, i) => i + 2).map((at) => ({
      at,
      reward: label.get(at) ?? `level ${at}`,
    }));
    return {
      entries: [
        {
          id: 'classes.goal.level',
          system: 'classes',
          type: 'goal',
          origin: 'generated',
          title: 'Class level',
          text: 'Level {value:int}; next level gate at {next:int}',
          why: 'Class levels give talent points, and some levels open personal obol slots.',
          values: {},
          sources: [
            generatedSource(
              pin,
              'website-data/shared-data.json',
              'IdleOn Toolbox game data: obols.character levelReq',
            ),
          ],
          appliesTo: { stages: 'all' },
          confidence: 'H',
          status: 'active',
          scope: 'character',
          category: 'compounding',
          unit: 'level',
          progress: { id: 'classes/level', params: {} },
          milestones,
          data: { gates: gates.map((g) => ({ level: g.level, kind: 'obol-slot', shapes: g.shapes })) },
          generatedBy: generatedBy(generator, pin),
        },
      ],
    };
  },
});

export default generator;
