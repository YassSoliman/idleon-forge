// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { capFromCurse } from '@idleon-forge/knowledge/generators/prayers.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('prayers generator', () => {
  it('parses the cap from the curse text and fails loudly when it no longer parses (synthetic slice)', () => {
    const out = runOnSlice(generator, {
      prayers: [
        { name: 'Unending_Energy', curse: 'Max_AFK_time_is_now_12_hours._Use_with_caution', prayerIndex: 2 },
      ],
    });
    expect(out.facts?.[0]?.rows).toEqual({ prayer: 'Unending_Energy', prayerIndex: 2, capSeconds: 43200 });
    expect(() => capFromCurse('Max_AFK_time_is_capped')).toThrow(/no longer reads/);
    expect(() => runOnSlice(generator, { prayers: [] })).toThrow(/not in the prayer data/);
  });

  it('holds its invariants on the pinned data: 36,000 s (M3 §facts)', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    // Hand-checked: the curse reads "Max_AFK_time_is_now_10_hours" at the pin -> 36,000 s.
    expect(out.facts[0]?.rows).toMatchObject({ capSeconds: 36000 });
  });

  it("reads the same curse Toolbox's parsed prayer list carries, on a known save", async () => {
    const out = await runLive(generator);
    const prayers = knownSave('latest.json').account.prayers as { name: string; curse: string }[];
    const ue = prayers.find((p) => p.name === 'Unending_Energy');
    const rows = out.facts[0]?.rows as unknown as { capSeconds: number } | undefined;
    expect(capFromCurse(ue?.curse)).toBe(rows?.capSeconds);
  });
});
