// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/upgrade-vault.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const row = (name: string, maxLevel: number, unlockLevel: number) => ({
  name,
  maxLevel,
  unlockLevel,
  x1: 1,
  x2: 1,
  x5: 1,
});

describe('upgrade-vault generator', () => {
  it('reads maxLevel and unlockLevel per row, by row index (synthetic slice, hand-checked)', () => {
    const out = runOnSlice(generator, {
      upgradeVault: [
        row('Bigger_Damage', 500, 0),
        row('Filler', 1, 0), // a placeholder row: skipped, but row 2 keeps its index
        row('Vault_Mastery', 50, 1050),
        row('Knockout!', 1, 3000),
      ],
    });
    const ids = out.entries?.map((e) => e.id);
    expect(ids).toEqual([
      'upgrade-vault.acquisition.row-0',
      'upgrade-vault.acquisition.row-2',
      'upgrade-vault.acquisition.row-3',
    ]);
    const [first, mastery, knockout] = out.entries ?? [];
    expect(first?.values).toEqual({ index: 0, name: 'Bigger_Damage', unlockLevel: 0, maxLevel: 500 });
    expect(first?.type === 'acquisition' && first.data).toEqual({
      oneOff: false,
      majorDiscountApplies: true,
      masteryTier: 1,
      isMasteryRow: false,
    });
    expect(mastery?.type === 'acquisition' && mastery.data?.masteryTier).toBeNull();
    expect(knockout?.type === 'acquisition' && knockout.data).toEqual({
      oneOff: true,
      majorDiscountApplies: false,
      masteryTier: 2,
      isMasteryRow: false,
    });
  });

  it('holds its invariants on the pinned data: 90 rows, three mastery rows', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries.length).toBeGreaterThanOrEqual(80);
    expect(out.entries.length).toBeLessThanOrEqual(120);
    const masteries = out.entries.filter((e) => e.type === 'acquisition' && e.data?.isMasteryRow);
    expect(masteries.map((e) => e.id)).toEqual([
      'upgrade-vault.acquisition.row-32',
      'upgrade-vault.acquisition.row-61',
      'upgrade-vault.acquisition.row-89',
    ]);
    // Hand-checked in shared-data upgradeVault at the pin: row 0 Bigger_Damage 500 levels from 0,
    // row 1 Natural_Talent unlocks at 7 total levels; row 32 is the first mastery, so the row-13
    // discount reaches rows 0–32 (Toolbox getUpgradeCost: 33 > index).
    const byId = new Map(out.entries.map((e) => [e.id, e]));
    expect(byId.get('upgrade-vault.acquisition.row-0')?.values).toMatchObject({
      name: 'Bigger_Damage',
      maxLevel: 500,
    });
    expect(byId.get('upgrade-vault.acquisition.row-1')?.values).toMatchObject({ unlockLevel: 7 });
    const r32 = byId.get('upgrade-vault.acquisition.row-32');
    const r33 = byId.get('upgrade-vault.acquisition.row-33');
    expect(r32?.type === 'acquisition' && r32.data?.majorDiscountApplies).toBe(true);
    expect(r33?.type === 'acquisition' && r33.data?.majorDiscountApplies).toBe(false);
  });

  it("matches Toolbox's parsed Vault on a known save (names, unlock gates, unlocked flags)", async () => {
    const out = await runLive(generator);
    const vault = knownSave('latest.json').account.upgradeVault as {
      totalUpgradeLevels: number;
      upgrades: { name: string; unlockLevel: number; maxLevel: number; unlocked: boolean }[];
    };
    expect(vault.upgrades).toHaveLength(out.entries.length);
    out.entries.forEach((e) => {
      const index = e.values.index as number;
      const t = vault.upgrades[index];
      expect(t?.name).toBe(e.values.name);
      expect(t?.unlockLevel).toBe(e.values.unlockLevel);
      // Toolbox's maxLevel adds the bundle and Glimbo extensions to the base max.
      expect(t?.maxLevel).toBeGreaterThanOrEqual(e.values.maxLevel as number);
      expect(t?.unlocked).toBe(vault.totalUpgradeLevels >= (e.values.unlockLevel as number));
    });
  });
});
