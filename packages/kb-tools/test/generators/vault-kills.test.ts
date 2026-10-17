// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { probeSlots } from '@idleon-forge/knowledge/generators/vault-kills.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('vault-kills generator', () => {
  it('pairs probed slots with the POW 10 kill rows in order (synthetic slice, hand-checked)', () => {
    // A stand-in for getVaultTotalKills: map 3 -> raw slot 0 (log slot 2), map 7 -> raw slot 1 (log slot 3).
    const fake = ({ characters }: { characters: { kills?: number[] }[] }) => {
      const k = (m: number) => characters.reduce((s, c) => s + (c.kills?.[m] ?? 0), 0);
      const log = (v: number) => (v < 10 ? 0 : Math.floor(Math.log10(v)));
      return [k(3), k(7), log(k(3)), log(k(7))];
    };
    const out = runOnSlice(
      generator,
      {
        mapNames: { 0: 'Town', 1: 'A', 2: 'B', 3: 'Map_Three', 4: 'C', 5: 'D', 6: 'E', 7: 'Map_Seven' },
        upgradeVault: [
          { name: 'Plain', description: '+{%_Something' },
          { name: 'Row_One', description: '+{_Dmg_per_POW_10_Foo_Kills._$' },
          { name: 'Row_Two', description: '+{_Dmg_per_POW_10_Bar_Kills._$' },
        ],
      },
      { getVaultTotalKills: fake },
    );
    expect(out.facts?.[0]?.rows).toEqual([
      { map: 3, mapName: 'Map_Three', slot: 0, logSlot: 2, row: 'Row_One' },
      { map: 7, mapName: 'Map_Seven', slot: 1, logSlot: 3, row: 'Row_Two' },
    ]);
    const e = out.entries?.find((x) => x.id === 'upgrade-vault.goal.kill-row-map-7');
    expect(e?.type === 'goal' && e.milestones?.slice(0, 3)).toEqual([
      { at: 10, reward: 'Row Two step 1' },
      { at: 100, reward: 'Row Two step 2' },
      { at: 1000, reward: 'Row Two step 3' },
    ]);
  });

  it('finds the five maps of the pinned parser: 8, 13, 14, 24, 101', async () => {
    // Hand-checked against getVaultTotalKills at the pin: worldPortalMapIndices [14, 24, 13, 8] fill
    // slots 0-3 (logs 4-7) and map 101 fills slot 10 (log 11); the POW 10 rows are Bored_to_Death (14),
    // Slice_N_Dice (20), Stick_Snapping (27), Dirty_Money (31) and Buildie_Sheepie (48).
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries.map((e) => e.id).sort()).toEqual(
      [8, 13, 14, 24, 101].map((m) => `upgrade-vault.goal.kill-row-map-${m}`).sort(),
    );
    const rows = out.facts[0]?.rows as { map: number; slot: number; logSlot: number; row: string }[];
    expect(rows.map((r) => [r.map, r.slot, r.logSlot, r.row])).toEqual([
      [14, 0, 4, 'Bored_to_Death'],
      [24, 1, 5, 'Slice_N_Dice'],
      [13, 2, 6, 'Stick_Snapping'],
      [8, 3, 7, 'Dirty_Money'],
      [101, 10, 11, 'Buildie_Sheepie'],
    ]);
  });

  it("matches Toolbox's own reading of a known save: each row's Current_Kills is its map's total", async () => {
    // Toolbox's getVaultDollarValue prints "Current_Kills:<n>" for each POW 10 row from its own slot;
    // our map -> row pairing must produce the same number from the characters' kills on that map.
    const out = await runLive(generator);
    const rows = out.facts[0]?.rows as { map: number; row: string }[];
    let checked = 0;
    for (const file of ['latest.json', 'fresh.json', 'highend.json', 'third.json']) {
      const parsed = knownSave(file);
      const upgrades = (parsed.account.upgradeVault as { upgrades: { name: string; description: string }[] })
        .upgrades;
      for (const r of rows) {
        const kills = parsed.characters.reduce(
          (s, c) => s + Number((c.kills as number[] | undefined)?.[r.map] ?? 0),
          0,
        );
        const desc = upgrades.find((u) => u.name === r.row)?.description ?? '';
        const m = /Current_Kills:([\d,]+)(million)?/.exec(desc);
        expect(m, `${file} ${r.row}`).not.toBeNull();
        if (!m || kills >= 1e8) continue; // shown in millions past 1e8: rounded, skip
        // commaNotation rounds a fractional kill total, so allow one either way.
        expect(Math.abs(Number(m[1]?.replace(/,/g, '')) - kills)).toBeLessThanOrEqual(1);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('probeSlots skips maps that feed nothing', () => {
    expect(probeSlots(() => [0, 0], 5)).toEqual([]);
  });
});
