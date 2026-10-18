// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The M8 Cards view on the two private saves (local only: fixtures/private is gitignored, so these skip
// in CI). By class and level, never by name.
import { describe, expect, it } from 'vitest';
import { buildCardsView } from '../../src/collections';
import { hasPrivate, privateFile } from '../walkthrough/helpers';
import { cardsState, facts } from './cards-helpers';

const view = (stem: 'yasser' | 'joseph') => {
  const s = cardsState(privateFile(stem));
  const v = buildCardsView(s, facts);
  const of = (cls: string, level: number) =>
    v?.characters.find(
      (c) => c.index === s.characters.find((x) => x.class === cls && x.level === level)?.index,
    );
  return { s, v, of };
};

describe.skipIf(!hasPrivate('joseph'))('the W3-early private save', () => {
  it('the fighting Wizard switches to card preset 1, and every grind line is in W1–W3', () => {
    const { v, of } = view('joseph');
    expect(of('Wizard', 73)?.recommendations[0]?.where).toBe('Switch to card preset 1 (fits fighting)');
    const all = v?.characters.flatMap((c) => c.grind) ?? [];
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((g) => g.world <= 3)).toBe(true);
  });
});

describe.skipIf(!hasPrivate('yasser'))('the W2-late private save', () => {
  it('the mining Squire fills card preset 2, Iron card first; no grind line past W2', () => {
    const { v, of } = view('yasser');
    const r = of('Squire', 43)?.recommendations[0];
    expect(r?.where).toBe('Fill empty card preset 2, then switch to it');
    expect(r?.cards[0]?.name).toBe('Iron');
    expect((v?.characters.flatMap((c) => c.grind) ?? []).every((g) => g.world <= 2)).toBe(true);
  });
});
