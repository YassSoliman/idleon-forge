// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 F7 in the DOM: the Bubba page keeps Bubba's account bonuses and what is inside Bubba as two
// separate sections (FR-22, US-6), heads the Charisma Chart with "boosts Bubba only", shows the login
// warning only when some characters lack the door (FR-6), the idle line when there is no step, the
// broken state with no numbers (FR-24), and is its own lazy chunk (FR-3, TR-8).
import type { BubbaResult } from '@idleon-forge/engine/result';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { bubbaSections } from '../src/bubba/BubbaTabs';
import { FULL_PAGES, type SystemPageBodyProps } from '../src/systems/pages';
import { noAxeViolations } from './helpers/views';

afterEach(() => cleanup());

const NOW = Date.UTC(2026, 9, 17, 16, 12);
const attr = (
  id: number,
  name: string,
  level: number,
  over: Partial<
    BubbaResult['charisma'] extends infer C ? (C extends { attrs: (infer A)[] } ? A : never) : never
  > = {},
) => ({
  id,
  name,
  level,
  max: 120,
  next: level < 120 ? `${name} ${level} → ${level + 1}: +1% thing` : null,
  now: null,
  training: false,
  atMax: level >= 120,
  emulsified: false,
  ...over,
});
const W3: BubbaResult = {
  state: 'ok',
  step: {
    key: 'bubba.goal.visit@account',
    entryId: 'bubba.check.charisma-idle',
    text: "Train another attribute in Bubba's Charisma Chart: tap one that isn't maxed",
  },
  nextEvent: { label: 'Megaflesh 4', at: NOW + 3_600_000 },
  ratePerMin: '200M meat',
  projected: '102B meat',
  bonuses: [
    { key: 'buildRate', name: 'Build Rate', text: '+24% Build Rate', stacks: 2, rating: 'high', next: false },
    {
      key: 'critterGain',
      name: 'Critter Gain',
      text: '+1.2 base critters per trap',
      stacks: 2,
      rating: 'mid',
      next: false,
    },
    { key: 'soulGain', name: 'Soul Gain', text: '+12% Soul Gain', stacks: 2, rating: 'mid', next: false },
    {
      key: 'totalDamage',
      name: 'Total Damage',
      text: '+36% Total Damage',
      stacks: 2,
      rating: 'high',
      next: false,
    },
    { key: 'allKills', name: 'All Kills', text: '+1.2% All Kills', stacks: 1, rating: 'low', next: true },
    { key: 'expMulti', name: 'Class EXP', text: '+4.8% Class EXP', stacks: 1, rating: 'mid', next: false },
    { key: 'atomCost', name: 'Atom Cost', text: '−3.6% Atom Cost', stacks: 1, rating: 'low', next: false },
  ],
  boonNext: {
    level: 12,
    key: 'allKills',
    name: 'All Kills',
    add: '+1.2% All Kills',
    cost: '1.3T meat',
    at: NOW + 100 * 3_600_000,
    affordable: false,
  },
  megaflesh: {
    owned: 3,
    rows: Array.from({ length: 11 }, (_, i) => ({ row: i + 1, name: `Row ${i + 1}`, owned: i < 3 })),
    chromatic: 0,
    next: {
      row: 4,
      name: 'Pork Megaflesh',
      label: 'account bonuses 1.40x',
      text: "Bubba's IdleOn Bonuses are now all 1.40x higher",
      cost: '245B meat',
      have: 102e9,
      need: 245e9,
      progress: '102B of 245B',
      at: NOW + 11 * 3_600_000,
      affordable: false,
    },
    multiplier: '1.2x',
  },
  run: {
    nextType: 'More Dice opens at 3T meat made this run',
    nextBuys: [
      { index: 7, name: '2nd Slice', cost: '204M meat', tier: 4 },
      { index: 0, name: '1st Slice', cost: '669M meat', tier: 4 },
      { index: 11, name: 'Great Meat', cost: '1.1B meat', tier: 4 },
      { index: 2, name: 'Good Meat', cost: '1.8B meat', tier: 4 },
    ],
  },
  pats: { left: 10, perHour: 10, refillAt: null },
  smoker: null,
  charisma: {
    attrs: [
      attr(1, 'Hustle', 120, { training: true }),
      attr(2, 'Rizz', 0, { next: 'Rizz 0 → 1: −2.06% Costs' }),
      attr(3, 'Joy', 0),
      attr(4, 'Courage', 0),
      attr(5, 'Mindful', 0),
      attr(6, 'Savvy', 0),
    ],
    nextLevelAt: null,
    banked: 61,
    allMax: false,
    emulsifyOpen: false,
    mindfulFirst: null,
    targets: [
      {
        source: 'gameslikefinder',
        label: 'gameslikefinder (2026-05-27)',
        from: 1,
        gaps: [{ target: 45, gap: 0 }, { target: 15, gap: 15 }, { target: 15, gap: 15 }, null, null, null],
      },
    ],
  },
  gifts: ['Beeg Slice', 'Beach Ball'],
  dice: [5],
  loginNote: false,
  openOn: null,
  locked: { smoker: 'Opens at Smoker' },
};

