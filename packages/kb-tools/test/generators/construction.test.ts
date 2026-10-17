// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, {
  type BuildingRow,
  buildingRows,
} from '@idleon-forge/knowledge/generators/construction.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('construction generator', () => {
  it('reads index and maxLevel value fields (synthetic slice, hand-checked)', () => {
    expect(
      buildingRows({ Death_Note: { index: 2, maxLevel: 51 }, '3D_Printer': { index: 0, maxLevel: 11 } }),
    ).toEqual([
      { id: '3-d-printer', index: 0, rawName: '3D_Printer', maxLevel: 11 },
      { id: 'death-note', index: 2, rawName: 'Death_Note', maxLevel: 51 },
    ]);
    expect(() => buildingRows({ A: { index: 1 }, B: { index: 1 } })).toThrow(/duplicate/);
  });

  it('holds its invariants on the pinned data: Death Note is index 2 (M6 TR-5)', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as BuildingRow[];
    expect(rows.find((r) => r.index === 2)?.rawName).toBe('Death_Note');
    expect(rows.length).toBeGreaterThan(20);
    expect(rows.length).toBeLessThan(40);
  });

  it("matches the index and max level of Toolbox's parsed buildings, on a known save", async () => {
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as BuildingRow[];
    const data = (knownSave('latest.json').account.towers as { data: { index: number; maxLevel: number }[] })
      .data;
    expect(data.length).toBe(rows.length);
    for (const t of data) expect(rows.find((r) => r.index === t.index)?.maxLevel).toBe(t.maxLevel);
  });
});
