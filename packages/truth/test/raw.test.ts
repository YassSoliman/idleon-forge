// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The independent raw readers and the TotalTalentPoints floor (M22 TR-1).
import { describe, expect, it } from 'vitest';
import { CLASS_NAMES, TALENT_ORDER } from '../src/game-data';
import { readRawFacts } from '../src/raw/read';
import { returnClasses, skillTerms, starTotalFloor, unspentFloor } from '../src/raw/talent-points';
import { envelopeOf, SQUIRE, tabIds } from './helpers';

describe('game data from N.js', () => {
  it('names the classes the fixtures use', () => {
    expect(CLASS_NAMES[9]).toBe('SQUIRE');
    expect(CLASS_NAMES[20]).toBe('BOWMAN');
    expect(CLASS_NAMES[21]).toBe('HUNTER');
    expect(CLASS_NAMES[33]).toBe('SHAMAN');
  });
  it('has 15 talents per class row', () => {
    expect(TALENT_ORDER.length % 15).toBe(5);
    expect(tabIds(7)).toEqual([90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104]);
  });
});

describe('returnClasses (the game’s tab order)', () => {
  it.each([
    [1, [1]],
    [2, [1, 2]],
    [9, [6, 7, 9]],
    [10, [6, 7, 8, 10]],
    [14, [6, 7, 8, 10, 14]],
    [21, [18, 19, 21]],
    [25, [18, 19, 21, 25]],
    [29, [18, 19, 21, 25, 29]],
    [33, [30, 31, 33]],
  ])('class %i has tabs from %j', (cls, tabs) => {
    expect(returnClasses(cls)).toEqual(tabs);
  });
});

describe('TotalTalentPoints floor', () => {
  const inputs = (level: number, skills = [0, 0, 0, 0, 0, 0, 0, 0, 0]) => ({
    lv0: [level, ...skills],
    classId: SQUIRE,
    cy: [0, 0, 0, 0, 0, 0],
    achieveReg: [] as number[],
  });

  it('sums the skill levels as the game does', () => {
    expect(skillTerms([1, 10, 11, 4, 5, 0, 0, 0, 0, 0])).toEqual([-3 + 30, 5 + 5 + 2 + 2, 2 + 2 + 0 + 1]);
  });

  it('gives tab 1 three points a class level plus the skill levels', () => {
    expect(unspentFloor(inputs(40), 0, 0)).toBe(3 * 39 - 3);
    expect(unspentFloor(inputs(40, [10, 0, 0, 0, 0, 0, 0, 0, 0]), 0, 0)).toBe(3 * 39 - 3 + 10);
  });

  it('opens tab 2 at level 6 and tab 3 at level 29', () => {
    expect(unspentFloor(inputs(40), 1, 0)).toBe(3 * 34);
    expect(unspentFloor(inputs(40), 2, 0)).toBe(3 * 11);
    expect(unspentFloor(inputs(20), 2, 0)).toBe(0);
  });

  it('subtracts what the preset spent, never going below 0', () => {
    expect(unspentFloor(inputs(40), 2, 30)).toBe(3);
    expect(unspentFloor(inputs(40), 2, 50)).toBe(0);
  });

  it('adds CYTalentPoints and finished achievements', () => {
    const reg: number[] = [];
    reg[54] = -1;
    expect(unspentFloor({ ...inputs(40), cy: [7, 0, 0, 0, 0, 0], achieveReg: reg }, 0, 0)).toBe(114 + 7 + 5);
  });

  it('floors the star tab at level - 1 plus the skill terms', () => {
    expect(starTotalFloor(inputs(40))).toBe(39 - 3);
  });
});

describe('readRawFacts', () => {
  it('reads both presets into the game’s slots, with tab spend and the floor', () => {
    const raw = readRawFacts(
      envelopeOf([{ index: 0, selected: 1, live: { 90: 20, 91: 5 }, other: { 125: 30 } }]),
    );
    const c = raw.characters[0];
    expect(c?.className).toBe('SQUIRE');
    expect(c?.selectedPreset).toBe(1);
    const live = c?.presets.find((p) => p.slot === 1);
    const other = c?.presets.find((p) => p.slot === 0);
    expect(live?.live).toBe(true);
    expect(live?.tabs.map((t) => t.classId)).toEqual([6, 7, 9]);
    expect(live?.tabs[1]?.spent).toBe(25);
    expect(live?.tabs[1]?.unspentAtLeast).toBe(3 * 34 - 25);
    expect(other?.tabs[2]?.spent).toBe(30);
    expect(other?.tabs[2]?.unspentAtLeast).toBe(3);
  });

  it('reads coins, bags and the chest; Blank slots are empty', () => {
    const raw = readRawFacts(envelopeOf([{ index: 0, live: {}, money: 42 }]));
    expect(raw.characters[0]?.coins).toBe(42);
    expect(raw.characters[0]?.bag).toEqual({ Copper: 3 });
    expect(raw.bankCoins).toBe(1000);
    expect(raw.chest).toEqual({ Copper: 10, Iron: 5 });
  });

  it('lists unreadable keys and never throws', () => {
    expect(readRawFacts(null).characters).toEqual([]);
    const env = envelopeOf([{ index: 0, live: {} }]);
    env.data.SL_0 = '{not json';
    const raw = readRawFacts(env);
    expect(raw.unreadable).toContain('SL_0');
    expect(raw.characters[0]?.presets).toEqual([]);
  });
});
