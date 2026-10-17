// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M8 on the two private saves (local only: fixtures/private is gitignored, so these skip in CI). They
// check the same stories as module.test.ts on the real saves, by class and level, never by name.
import { describe, expect, it } from 'vitest';
import { engineDetectors } from '../../detectors';
import { createCollectionsModule, evaluateStamps } from '../../src/collections';
import { lookupOf } from '../../src/metapath/knowledge';
import { input } from '../core/helpers';
import { hasPrivate, privateFixture } from '../metapath/helpers';
import { loadM8Kb, m8State } from './helpers';

const kb = loadM8Kb();
const m8 = createCollectionsModule({ kb, registry: engineDetectors });

const texts = (stem: 'yasser' | 'joseph') => {
  const s = m8State(privateFixture(stem));
  const out = m8.run(input(s, { now: s.account.lastCloudSave ?? 0 }));
  const row = (cls: string, level: number) =>
    (
      out.characters?.find(
        (c) => c.index === s.characters.find((x) => x.class === cls && x.level === level)?.index,
      )?.goals ?? []
    ).map((g) => g.goal.nextAction.text);
  return {
    s,
    row,
    account: (out.account?.goals ?? []).map((g) => g.goal.nextAction.text),
    play: (out.account?.activePlay ?? []).map((a) => a.text),
  };
};

describe.skipIf(!hasPrivate('yasser'))('the W2-late private save', () => {
  it('stamps, cards, presets and obols as the spec reads them', () => {
    const t = texts('yasser');
    expect(t.account.find((x) => x.startsWith('Buy 4 new stamps'))).toMatch(
      /Vitality.*Vendor.*Matty Bag.*Clover/,
    );
    expect(t.row('Barbarian', 60)).toContain(
      'Craft a Copper Chopper at the Anvil (6 Oak Logs), then give it to Hamish → Tomahawk Stamp',
    );
    expect(t.row('Squire', 43)).toContain(
      'Fill card preset 2 for Mining (Iron card first), then switch to it',
    );
    expect(t.row('Shaman', 44)).toContain(
      'Equip the Blunder Hills card set (tier 1, +8% EXP if below Lv 50)',
    );
    expect(t.account.some((x) => x.startsWith('Equip 1 stored obol in a family circle slot'))).toBe(true);
    expect(evaluateStamps(t.s, lookupOf(kb)).owned).toBe(8);
  });
});

describe.skipIf(!hasPrivate('joseph'))('the W3-early private save', () => {
  it('stamps, cards, presets and obols as the spec reads them', () => {
    const t = texts('joseph');
    expect(t.row('Bowman', 60)).toContain("Give Hamish the Copper Chopper you're carrying → Tomahawk Stamp");
    expect(t.row('Wizard', 73)).toEqual(
      expect.arrayContaining(["Use the Duplogs Stamp you're carrying", 'Switch to card preset 1 (fighting)']),
    );
    expect(t.row('Squire', 85)).toContain(
      'Buy a Bob Joe Pickle at the YumYum Grotto shop and give it to the Obol Altar',
    );
    expect(t.row('Squire', 51)).toContain('Equip 1 card in your empty card slots: Amarok');
    expect(t.play.some((x) => x.startsWith('Wellington 1 on Squire 85'))).toBe(true);
    expect(evaluateStamps(t.s, lookupOf(kb)).owned).toBe(17);
  });
});
