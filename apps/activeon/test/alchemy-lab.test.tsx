// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F6 in the DOM: the Alchemy page lights exactly one bubble (FR-8), or the Water tube when opened from
// M3's line (US-6), labels only the lit vial and the roll targets (the critique's small-text fix), and the
// page entry is a lazy chunk (TR-8).
import type { AlchemyResult, BubblePick, PotView } from '@idleon-forge/engine/result';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { alchemySections } from '../src/alchemy/AlchemyTabs';
import { FULL_PAGES, type SystemPageBodyProps } from '../src/systems/pages';

afterEach(() => cleanup());

const KEY = 'alchemy-bubbles.goal.level-next@account';
const pick = (o: Partial<BubblePick>): BubblePick => ({
  cauldron: 'power',
  rawName: 'aUpgradesO0',
  name: 'Roid Ragin',
  from: 3,
  to: 12,
  atLeast: 9,
  band: 12,
  blocked: null,
  actionKey: null,
  ...o,
});
const pot = (cauldron: PotView['cauldron'], next: BubblePick | null, locked: string[] = []): PotView => ({
  cauldron,
  next,
  rows: next ? [next] : [],
  locked,
  expectedNewBubbles: 2,
  unlockedBubbles: 3,
  nextUnlock: null,
});
const result: AlchemyResult = {
  band: 'w2',
  pick: pick({ actionKey: KEY }),
  pots: [
    pot('power', pick({ actionKey: KEY })),
    pot(
      'quicc',
      pick({ cauldron: 'quicc', rawName: 'aUpgradesG0', name: 'Swift Steppin', from: 1, to: 8, atLeast: 7 }),
    ),
    pot(
      'high-iq',
      pick({
        cauldron: 'high-iq',
        rawName: 'aUpgradesP0',
        name: 'Stable Jenius',
        from: 1,
        to: 12,
        atLeast: 0,
        blocked: { rawName: 'Liquid1', name: 'Water', more: 2, liquid: true },
      }),
    ),
    pot('kazam', null, ['Prowesessary']),
  ],
  column: { power: [], quicc: [], 'high-iq': [], kazam: [] },
  vials: [
    { index: 0, name: 'Copper Corona', level: 1, rollNeeded: null, lit: true, rollTarget: false },
    { index: 1, name: 'Sippy Splinters', level: 1, rollNeeded: null, lit: false, rollTarget: false },
    { index: 5, name: 'Dieter Drink', level: 0, rollNeeded: 40, lit: false, rollTarget: true },
    { index: 6, name: 'Thumb Pow', level: 0, rollNeeded: 50, lit: false, rollTarget: false },
  ],
  vialPick: { name: 'Copper Corona', from: 1, to: 2, actionKey: 'alchemy-vials.goal.level-next@account' },
  rollTargets: [{ name: 'Dieter Drink', rollNeeded: 40, item: 'Bean Slices' }],
  vialTries: {
    tryable: [
      {
        index: 5,
        name: 'Dieter Drink',
        rollNeeded: 40,
        item: 'Bean Slices',
        held: 6561,
        places: [
          { place: 'storage', amount: 6552 },
          { place: 'bag', index: 2, amount: 9 },
        ],
        elsewhere: { refinery: 0, forge: 0 },
      },
      {
        index: 7,
        name: 'Red Malt',
        rollNeeded: 85,
        item: 'Redox Salts',
        held: 1,
        places: [{ place: 'storage', amount: 1 }],
        elsewhere: { refinery: 56, forge: 0 },
      },
    ],
    missing: [{ index: 6, name: 'Thumb Pow', rollNeeded: 50, item: 'Trusty Nails' }],
  },
  tubes: [
    {
      index: 0,
      name: 'Water',
      current: 32,
      max: 32,
      open: true,
      opensAt: null,
      actionKey: 'alchemy.check.liquid-cap-line@account',
      note: null,
    },
    {
      index: 1,
      name: 'Liquid Nitrogen',
      current: 0,
      max: 0,
      open: false,
      opensAt: 20,
      actionKey: null,
      note: null,
    },
  ],
  p2w: [
    {
      key: 'player.speed',
      row: 'Player',
      label: 'Speed',
      level: 10,
      max: 13,
      closed: false,
      next: true,
      actionKey: null,
    },
  ],
  planMet: false,
  notes: { planMet: 'Bubble Plan met for your Stage', covers: null, unlocks: 'unlocks with brew: spend it' },
  attempts: { current: 11, max: 11 },
  topStep: { key: 'x@account', text: 'Use your 11 vial attempts on the W2 town cauldron' },
};
const props = (tile = 'alchemy') =>
  ({
    s: {
      result: { alchemy: result, characters: [{ index: 2, classLabel: 'Shaman', level: 76 }] },
      view: { roster: [{ index: 2, classLabel: 'Shaman', level: 76 }] },
      toSpend: () => {},
    },
    page: { highlight: null, goals: [], tile: { id: tile } },
  }) as unknown as SystemPageBodyProps;
