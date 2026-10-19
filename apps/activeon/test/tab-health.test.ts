// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 QA P1-11: the Cards tab health (Characters' Card preset square, the Now card's chip, the tab badge)
// says what the Cards tab says. "Wrong preset" only when the tab's own recommendation is to switch.
import type { NowView } from '@idleon-forge/engine/now';
import { describe, expect, it } from 'vitest';
import { TAB_HEALTH } from '../src/now/tab-health';

const rec = (preset: number | null, swaps = 0) => ({
  activity: 'fighting',
  reason: 'afk-target' as const,
  preset,
  where: '',
  cards: [],
  swaps: Array.from({ length: swaps }, () => ({ from: null, to: {}, text: 'Add' })),
  done: swaps === 0,
  set: null,
  setNote: null,
});
const char = (o: Record<string, unknown>) => ({
  index: 0,
  who: 'Shaman 76',
  activity: 'fighting',
  unknown: null,
  slotCount: 4,
  presetsLocked: null,
  presets: [],
  activePreset: 1,
  emptySlots: 0,
  set: null,
  recommendations: [],
  grind: [],
  grindNote: null,
  grindEmpty: '',
  overview: '',
  presetFits: true,
  ...o,
});
const health = (c: Record<string, unknown>) =>
  TAB_HEALTH.cards?.({ cards: { characters: [char(c)] } } as unknown as NowView, 0);

describe('Cards tab health', () => {
  it('an empty active preset the tab fills in place is its empty slots, not "wrong preset"', () => {
    const h = health({ presetFits: false, emptySlots: 4, recommendations: [rec(1, 4)] });
    expect(h).toEqual({ level: 'empty', word: '4 of 4 slots empty', count: 4 });
  });
  it('a mixed active preset the tab fixes in place is its swaps', () => {
    const h = health({ presetFits: false, recommendations: [rec(1, 3)] });
    expect(h).toEqual({ level: 'behind', word: '3 better cards', count: 3 });
  });
  it('says "wrong preset" when the tab says to switch to another preset', () => {
    expect(health({ presetFits: false, emptySlots: 2, recommendations: [rec(2, 0)] })).toEqual({
      level: 'fix',
      word: 'wrong preset',
    });
  });
  it('presets locked (no preset to switch to) never reads "wrong preset"', () => {
    expect(health({ presetFits: false, emptySlots: 1, recommendations: [rec(null, 1)] })?.level).toBe(
      'empty',
    );
  });
});

describe('Gear tab health', () => {
  const gear = (slots: { slot: string; state: string; levelsBehind?: number }[]) =>
    TAB_HEALTH.gear?.({ gear: { characters: [{ index: 0, slots }] } } as unknown as NowView, 0);
  it("counts armour, weapon and jewellery only, as the tab's legend does, never the tools (M24 QA P2)", () => {
    const h = gear([
      { slot: 'helmet', state: 'empty' },
      { slot: 'shirt', state: 'behind', levelsBehind: 5 },
      { slot: 'weapon', state: 'ok' },
      { slot: 'pickaxe', state: 'empty' },
      { slot: 'rod', state: 'empty' },
      { slot: 'trap', state: 'm20' },
    ]);
    expect(h).toEqual({ level: 'empty', word: '1 empty slot', count: 2 });
  });
  it('empty tools alone are fine', () => {
    expect(
      gear([
        { slot: 'helmet', state: 'ok' },
        { slot: 'net', state: 'empty' },
      ]),
    ).toEqual({ level: 'ok', word: 'ok' });
  });
});

describe('Signs tab health', () => {
  const signs = (matches: boolean, recommended: unknown[]) =>
    TAB_HEALTH.signs?.(
      {
        starSigns: { characters: [{ index: 0, activity: 'fighting', matches, recommended }] },
      } as unknown as NowView,
      0,
    );
  it('nothing to swap to is fine, never a "0" badge', () => {
    expect(signs(false, [])).toEqual({ level: 'ok', word: 'ok' });
  });
  it('counts the signs to swap', () => {
    expect(signs(false, [{}, {}])).toEqual({ level: 'behind', word: '2 signs to swap', count: 2 });
  });
});
