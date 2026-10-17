// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type LabNodeRow, labNodes } from '@idleon-forge/knowledge/generators/lab-nodes.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

const rowsOf = (out: { facts: { id: string; rows: unknown }[] }) =>
  out.facts.find((f) => f.id === 'lab.fact.lab-nodes')?.rows as unknown as LabNodeRow[];

describe('lab-nodes generator', () => {
  it('reads names and positions (synthetic slice, hand-checked)', () => {
    const rows = labNodes(
      [{ index: 0, name: 'Animal_Farm', x: 91, y: 353, range: 90 }],
      [{ index: 0, name: 'Amethyst_Rhinestone', x: 76, y: 134, range: 90 }],
    );
    expect(rows).toEqual([
      { kind: 'bonus', index: 0, slug: 'animal-farm', name: 'Animal_Farm', x: 91, y: 353, range: 90 },
      {
        kind: 'jewel',
        index: 0,
        slug: 'amethyst-rhinestone',
        name: 'Amethyst_Rhinestone',
        x: 76,
        y: 134,
        range: 90,
      },
    ]);
    expect(() =>
      labNodes([{ index: 0, name: 'X', x: 1, y: 1, range: undefined as unknown as number }], []),
    ).toThrow();
  });

  it('holds its invariants on the pinned data: 18 bonuses and 24 jewels', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = rowsOf(out);
    // Hand-checked in shared-data at the pin: 18 labBonuses, 24 jewels, Animal_Farm at (91, 353).
    expect(rows.filter((r) => r.kind === 'bonus')).toHaveLength(18);
    expect(rows.filter((r) => r.kind === 'jewel')).toHaveLength(24);
    expect(rows.find((r) => r.slug === 'animal-farm')).toMatchObject({ x: 91, y: 353, range: 90 });
  });

  it("matches the positions in Toolbox's parsed Lab, on a known save", async () => {
    const rows = rowsOf(await runLive(generator));
    const lab = knownSave('latest.json').account.lab as {
      labBonuses: { index: number; name: string; x: number; y: number }[];
      jewels: { index: number; name: string; x: number; y: number }[];
    };
    for (const [kind, list] of [
      ['bonus', lab.labBonuses],
      ['jewel', lab.jewels],
    ] as const) {
      expect(list.length).toBeGreaterThan(10);
      for (const n of list) {
        const r = rows.find((x) => x.kind === kind && x.index === n.index);
        expect(r).toMatchObject({ name: n.name, x: n.x, y: n.y });
      }
    }
  });
});
