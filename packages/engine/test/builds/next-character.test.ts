// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The "Next character" card (M21 owner request, area C): the next slot's class from M2 FR-8/FR-9 and
// its family-level gate from M15 F3, shown even when another family unlock (an obol slot) is nearer.
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const engineOn = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return goldenResult({
    state: stateOf(f),
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};

describe('the Next character card', () => {
  it('W2-late: slot 6 is a Hunter (Archer at Lv 10), opening at family level 300', () => {
    const n = engineOn('scrubbed-w2').nextCharacter;
    expect(n).toMatchObject({
      slotNumber: 6,
      baseClass: 'Archer',
      line: 'Hunter',
      slotOpen: false,
      opensAt: 300,
    });
    expect(n?.gap).toBeGreaterThan(0);
    expect(n?.steps).toEqual([
      'Pick The Fuzzy Dice when you create it',
      'Make a Hunter: pick Archer at level 10, then Hunter at Speccius',
    ]);
    expect(n?.why).toMatch(/^No one plays a Hunter yet/);
  });

  // W3-early has no Hunter (Wizard, two Squires, Bowman, Barbarian, Shaman), so M2 picks the Hunter line,
  // as the Design Lab's own render of this save says ("Character slot 7 opens at 500. Make it a Hunter").
  it('W3-early: slot 7 is a Hunter at family level 500, even with the obol slot nearer', () => {
    const r = engineOn('scrubbed-w3');
    expect(r.nextCharacter).toMatchObject({
      slotNumber: 7,
      line: 'Hunter',
      slotOpen: false,
      opensAt: 500,
    });
    expect(r.nextCharacter?.steps.at(-1)).toBe(
      'Make a Hunter: pick Archer at level 10, then Hunter at Speccius',
    );
    // No save history in a golden run: the ETA says so instead of inventing a pace.
    expect(r.nextCharacter?.eta).toEqual({ kind: 'no-history' });
  });
});