const tab = (id: string, tile?: string) => {
  const t = alchemySections(props(tile))?.tabs.find((x) => x.id === id);
  if (!t) throw new Error(`no ${id} tab`);
  return render(t.render());
};

describe('the Alchemy page (M19 F6, M24 sections)', () => {
  it('Cauldrons: lights only the Power pot, and each pot reads its own pick', () => {
    const { container } = tab('cauldrons');
    const lit = container.querySelectorAll('.al2-pot.is-now');
    expect(lit).toHaveLength(1);
    expect(lit[0]?.textContent).toContain('Next: Roid Ragin 3 → 12');
    const text = container.textContent ?? '';
    expect(text).toContain('Next: Swift Steppin 1 → 8');
    expect(text).toContain('Stable Jenius 1 → 12 · needs Water');
    expect(text).toContain('Nothing to level yet · spend brew');
  });

  it("each Alchemy System opens on its own tab; the answer counts today's tries", () => {
    expect(alchemySections(props('alchemy'))?.initialTab).toBe('cauldrons');
    expect(alchemySections(props('alchemy-bubbles'))?.initialTab).toBe('bubbles');
    expect(alchemySections(props('alchemy-vials'))?.initialTab).toBe('vials');
    expect(alchemySections(props('alchemy-p2w'))?.initialTab).toBe('p2w');
    expect(alchemySections(props())?.answer).toBeNull();
  });

  it('Liquids: Water full, Nitrogen opens at Alchemy 20', () => {
    const { container } = tab('liquids');
    expect(container.textContent).toContain('opens at Alchemy 20');
  });

  it('Vials: every locked vial you can try, easiest first, with what you hold and where', () => {
    const { container } = tab('vials');
    const rows = [...container.querySelectorAll('.vt-row')].map((r) => r.textContent);
    expect(rows).toEqual([
      'Dieter Drinkroll 40+ to unlockBean SlicesStorage 6,552 · Shaman 76 has 96,561held',
      'Red Maltroll 85+ to unlockRedox SaltsStorage · 56 more sit in the Refinery1held',
    ]);
    expect(container.textContent).toContain('2 of 3 locked vials');
    const missing = [...container.querySelectorAll('.vt-tile')].map((r) => r.textContent);
    expect(missing).toEqual(['Thumb Powneeds Trusty Nails50+']);
    // M25: the item's game sprite stands where its monogram stood (the monogram is the fallback).
    expect(container.querySelectorAll('.vt-row img.g-art, .vt-tile img.g-art')).toHaveLength(5);
  });

  it('is the full page of all four Alchemy Systems', () => {
    for (const id of ['alchemy', 'alchemy-bubbles', 'alchemy-vials', 'alchemy-p2w'])
      expect(FULL_PAGES[id]).toBeDefined();
  });
});
