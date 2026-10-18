// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Points left on a tab (ADR 0010): the exact count when the Account State has one, else M9's bound.
import type { PresetTalents, TabPoints } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { exactPointsLeft, pointsLeft } from '../../src/talents/points';

const preset = (spent: number, points?: Partial<Record<1 | 'star', TabPoints>>): PresetTalents => ({
  tabs: [{ tab: 1, tabName: 'Rage Basics', talents: [{ id: 0, base: spent, max: 500 }] }],
  star: [],
  attackBar: null,
  ...(points ? { talentPoints: points } : {}),
});

const exact = (unspent: number, confidence: TabPoints['confidence'] = 'exact'): TabPoints => ({
  total: 100 + unspent,
  spent: 100,
  unspent,
  confidence,
  formula: 100 + unspent,
  oracle: null,
});
const bound: TabPoints = {
  total: null,
  spent: 100,
  unspent: null,
  confidence: 'bound',
  formula: 90,
  oracle: 120,
};
const none = new Set<number>();

describe('pointsLeft', () => {
  it('says the exact number when the Account State has it, even where the bound sees 0', () => {
    // Both presets spent 100: the lower bound is 0, the game shows 70.
    expect(pointsLeft(preset(100, { 1: exact(70) }), preset(100), 1, none)).toEqual({
      kind: 'exact',
      points: 70,
      verified: false,
      confidence: 'exact',
    });
    expect(pointsLeft(preset(100, { 1: exact(0, 'exact-verified') }), preset(100), 1, none)).toMatchObject({
      kind: 'exact',
      points: 0,
      verified: true,
    });
  });

  it('falls back to the lower bound on a bound tab, or without the field', () => {
    expect(pointsLeft(preset(100, { 1: bound }), preset(130), 1, none)).toEqual({
      kind: 'at-least',
      points: 30,
      verified: false,
      confidence: 'bound',
    });
    expect(pointsLeft(preset(100), preset(130), 1, none)).toMatchObject({ kind: 'at-least', points: 30 });
  });

  it('knows nothing without an exact count and without a second preset', () => {
    expect(pointsLeft(preset(100), null, 1, none)).toMatchObject({ kind: 'unknown', points: null });
    expect(pointsLeft(preset(100, { star: bound }), preset(0), 'star', none)).toMatchObject({
      kind: 'unknown',
    });
  });
});

describe('exactPointsLeft', () => {
  it('is the exact count, or null when only the bound is known', () => {
    expect(exactPointsLeft(preset(1, { 1: exact(5) }), 1)).toBe(5);
    expect(exactPointsLeft(preset(1, { 1: bound }), 1)).toBeNull();
    expect(exactPointsLeft(preset(1), 1)).toBeNull();
  });
});
