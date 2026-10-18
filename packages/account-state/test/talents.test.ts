// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9 TR-3, TR-4: both talent presets, the raw attack bars and the reset items.
import { describe, expect, it } from 'vitest';
import { attackBarOf, isKnown } from '../src';
import { accountStateOf, editedSave, PUBLIC_DIR, readSave } from './helpers';

const save = readSave(PUBLIC_DIR, 'latest.json');
const state = accountStateOf(save);

describe('characters[].talents', () => {
  it('reads the active preset, its star tab and the bar for every character of a public save', () => {
    for (const c of state.characters) {
      const t = c.talents;
      expect(t, `slot ${c.index}`).toBeTruthy();
      expect([0, 1]).toContain(t?.selectedPreset);
      expect(t?.active.tabs[0]?.tab).toBe(1);
      expect(t?.active.tabs.every((x) => x.talents.every((y) => y.base >= 0))).toBe(true);
      expect(Array.isArray(t?.active.attackBar)).toBe(true);
      // From Lv 15 the other preset is there too (Toolbox's talentPreset, the raw AttackLoadoutpre).
      if (c.level >= 15) expect(t?.other?.tabs.length).toBe(t?.active.tabs.length);
    }
  });

  it('keeps only rows 0–1 of the bar and drops "Null"', () => {
    expect(
      attackBarOf(
        JSON.stringify([
          [90, 91, 'Null'],
          [635, 'Null'],
          [1, 2],
        ]),
      ),
    ).toEqual([90, 91, 635]);
    expect(attackBarOf('not json')).toBeNull();
    expect(attackBarOf(undefined)).toBeNull();
  });

  it('a missing raw attack bar key makes that character’s talents null and Unknown, never empty', () => {
    const edited = accountStateOf(editedSave(save, (d) => delete d.AttackLoadout_0));
    expect(edited.characters.find((c) => c.index === 0)?.talents).toBeNull();
    expect(isKnown(edited, 'characters[0].talents')).toBe(false);
  });
});

describe('account.resetItems', () => {
  it('sums potions and fragments over storage and inventories', () => {
    const r = state.account.resetItems;
    expect(r).toEqual({ potions: expect.any(Number), fragments: expect.any(Number) });
    expect((r?.potions ?? -1) >= 0 && (r?.fragments ?? -1) >= 0).toBe(true);
  });
});
