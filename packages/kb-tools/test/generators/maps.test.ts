// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type MapRow, mapRows } from '@idleon-forge/knowledge/generators/maps.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

const rowsOf = (out: { facts: { id: string; rows: unknown }[] }) =>
  out.facts.find((f) => f.id === 'maps.fact.maps')?.rows as unknown as MapRow[];

describe('maps generator', () => {
  it('reads doors, targets and ExpGiven from value fields (synthetic slice, hand-checked)', () => {
    const rows = mapRows(
      {
        mapNames: { '0': 'Blunder_Hills', '4': 'PlayerSelect', '51': 'Jar_Bridge', '52': 'Z' },
        rawMapNames: Object.assign([], { 0: 'GrasslandaTown', 51: 'DesertA' }),
        mapEnemiesArray: Object.assign([], { 0: 'Nothing', 4: 'Nothing', 51: 'jarSand', 52: 'Z' }),
        monsters: { jarSand: { AFKtype: 'FIGHTING', ExpGiven: 22 } },
        mapPortals: { '0': [1, 0], '51': ['250'] },
        mapPortalDestinations: { '0': [50, 1], '51': [52] },
      },
      new Set([51]),
    );
    // Placeholders (PlayerSelect, Z) are dropped; world = floor(index / 50) + 1.
    expect(rows.map((r) => r.index)).toEqual([0, 51]);
    expect(rows[1]).toEqual({
      index: 51,
      name: 'Jar_Bridge',
      rawName: 'DesertA',
      world: 2,
      afkType: 'FIGHTING',
      target: 'jarSand',
      expGiven: 22,
      doors: [{ requirement: 250, destination: 52 }],
      listed: true,
    });
    expect(rows[0]).toMatchObject({
      afkType: null,
      target: null,
      listed: false,
      doors: [
        { requirement: 1, destination: 50 },
        { requirement: 0, destination: 1 },
      ],
    });
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = rowsOf(out);
    expect(rows.length).toBeGreaterThan(150); // 164 real maps at the pin; 327 slots minus placeholders
    expect(rows.length).toBeLessThan(300);
    // Hand-checked in shared-data at the pin: Blunder Hills (0) doors [1, 0] lead to 50 and 1; Jungle
    // Perimeter (16) has doors [60, 3000]. Efaunt's Tomb is excluded by getFilteredPortals.
    expect(rows.find((r) => r.index === 0)?.doors).toEqual([
      { requirement: 1, destination: 50 },
      { requirement: 0, destination: 1 },
    ]);
    expect(rows.find((r) => r.index === 16)?.doors.map((d) => d.requirement)).toEqual([60, 3000]);
    expect(rows.find((r) => r.name === "Efaunt's_Tomb")?.listed).toBe(false);
    expect(rows.filter((r) => r.listed && r.afkType === 'FIGHTING').length).toBeGreaterThan(100);
    for (const r of rows) expect(r.world).toBeGreaterThanOrEqual(1);
  });

  it("names each character's map the way Toolbox parsed it, on a known save", async () => {
    const rows = rowsOf(await runLive(generator));
    const byIndex = new Map(rows.map((r) => [r.index, r]));
    const chars = knownSave('latest.json').characters as {
      mapIndex?: number;
      currentMap?: string;
      afkType?: string;
    }[];
    let checked = 0;
    for (const c of chars) {
      if (typeof c.mapIndex !== 'number') continue;
      const row = byIndex.get(c.mapIndex);
      expect(row?.name).toBe(c.currentMap);
      if (c.afkType === 'FIGHTING') expect(row?.afkType).toBe('FIGHTING');
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
});
