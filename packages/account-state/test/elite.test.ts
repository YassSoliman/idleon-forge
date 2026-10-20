// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-17 contract tests: `characters[].eliteStep` (V8, V44) from the class and raw quest records, on
// the public saves and edited copies. Never a name.
import { describe, expect, it } from 'vitest';
import { eliteStepOf } from '../src';
import { accountStateOf, editedSave, PUBLIC_DIR, readSave } from './helpers';

describe('eliteStepOf', () => {
  it('a subclass with the Gang open counts its kills, capped at 10', () => {
    expect(eliteStepOf('Squire', { Eliteus1: 0 }, { Eliteus1: ['4'] })).toEqual({
      step: 'gang',
      elite: 'Divine_Knight',
      gangKills: 4,
    });
    expect(eliteStepOf('Wizard', '{"Eliteus1":-1}', '{"Eliteus1":[15]}')?.gangKills).toBe(10);
    expect(eliteStepOf('Hunter', {}, {})).toEqual({ step: 'gang', elite: 'Beast_Master', gangKills: 0 });
  });
  it('the Gang beaten: pick', () => {
    expect(eliteStepOf('Bowman', { Eliteus1: 1, Eliteus2: 0 }, {})).toEqual({
      step: 'pick',
      elite: 'Siege_Breaker',
      gangKills: null,
    });
  });
  it('an elite or a later class is done whatever its quests say', () => {
    expect(eliteStepOf('Divine_Knight', { Eliteus1: 1, Eliteus2: 0 }, {})?.step).toBe('done');
    expect(eliteStepOf('Death_Bringer', null, null)).toEqual({
      step: 'done',
      elite: 'Blood_Berserker',
      gangKills: null,
    });
  });
  it('a class Eliteus does not serve is none; unreadable quests are null', () => {
    expect(eliteStepOf('Maestro', null, null)?.step).toBe('none');
    expect(eliteStepOf('Mage', null, null)?.step).toBe('none');
    expect(eliteStepOf('Shaman', 'not json', {})).toBeNull();
  });
});

describe('characters[].eliteStep on the public saves', () => {
  it('first.json: six elites done, the Maestro is none', () => {
    const s = accountStateOf(readSave(PUBLIC_DIR, 'first.json'));
    expect(s.characters.map((c) => c.eliteStep?.step)).toEqual([
      'done',
      'done',
      'done',
      'done',
      'done',
      'done',
      'none',
    ]);
  });
  it('an edited first.json: a Siege Breaker back to Bowman with 3 Gang kills', () => {
    const save = editedSave(readSave(PUBLIC_DIR, 'first.json'), (d) => {
      d.CharacterClass_2 = 20;
      d.QuestComplete_2 = JSON.stringify({ ...JSON.parse(String(d.QuestComplete_2)), Eliteus1: 0 });
      d.QuestStatus_2 = JSON.stringify({ ...JSON.parse(String(d.QuestStatus_2)), Eliteus1: [3] });
    });
    const c = accountStateOf(save).characters.find((x) => x.index === 2);
    expect(c?.eliteStep).toEqual({ step: 'gang', elite: 'Siege_Breaker', gangKills: 3 });
  });
});
