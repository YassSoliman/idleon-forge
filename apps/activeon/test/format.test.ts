// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { describe, expect, it } from 'vitest';
import { describeActivity, formatAge, UNKNOWN_ACTIVITY } from '../src/format';

describe('formatAge', () => {
  it.each([
    [0, '0s'],
    [42.9, '42s'],
    [119, '119s'],
    [300, '5m'],
    [7300, '2h 1m'],
    [200_000, '2d'],
    [-5, '0s'],
  ])('%d s -> %s', (s, label) => {
    expect(formatAge(s)).toBe(label);
  });
});

describe('describeActivity', () => {
  it.each([
    [{ afkType: 'FIGHTING', afkTarget: 'Purp_Mushroom' }, 'Fighting · Purp Mushroom'],
    [{ afkType: 'MINING', afkTarget: 'Copper_Ore' }, 'Mining · Copper Ore'],
    [{ afkType: 'LABORATORY', afkTarget: 'Laboratory' }, 'In the Lab'],
    [{ afkType: 'COOKING', afkTarget: 'Cooking' }, 'Cooking'],
    [{ afkType: 'Nothing', afkTarget: null }, 'No AFK target set'],
    [{ afkType: 'NEW_SKILL', afkTarget: 'Thing' }, 'New skill · Thing'],
    // An id the parser pin doesn't know is unknown, never "No AFK target set" (FR-19a).
    [{ afkType: null, afkTarget: null }, UNKNOWN_ACTIVITY],
  ])('%j -> %s', (c, label) => {
    expect(describeActivity(c)).toBe(label);
  });
});
