// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { describe, expect, it } from 'vitest';
import {
  describeActivity,
  formatAge,
  freshnessHint,
  HINT_OPEN_GAME,
  HINT_SWITCH,
  UNKNOWN_ACTIVITY,
} from '../src/format';

describe('freshnessHint (US-4)', () => {
  const now = Date.UTC(2026, 9, 17, 12);
  const s = (seconds: number) => now - seconds * 1000;
  it.each([
    ['one normal save cycle (4 min 10 s since the last snapshot)', 'live', s(250), s(250), null],
    ['6 min 1 s without a snapshot', 'live', s(361), s(361), HINT_SWITCH],
    // The timer runs from the snapshot received, not the save's clock.
    ['an old save clock but a fresh snapshot', 'live', s(400), s(10), null],
    ['a save 9 h old at open', 'live', s(9 * 3600), s(1), HINT_OPEN_GAME],
    ['a pasted save', 'paste', s(9 * 3600), null, null],
  ] as const)('%s', (_label, source, lastCloudSave, lastSnapshotAt, hint) => {
    expect(freshnessHint({ now, source, lastCloudSave, lastSnapshotAt })).toBe(hint);
  });
});

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
