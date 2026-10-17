// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import generator, { type ClassTreeRow } from '@idleon-forge/knowledge/generators/classes.gen';
import { describe, expect, it } from 'vitest';
import { invariants, knownSave, runLive, runOnSlice } from './helpers';

const treeOf = (out: { facts?: { id: string; rows: unknown }[] }) =>
  out.facts?.find((f) => f.id === 'classes.fact.class-tree')?.rows as unknown as ClassTreeRow[];

describe('classes generator', () => {
  it('derives tier, line and swap sibling from promotions (synthetic slice, hand-checked)', () => {
    // A two-branch Warrior line plus a one-branch Journeyman line, shaped like classPromotions.json.
    const out = runOnSlice(generator, {
      classPromotions: {
        Beginner: { index: 1, promotesTo: ['Warrior'] },
        Journeyman: { index: 2, promotesTo: ['Maestro'] },
        Maestro: { index: 3, promotesFrom: 'Journeyman' },
        Warrior: { index: 7, promotesTo: ['Barbarian', 'Squire'], promotesFrom: 'Beginner' },
        Barbarian: { index: 8, promotesTo: ['Blood_Berserker'], promotesFrom: 'Warrior' },
        Squire: { index: 9, promotesTo: ['Divine_Knight'], promotesFrom: 'Warrior' },
        Blood_Berserker: { index: 10, promotesFrom: 'Barbarian' },
        Divine_Knight: { index: 12, promotesFrom: 'Squire' },
      },
    });
    const tree = treeOf(out);
    const row = (c: string) => tree.find((r) => r.class === c);
    expect(row('Beginner')).toMatchObject({ tier: 'beginner', line: null, swapSibling: null });
    expect(row('Journeyman')).toMatchObject({ tier: 'base', line: 'Journeyman' });
    expect(row('Maestro')).toMatchObject({ tier: 'subclass', line: 'Journeyman', swapSibling: null });
    expect(row('Squire')).toMatchObject({
      classIndex: 9,
      tier: 'subclass',
      line: 'Warrior',
      swapSibling: 'Barbarian',
    });
    expect(row('Divine_Knight')).toMatchObject({ tier: 'elite', swapSibling: 'Blood_Berserker' });
    // Acquisitions only for released subclass and elite classes.
    expect(out.entries?.map((e) => e.id).sort()).toEqual([
      'classes.acquisition.barbarian',
      'classes.acquisition.blood-berserker',
      'classes.acquisition.divine-knight',
      'classes.acquisition.maestro',
      'classes.acquisition.squire',
    ]);
  });

  it('holds its invariants on the pinned data', async () => {
    const out = await runLive(generator);
    expect(invariants(out)).toEqual([]);
    const tree = treeOf(out);
    // Hand-checked against classPromotions.json at the pin: 25 classes; Death_Bringer is index 14, a
    // master of the Warrior line; Siege_Breaker swaps with Beast_Master (Bowman/Hunter elites).
    expect(tree).toHaveLength(25);
    expect(tree.find((r) => r.class === 'Death_Bringer')).toMatchObject({
      classIndex: 14,
      tier: 'master',
      line: 'Warrior',
    });
    expect(tree.find((r) => r.class === 'Siege_Breaker')?.swapSibling).toBe('Beast_Master');
    expect(
      tree
        .filter((r) => r.tier === 'base')
        .map((r) => r.class)
        .sort(),
    ).toEqual(['Archer', 'Journeyman', 'Mage', 'Warrior']);
    expect(out.entries.length).toBeGreaterThanOrEqual(12);
    expect(out.entries.length).toBeLessThanOrEqual(20);
  });

  it("maps every character's classIndex to the class Toolbox parsed, on a known save", async () => {
    const out = await runLive(generator);
    const byIndex = new Map(treeOf(out).map((r) => [r.classIndex, r.class]));
    const chars = knownSave('latest.json').characters as { classIndex?: number; class?: string }[];
    const withClass = chars.filter((c) => typeof c.classIndex === 'number');
    expect(withClass.length).toBeGreaterThan(5);
    for (const c of withClass) expect(byIndex.get(c.classIndex as number)).toBe(c.class);
  });
});
