// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55 contract tests: `account.poppy` is Toolbox's `kangaroo` read whole, and the counters it
// reads by index (resets done, Megafish, shiny catches) match the raw save.
import { describe, expect, it } from 'vitest';
import { accountStateOf, PUBLIC_DIR, readSave } from './helpers';

const raw = (file: string) => readSave(PUBLIC_DIR, file) as { data: Record<string, unknown> };
const ola = (file: string): unknown[] => {
  const v = raw(file).data.OptLacc;
  return Array.isArray(v) ? v : typeof v === 'string' ? JSON.parse(v) : [];
};

describe.each(['first.json', 'fourth.json'])('%s: Poppy never reached', (file) => {
  const p = accountStateOf(raw(file)).account.poppy;
  it('reads locked, with no fish and nothing bought', () => {
    expect(p?.unlocked).toBe(false);
    expect(p?.totalFish).toBe(0);
    expect(p?.upgrades?.every((u) => u.level === 0)).toBe(true);
    expect(p?.megafish).toBe(0);
  });
});

describe('highend.json: a pond well past its 12th Megafish', () => {
  const p = accountStateOf(raw('highend.json')).account.poppy;
  it('reads the counters at their save indices', () => {
    const o = ola('highend.json');
    expect(p?.unlocked).toBe(true);
    expect(p?.fisherooResets).toBe(Number(o[274]));
    expect(p?.megafish).toBe(Number(o[279]));
    expect(p?.shiny?.map((s) => s.caught)).toEqual([281, 282, 283, 284, 285, 286].map((i) => Number(o[i])));
  });
  it('carries the 12 upgrades, 5 spirals, 8 Tar Pit upgrades and 7 bonuses in game order', () => {
    expect(p?.upgrades?.map((u) => u.name)).toEqual([
      'tasty Fishbait',
      'Quick Reeling',
      'Shiny Lure',
      'Bonuses from Poppy',
      'fishy discount',
      'Juicy Worm',
      'Fisheroo Reset',
      'Fishing Buddy',
      'Lightning Quickness',
      'Fisheroo Investing',
      'Multihook Fishing',
      'Greatest Catch',
    ]);
    expect(p?.spirals).toHaveLength(5);
    expect(p?.tar?.upgrades).toHaveLength(8);
    expect(p?.bonuses?.map((b) => b.name)).toEqual([
      'Fishing Eff',
      'Defence',
      'Fishing XP',
      'Accuracy',
      'Total DMG',
      'AFK Gains',
      'Cash',
    ]);
  });
  it('totalFish is the fish held plus the bank (Toolbox totalFish)', () => {
    expect(p?.totalFish).toBeCloseTo((p?.fish ?? 0) + (p?.pendingFish ?? 0), -20);
  });
});
