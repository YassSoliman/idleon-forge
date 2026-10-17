// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import type { ParsedSave } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { AccountShapeError, EmptyAccountError, humanize, toAccountState, UNNAMED_WARNING } from '../src';
import { accountStateOf, NOW, PUBLIC_DIR, readSave } from './helpers';

const parsed = (over: Partial<ParsedSave> = {}): ParsedSave => ({
  account: {
    currentWorld: 2,
    finishedWorlds: { World1: true, World2: false },
    timeAway: { GlobalTime: 1000 },
  },
  characters: [
    {
      name: 'Test',
      class: 'Beginner',
      level: 3,
      afkType: 'FIGHTING',
      afkTarget: 'Green_Mushroom',
      currentMap: 'Blunder_Hills',
      afkTime: 1_000_000,
      food: [
        { name: 'Golden_Jam', amount: 5, rawName: 'FoodG1' },
        { rawName: 'Blank', amount: 0 },
      ],
    },
  ],
  failedSections: [],
  error: null,
  meta: { now: 1_060_000, saveVersion: 34.05, capturedAt: null, parserGameVersion: '2.3.540' },
  ...over,
});

describe('toAccountState', () => {
  it('projects the minimal fields', () => {
    const state = toAccountState(parsed());
    expect(state.account).toEqual({
      currentWorld: 2,
      finishedWorlds: [1],
      lastCloudSave: 1_000_000,
      secondsSinceLastSave: 60,
      gameVersion: { serverBuild: null, saveVersion: 34.05, parserTarget: '2.3.540' },
    });
    expect(state.characters).toEqual([
      {
        index: 0,
        name: 'Test',
        class: 'Beginner',
        level: 3,
        afkType: 'FIGHTING',
        afkTarget: 'Green_Mushroom',
        currentMap: 'Blunder_Hills',
        foodStacks: [{ item: 'Golden_Jam', amount: 5 }],
        secondsSinceLastSave: 60,
      },
    ]);
  });

  it('treats an empty parsed account as a hard error', () => {
    expect(() => toAccountState(parsed({ account: {}, characters: [] }))).toThrow(EmptyAccountError);
    expect(() => toAccountState(parsed({ account: {}, error: 'boom' }))).toThrow(/boom/);
  });

  it('treats an account with no character data as a hard error', () => {
    expect(() => toAccountState(parsed({ characters: [{ playerId: 0, name: 'Stub' }] }))).toThrow(
      EmptyAccountError,
    );
  });

  it('skips stub characters with a warning', () => {
    const base = parsed();
    const state = toAccountState({ ...base, characters: [...base.characters, { name: 'Stub' }] });
    expect(state.characters).toHaveLength(1);
    expect(state.warnings).toEqual(['Character 2 has no save data and was skipped.']);
  });

  it('numbers characters when the save carries no names (a bare paste)', () => {
    const [c] = parsed().characters;
    const state = toAccountState(parsed({ characters: [{ ...c, name: undefined }] }));
    expect(state.characters[0]?.name).toBe('Character 1');
    expect(state.warnings).toEqual([UNNAMED_WARNING]);
  });

  it('fails loudly when upstream renames a field', () => {
    const [c] = parsed().characters;
    expect(() => toAccountState(parsed({ characters: [{ ...c, level: undefined, lvl: 3 }] }))).toThrow(
      AccountShapeError,
    );
  });

  it('never reports negative ages', () => {
    const state = toAccountState(parsed({ meta: { ...parsed().meta, now: 0 } }));
    expect(state.account.secondsSinceLastSave).toBe(0);
    expect(state.characters[0]?.secondsSinceLastSave).toBe(0);
  });
});

describe('on real parser output', () => {
  it('rejects a save the parser silently fails on', () => {
    // Keys of one character from a public save, with its class corrupted: Toolbox swallows the crash.
    const save = readSave(PUBLIC_DIR, 'fresh.json') as { data: Record<string, unknown> };
    const data = Object.fromEntries(Object.entries(save.data).filter(([k]) => !/^(Lv0|EquipOrder)_/.test(k)));
    expect(() => accountStateOf({ data })).toThrow(EmptyAccountError);
  });

  it('is deterministic for a fixed now and moves with it', () => {
    const save = readSave(PUBLIC_DIR, 'first.json');
    const a = accountStateOf(save);
    expect(accountStateOf(save)).toEqual(a);
    const later = accountStateOf(save, NOW + 60_000);
    expect(later.account.secondsSinceLastSave).toBe((a.account.secondsSinceLastSave ?? 0) + 60);
  });
});

describe('humanize', () => {
  it.each([
    ['Siege_Breaker', 'Siege Breaker'],
    ['FIGHTING', 'Fighting'],
    ['Paying_Respect', 'Paying Respect'],
  ])('%s -> %s', (id, label) => {
    expect(humanize(id)).toBe(label);
  });
});
