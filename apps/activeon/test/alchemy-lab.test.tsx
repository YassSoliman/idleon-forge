// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M19 F6 in the DOM: the Alchemy page lights exactly one bubble (FR-8), or the Water tube when opened from
// M3's line (US-6), labels only the lit vial and the roll targets (the critique's small-text fix), and the
// page entry is a lazy chunk (TR-8).
import type { AlchemyResult, BubblePick, PotView } from '@idleon-forge/engine/result';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AlchemyLab from '../src/alchemy/AlchemyLab';
import { SYSTEM_PAGES, type SystemPageBodyProps } from '../src/systems/pages';

afterEach(() => cleanup());

const KEY = 'alchemy-bubbles.goal.level-next@account';
const WATER = 'alchemy.check.liquid-cap-line@account';
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
  tubes: [
    {
      index: 0,
      name: 'Water',
      current: 32,
      max: 32,
      open: true,
      opensAt: null,
      actionKey: WATER,
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
const props = (highlight: string | null) =>
  ({ s: { result: { alchemy: result } }, page: { highlight, goals: [] } }) as unknown as SystemPageBodyProps;

describe('the Alchemy page (M19 F6)', () => {
  it('lights only the Power pot with no highlight, and each pot reads its own pick', () => {
    const { container } = render(<AlchemyLab {...props(null)} />);
    const lit = container.querySelectorAll('.al-pot.lit');
    expect(lit).toHaveLength(1);
    expect(lit[0]?.textContent).toContain('Next: Roid Ragin 3 → 12');
    const text = container.textContent ?? '';
    expect(text).toContain('Next: Swift Steppin 1 → 8');
    expect(text).toContain('Stable Jenius 1 → 12 · needs Water');
    expect(text).toContain('Nothing to level yet · spend brew');
    expect(container.querySelector('.al-tube.lit')).toBeNull();
  });

  it("opened from M3's Water line, the Water tube is lit instead of the pot", () => {
    const { container } = render(<AlchemyLab {...props(WATER)} />);
    expect(container.querySelectorAll('.al-pot.lit')).toHaveLength(0);
    expect(container.querySelector('.al-tube.lit')?.textContent).toContain('32 of 32 · full');
  });

  it('labels only the lit vial and the roll targets on the shelf', () => {
    const { container } = render(<AlchemyLab {...props(null)} />);
    const labels = [...container.querySelectorAll('.al-shelf .al-vlab')].map((x) => x.textContent);
    expect(labels).toEqual(['Copper Corona', 'Dieter Drink 40+']);
  });

  it('is registered as the alchemy-lab page', () => {
    expect(SYSTEM_PAGES['alchemy-lab']).toBeDefined();
  });
});
