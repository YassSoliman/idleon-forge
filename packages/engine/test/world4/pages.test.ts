// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the read-only pages' data through the full golden engine. Before World 4 (scrubbed-w3) the
// pages draw the save's fresh records and nothing reaches Now; early in World 4 (first) the welcome lists
// the open steps; every public save gets its three pages; and the module adds no Goal of its own.
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { goldenResult } from '../../src/golden';
import type { EngineResult } from '../../src/result';
import { isWorld4ReadOnly } from '../../src/world4';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const run = (id: string): EngineResult => {
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
const W4 = new Set(['lab', 'cooking', 'breeding']);

describe('before World 4 (scrubbed-w3)', () => {
  const r = run('scrubbed-w3');
  it('is not reached: no welcome, no read-only flag', () => {
    expect(r.world4?.reached).toBe(false);
    expect(r.world4?.welcome).toBeNull();
    expect(isWorld4ReadOnly(r, 'lab')).toBe(false);
  });
  it('the fresh records say what to do first, from the save', () => {
    expect(r.world4?.breeding?.frame.title).toBe('Your nest is full: hatch your 3 eggs');
    expect(r.world4?.cooking?.frame.title).toBe('Get your first spice in Breeding, then put it in Kitchen 1');
    expect(r.world4?.lab?.frame.title).toBe('Upload 2 characters and line them up toward Animal Farm');
    expect(r.world4?.lab?.frame.why).toContain('138 px from the prism');
  });
});

describe('early World 4 (first)', () => {
  const r = run('first');
  it('reached: the three pages are read-only pages', () => {
    for (const id of W4) expect(isWorld4ReadOnly(r, id)).toBe(true);
    expect(isWorld4ReadOnly(r, 'stamps')).toBe(false);
  });
  it('the welcome counts what the save shows and lights the first open step', () => {
    const w = r.world4?.welcome;
    expect(w?.steps.map((s) => [s.key, s.progress, s.done])).toEqual([
      ['gobo', '5 of 5', true],
      ['elites', '6 of 6', true],
      ['kitchens', '4 of 4 kitchens', true],
      ['lab', 'a bonus is lit', true],
      ['openers', 'Repository open · 5 of 7', false],
    ]);
    expect(w?.steps.find((s) => s.now)?.key).toBe('openers');
  });
  it('pages: four kitchens busy, one egg filling, Animal Farm next', () => {
    expect(r.world4?.cooking?.frame.title).toBe('All 4 kitchens busy');
    expect(r.world4?.cooking?.kitchens.map((k) => k.badge)).toEqual(
      expect.arrayContaining(['recipe', 'cooking']),
    );
    expect(r.world4?.breeding?.frame.title).toMatch(/^1 egg in the nest · full in /);
    expect(r.world4?.lab?.frame.title).toBe('3 bonuses lit · next on the board: Animal Farm');
    expect(r.world4?.lab?.board.characters).toHaveLength(4);
  });
});

describe.each(fixtures.map((f) => f.id))('%s', (id) => {
  const r = run(id);
  it('has the three pages and no World 4 Goal', () => {
    expect(r.world4?.lab).toBeTruthy();
    expect(r.world4?.cooking).toBeTruthy();
    expect(r.world4?.breeding).toBeTruthy();
    const goals = [...r.account.goals, ...r.characters.flatMap((c) => c.goals)];
    expect(goals.filter((g) => W4.has(g.system ?? ''))).toEqual([]);
  });
});