const props = (b: BubbaResult | null) =>
  ({
    s: { now: NOW, result: { bubba: b } },
    page: { highlight: null, goals: [], wiki: 'https://idleon.wiki/wiki/Bubba' },
  }) as unknown as SystemPageBodyProps;

const tab = (b: BubbaResult | null, id: string) => {
  const t = bubbaSections(props(b))?.tabs.find((x) => x.id === id);
  if (!t) throw new Error(`no ${id} tab`);
  return render(t.render());
};

describe('M23 the Bubba page (M24 sections)', () => {
  it('is its own full page with four tabs', () => {
    expect(FULL_PAGES.bubba).toBeDefined();
    expect(bubbaSections(props(W3))?.tabs.map((t) => t.label)).toEqual([
      'Bonuses to your account',
      'This run',
      'Charisma',
      'Pats & gifts',
    ]);
  });

  it('keeps the account bonuses and the inside of Bubba apart (FR-22, US-6)', async () => {
    const { container } = tab(W3, 'bonuses');
    const account = screen.getByRole('region', { name: "Bubba's bonuses to your account" });
    expect(
      within(account).getByText('Permanent. From Bubba Boon, boosted by Megaflesh (1.2x now)'),
    ).toBeTruthy();
    expect(within(account).getAllByRole('listitem')).toHaveLength(7);
    expect(within(account).getByText('base critters per trap')).toBeTruthy();
    expect(within(account).queryByText(/Hustle/)).toBeNull();
    expect(within(account).getByText(/adds \+1\.2% All Kills · 1\.3T meat/)).toBeTruthy();
    await noAxeViolations(container);
    cleanup();
    tab(W3, 'charisma');
    const charisma = screen.getByRole('region', { name: 'Charisma Chart' });
    expect(
      within(charisma).getByText('Charisma boosts Bubba only. Your account bonuses come from Boon'),
    ).toBeTruthy();
    expect(within(charisma).getByText('max')).toBeTruthy();
    expect(within(charisma).getByText('Rizz 0 → 1: −2.06% Costs')).toBeTruthy();
  });

  it('This run folds the next buys to 3 (DS-9) and says what opens a locked part', () => {
    tab(W3, 'run');
    expect(screen.getByText('Show all 4')).toBeTruthy();
    expect(screen.getByText('Opens at Smoker')).toBeTruthy();
  });

  it("says the pats in the Timeline's words (R12 QA)", () => {
    tab(W3, 'pats');
    expect(screen.getByText('10 of 10 · full when you open Bubba')).toBeTruthy();
    cleanup();
    const refillAt = NOW + 51 * 60_000;
    tab({ ...W3, pats: { left: 21, perHour: 11, refillAt } }, 'pats');
    expect(screen.getByText('21 left · 11 a refill, refills in 51m')).toBeTruthy();
  });

  it("can't read: no numbers (FR-24)", () => {
    const { container } = tab({ ...W3, state: 'unknown' }, 'bonuses');
    expect(container.textContent).toBe("Can't read Bubba from this save");
  });

  it('not started: the sleeping blob and "Not making meat"', () => {
    tab({ ...W3, state: 'not-started' }, 'bonuses');
    expect(screen.getByText('Not making meat: buy 1st Slice')).toBeTruthy();
  });
});
