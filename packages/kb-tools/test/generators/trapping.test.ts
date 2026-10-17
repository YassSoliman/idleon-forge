// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type TrapKindRow, trapDurations } from '@idleon-forge/knowledge/generators/trapping.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive } from './helpers';

describe('trapping generator', () => {
  it('reads trapTime as seconds per trap kind (synthetic slice, hand-checked)', () => {
    expect(trapDurations([[{ trapTime: 1200, quantity: 1, exp: 1, trapType: 0 }]])).toEqual([
      { kind: 0, durations: [{ seconds: 1200, quantity: 1, exp: 1, trapType: 0 }] },
    ]);
    expect(() => trapDurations([[{ trapTime: '20m' }]])).toThrow(/not a number/);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const rows = out.facts[0]?.rows as unknown as TrapKindRow[];
    // Hand-checked in shared-data traps at the pin: 7 kinds; kind 0 offers 20 min, 1 h, 8 h and 20 h.
    expect(rows).toHaveLength(7);
    expect(rows[0]?.durations.map((d) => d.seconds)).toEqual([1200, 3600, 28800, 72000]);
    expect(out.facts.map((f) => f.id)).toEqual(['trapping.fact.trap-durations']);
  });

  it("finds every placed trap's time in its kind's durations, as Toolbox's traps parser does, on a known save", async () => {
    const rows = (await runLive(generator)).facts[0]?.rows as unknown as TrapKindRow[];
    const traps = knownSave('latest.json').account.traps as {
      trapType: number;
      trapData?: { trapTime: number };
    }[][];
    let checked = 0;
    for (const slots of traps ?? [])
      for (const t of slots ?? []) {
        if (!t?.trapData) continue;
        expect(rows[t.trapType]?.durations.some((d) => d.seconds === t.trapData?.trapTime)).toBe(true);
        checked++;
      }
    expect(checked).toBeGreaterThan(5);
  });
});
