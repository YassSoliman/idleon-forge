// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-51 contract tests: `account.owl`. A save from before Orion reads no Owl; every number is Toolbox's
// parseOwl or accountOptions[253..264].
import { describe, expect, it } from 'vitest';
import { accountStateOf, PUBLIC_DIR, readSave } from './helpers';

const owlOf = (file: string) => accountStateOf(readSave(PUBLIC_DIR, file)).account.owl;

describe('account.owl', () => {
  it('first.json predates Orion: no Owl, not unknown', () => {
    const s = accountStateOf(readSave(PUBLIC_DIR, 'first.json'));
    expect(s.account.owl).toBeNull();
    expect(s.diagnostics.unknownFields).not.toContain('account.owl');
  });
  it('fresh.json: Orion never started, every slot 0', () => {
    expect(owlOf('fresh.json')).toMatchObject({
      feathers: 0,
      progress: 0,
      megafeathers: 0,
      bonusesLevel: 0,
      bonusMultiplier: 1,
    });
  });
  it('highend.json: 37 Megafeathers, Bonuses of Orion 41, all 9 upgrades open', () => {
    const o = owlOf('highend.json');
    expect(o?.megafeathers).toBe(37);
    expect(o?.bonusesLevel).toBe(41);
    expect(o?.restarts).toBe(46);
    expect(o?.nextUnlockAt).toBe(0);
    expect(o?.upgrades).toHaveLength(9);
    expect(o?.upgrades.every((u) => u.unlocked)).toBe(true);
    expect(o?.upgrades.map((u) => u.level)).toEqual([1650, 41, 1174, 815, 46, 1007, 340, 466, 37]);
    // Drop Rate: base 1 x multiplier x ceil((41 - 4) / 6) = 7 steps.
    const drop = o?.bonuses.find((b) => b.name === 'Drop Rate');
    expect(drop?.value).toBeCloseTo((o?.bonusMultiplier ?? 0) * 7, 6);
    expect(o?.bonuses.map((b) => b.name)).toEqual([
      'Class XP',
      'Base DMG',
      'Total DMG',
      'Skill XP',
      'Drop Rate',
      'All Stats',
    ]);
  });
});
