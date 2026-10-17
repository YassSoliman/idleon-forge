// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator from '@idleon-forge/knowledge/generators/statues.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

describe('statues generator', () => {
  it("ids and goldOrder come from the statue's own index field (synthetic slice, hand-checked)", () => {
    const out = runOnSlice(generator, {
      statues: [
        { index: 4, name: 'HEALTH', effect: '@BASE_HEALTH', bonus: 3 },
        { index: 0, name: 'POWER', effect: '@BASE_DAMAGE', bonus: 3 },
      ],
    });
    expect(out.entries?.map((e) => [e.id, e.values.goldOrder])).toEqual([
      ['statues.acquisition.statue-4', 4],
      ['statues.acquisition.statue-0', 0],
    ]);
  });

  it('holds its invariants on the pinned data: 32 statues, 0–31', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    expect(out.entries).toHaveLength(32);
    // Hand-checked in shared-data statues: index 0 POWER, index 2 MINING.
    const byId = new Map(out.entries.map((e) => [e.id, e.values]));
    expect(byId.get('statues.acquisition.statue-0')).toMatchObject({ name: 'POWER', goldOrder: 0 });
    expect(byId.get('statues.acquisition.statue-2')).toMatchObject({ name: 'MINING' });
    expect(byId.has('statues.acquisition.statue-31')).toBe(true);
  });

  it("matches Toolbox's parsed statues on a known save", async () => {
    const out = await runLive(generator);
    const parsed = knownSave('latest.json').account.statues as { index: number; name: string }[];
    for (const e of out.entries) {
      const t = parsed.find((s) => s.index === e.values.index);
      expect(t?.name).toBe(e.values.name);
    }
  });
});
