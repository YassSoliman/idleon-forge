// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F4, TR-5: every character's who-glyph family comes from classes.fact.class-tree.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { FactTable } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { classFamilies, familyOf } from '../../src/core/families';
import type { FactLookup } from '../../src/metapath/types';

const generated = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../knowledge/generated/classes.facts.json', import.meta.url)),
    'utf8',
  ),
) as { facts: FactTable[] };
const kb: FactLookup = { get: (id) => generated.facts.find((f) => f.id === id) };
const treeRows = (generated.facts.find((f) => f.id === 'classes.fact.class-tree')?.rows ?? []) as {
  class: string;
  classIndex: number;
}[];
const indexOf = (cls: string) => treeRows.find((r) => r.class === cls)?.classIndex;

describe('M21 FR-F4: class families', () => {
  it.each([
    ['Beginner', 'beginner'],
    ['Journeyman', 'journeyman'],
    ['Maestro', 'journeyman'],
    ['Voidwalker', 'journeyman'],
    ['Warrior', 'warrior'],
    ['Squire', 'warrior'],
    ['Divine_Knight', 'warrior'],
    ['Archer', 'archer'],
    ['Bowman', 'archer'],
    ['Beast_Master', 'archer'],
    ['Mage', 'mage'],
    ['Shaman', 'mage'],
    ['Wizard', 'mage'],
  ])('%s draws the %s chibi', (cls, family) => {
    const classIndex = indexOf(cls);
    expect(classIndex).toBeTypeOf('number');
    expect(classFamilies(kb, [{ index: 3, classIndex }])).toEqual({ 3: family });
  });

  it('leaves out a character with no class or an unknown class index', () => {
    expect(
      classFamilies(kb, [{ index: 0, classIndex: null }, { index: 1, classIndex: 9999 }, { index: 2 }]),
    ).toEqual({});
  });

  it('is empty without the fact table, never a throw', () => {
    expect(classFamilies({ get: () => undefined }, [{ index: 0, classIndex: 1 }])).toEqual({});
  });

  it('maps lines, not tiers', () => {
    expect(familyOf({ line: null, tier: 'beginner' })).toBe('beginner');
    expect(familyOf({ line: null, tier: 'base' })).toBeNull();
    expect(familyOf({ line: 'Unknown', tier: 'base' })).toBeNull();
  });
});
