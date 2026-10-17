// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type MeritFactRow, meritRows } from '@idleon-forge/knowledge/generators/merit-shop.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('merit-shop generator', () => {
  it('reads meritCost and totalLevels and drops null-cost placeholders (synthetic slice, hand-checked)', () => {
    const rows = meritRows([
      [
        {
          descLine1: 'All_Blunder_Hills_Monsters_respawn_+{%',
          descLine2: 'faster.',
          meritCost: 1,
          totalLevels: 10,
          icon: 'TaskSa2',
        },
        { descLine1: 'IDK_YET', meritCost: null, totalLevels: 5, icon: 'Blank' },
      ],
    ]);
    expect(rows).toEqual([
      {
        id: 'w1-task-sa2',
        world: 1,
        slot: 0,
        text: 'All_Blunder_Hills_Monsters_respawn_+{%_faster.',
        cost: 1,
        max: 10,
      },
    ]);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as MeritFactRow[];
    // Hand-checked in shared-data merits at the pin: 7 worlds x 8 slots, 6 null-cost placeholders -> 50
    // rows; W1 slot 6 (TalentBook1) costs 3 per level, max 6.
    expect(rows).toHaveLength(50);
    expect(rows.find((r) => r.id === 'w1-talent-book1')).toMatchObject({ slot: 6, cost: 3, max: 6 });
    expect(rows.some((r) => r.world === 1 && r.slot === 7)).toBe(false);
  });

  it("matches the cost and max of Toolbox's parsed merit rows, on a known save", async () => {
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as MeritFactRow[];
    const parsed = knownSave('latest.json').account.meritsDescriptions as {
      meritCost: number | null;
      totalLevels: number;
    }[][];
    let checked = 0;
    for (const r of rows) {
      const m = parsed[r.world - 1]?.[r.slot];
      expect(m).toMatchObject({ meritCost: r.cost, totalLevels: r.max });
      checked++;
    }
    expect(checked).toBe(rows.length);
  });
});
