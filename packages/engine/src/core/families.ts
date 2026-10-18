// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-F4, TR-5: each character's class family (the who-glyph chibi), from `classes.fact.class-tree`.
// The family is the class's line: Beginner (no line) is `beginner`, the Journeyman line `journeyman`,
// and the Warrior, Archer and Mage lines their own. Read in the worker so the UI never imports the KB.
import { type ClassRow, classTree } from '../metapath/knowledge';
import type { FactLookup } from '../metapath/types';
import type { ClassFamily } from '../result';

const LINES: Readonly<Record<string, ClassFamily>> = {
  Journeyman: 'journeyman',
  Warrior: 'warrior',
  Archer: 'archer',
  Mage: 'mage',
};

/** The family of one class-tree row; null for a line the who-glyph has no chibi for. */
export function familyOf(row: Pick<ClassRow, 'line' | 'tier'>): ClassFamily | null {
  if (row.line === null) return row.tier === 'beginner' ? 'beginner' : null;
  return LINES[row.line] ?? null;
}

/** `CharacterState.index` -> family, for every character whose class is in the tree. */
export function classFamilies(
  kb: FactLookup,
  characters: readonly { index: number; classIndex?: number | null }[],
): Record<number, ClassFamily> {
  let tree: ReturnType<typeof classTree>;
  try {
    tree = classTree(kb);
  } catch {
    return {};
  }
  const out: Record<number, ClassFamily> = {};
  for (const c of characters) {
    const row = c.classIndex == null ? undefined : tree.byIndex.get(c.classIndex);
    const family = row ? familyOf(row) : null;
    if (family) out[c.index] = family;
  }
  return out;
}
