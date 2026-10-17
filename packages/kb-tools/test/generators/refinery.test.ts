// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type SaltRow, saltRows } from '@idleon-forge/knowledge/generators/refinery.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('refinery generator', () => {
  it('reads saltName in data order (synthetic slice, hand-checked)', () => {
    expect(
      saltRows({ Refinery1: { saltName: 'Redox_Salts' }, Refinery2: { saltName: 'Explosive_Salts' } }),
    ).toEqual([
      { id: 'redox-salts', rawName: 'Refinery1', name: 'Redox_Salts', order: 0 },
      { id: 'explosive-salts', rawName: 'Refinery2', name: 'Explosive_Salts', order: 1 },
    ]);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as SaltRow[];
    // Hand-checked in shared-data refinery at the pin: 9 salts (Refinery1–9), Redox first, Explosive second.
    expect(rows).toHaveLength(9);
    expect(rows.slice(0, 2).map((r) => r.name)).toEqual(['Redox_Salts', 'Explosive_Salts']);
  });

  it("lists salts in the order Toolbox's refinery parser does, on a known save", async () => {
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as SaltRow[];
    const salts = (
      knownSave('latest.json').account.refinery as { salts: { rawName: string; saltName: string }[] }
    ).salts;
    expect(salts.map((s) => [s.rawName, s.saltName])).toEqual(
      rows.slice(0, salts.length).map((r) => [r.rawName, r.name]),
    );
    expect(salts.length).toBeGreaterThanOrEqual(6);
  });
});
