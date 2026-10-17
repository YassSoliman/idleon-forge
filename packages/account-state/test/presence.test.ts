// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Golden tests for M1 RT-1, RT-2 and FR-19b: Toolbox parses a save with a missing raw key or an id it
// doesn't know without a word, so the adapter must turn each into Unknown, never a default.
// Inputs are public Toolbox saves with keys deleted and ids replaced.
import { describe, expect, it } from 'vitest';
import { EmptyAccountError, FIELD_RAW_KEYS, FIELD_SOURCES, isKnown } from '../src';
import { accountStateOf, editedSave, PUBLIC_DIR, readSave } from './helpers';

const first = readSave(PUBLIC_DIR, 'first.json');
const stateOf = (edit: (data: Record<string, unknown>) => void) => accountStateOf(editedSave(first, edit));
const char0 = (edit: (data: Record<string, unknown>) => void) => {
  const state = stateOf(edit);
  const c = state.characters.find((ch) => ch.index === 0);
  if (!c) throw new Error('character 0 missing');
  return { state, c };
};
const NO_IDS = { monsters: [], maps: [], items: [], classes: [] };

describe('the unedited save', () => {
  it('is known everywhere', () => {
    const state = accountStateOf(first);
    expect(state.diagnostics.unknownFields).toEqual([]);
    expect(state.diagnostics.unknownIds).toEqual(NO_IDS);
    for (const field of Object.keys(FIELD_SOURCES)) {
      expect(isKnown(state, field.replace('[]', '[0]')), field).toBe(true);
    }
  });

  it('declares a source for every field with raw keys', () => {
    for (const field of Object.keys(FIELD_RAW_KEYS)) expect(FIELD_SOURCES).toHaveProperty([field]);
  });
});

describe('a deleted raw key reads as Unknown (RT-1)', () => {
  it.each([
    ['AFKtarget_0', ['characters[0].afkType', 'characters[0].afkTarget']],
    ['CurrentMap_0', ['characters[0].currentMap']],
    ['PTimeAway_0', ['characters[0].secondsSinceLastSave', 'lastPlayedCharacterIndex']],
    ['CSver', ['account.gameVersion.saveVersion']],
    ['OptLacc', ['account.currentWorld', 'account.finishedWorlds']],
    ['NPCdialogue_3', ['account.currentWorld', 'account.finishedWorlds']],
  ])('%s', (key, paths) => {
    const state = stateOf((d) => {
      delete d[key];
    });
    for (const path of paths) {
      expect(state.diagnostics.unknownFields).toContain(path);
      expect(isKnown(state, path), path).toBe(false);
    }
    // The rest of the account still reads.
    expect(state.characters.length).toBeGreaterThan(0);
    expect(isKnown(state, 'characters[1].level')).toBe(true);
  });

  it('EquipQTY_0: Toolbox itself gives up, which is a hard failure, not a default', () => {
    expect(() =>
      stateOf((d) => {
        delete d.EquipQTY_0;
      }),
    ).toThrow(EmptyAccountError);
  });

  it('nulls the value instead of a default', () => {
    const { c } = char0((d) => {
      delete d.AFKtarget_0;
      delete d.CurrentMap_0;
      delete d.PTimeAway_0;
    });
    expect(c.afkType).toBeNull();
    expect(c.afkTarget).toBeNull();
    expect(c.currentMap).toBeNull();
    expect(c.secondsSinceLastSave).toBeNull();
  });

  it('TimeAway: no cloud-save time, and no age from it', () => {
    const state = stateOf((d) => {
      delete d.TimeAway;
    });
    expect(state.account.lastCloudSave).toBeNull();
    expect(state.account.secondsSinceLastSave).toBeNull();
    expect(isKnown(state, 'account.lastCloudSave')).toBe(false);
    expect(state.lastPlayedCharacterIndex).toBeNull();
  });

  it('a raw value that no longer parses counts as missing', () => {
    const state = stateOf((d) => {
      d.TimeAway = '{oops';
    });
    expect(isKnown(state, 'account.lastCloudSave')).toBe(false);
    expect(state.account.lastCloudSave).toBeNull();
  });

  it('Lv0_0: Toolbox reads level 0, the adapter reads an unreadable character', () => {
    const state = stateOf((d) => {
      delete d.Lv0_0;
    });
    expect(state.characters.some((c) => c.index === 0)).toBe(false);
    expect(state.diagnostics.unreadableCharacters).toEqual([0]);
    expect(isKnown(state, 'characters[0].level')).toBe(false);
    expect(isKnown(state, 'characters[0].afkTarget')).toBe(false);
  });
});

describe('an id the parser pin does not know reads as Unknown, never as "nothing" (RT-2, FR-19a)', () => {
  it('monster: no AFK type or target, listed, not "no AFK target"', () => {
    const { state, c } = char0((d) => {
      d.AFKtarget_0 = 'Zz_patch_monster';
    });
    expect(c.afkType).toBeNull();
    expect(c.afkTarget).toBeNull();
    expect(state.diagnostics.unknownIds.monsters).toEqual(['Zz_patch_monster']);
    expect(isKnown(state, 'characters[0].afkType')).toBe(false);
    expect(isKnown(state, 'characters[0].afkTarget')).toBe(false);
  });

  it.each(['', '_'])('only an empty or "_" raw target means no AFK Target (%j)', (raw) => {
    const { state, c } = char0((d) => {
      d.AFKtarget_0 = raw;
    });
    expect(c.afkType).toBe('Nothing');
    expect(c.afkTarget).toBeNull();
    expect(isKnown(state, 'characters[0].afkType')).toBe(true);
    expect(state.diagnostics.unknownIds.monsters).toEqual([]);
  });

  it('map: null and listed', () => {
    const { state, c } = char0((d) => {
      d.CurrentMap_0 = 9999;
    });
    expect(c.currentMap).toBeNull();
    expect(state.diagnostics.unknownIds.maps).toEqual(['9999']);
    expect(isKnown(state, 'characters[0].currentMap')).toBe(false);
  });

  it('food: the stack is kept with item null, and listed', () => {
    const before = char0(() => {}).c.foodStacks;
    const { state, c } = char0((d) => {
      const order = d.EquipOrder_0 as Array<Record<string, string>>;
      order[2] = { ...order[2], 0: 'ZzPatchFood' };
    });
    expect(c.foodStacks).toHaveLength(before.length);
    expect(c.foodStacks[0]).toEqual({ item: null, amount: before[0]?.amount });
    expect(state.diagnostics.unknownIds.items).toEqual(['ZzPatchFood']);
    expect(isKnown(state, 'characters[0].foodStacks')).toBe(false);
  });
});

describe('one unreadable character never blanks the account (FR-19b)', () => {
  it('an unknown class makes that one character Unknown', () => {
    const full = accountStateOf(first);
    const state = stateOf((d) => {
      d.CharacterClass_2 = 999;
    });
    expect(state.diagnostics.unreadableCharacters).toEqual([2]);
    expect(state.diagnostics.unknownIds.classes).toEqual(['999']);
    expect(state.characters.map((c) => c.index)).toEqual(
      full.characters.map((c) => c.index).filter((i) => i !== 2),
    );
    expect(isKnown(state, 'characters[2].class')).toBe(false);
    expect(isKnown(state, 'characters[1].class')).toBe(true);
  });

  it('a save whose characters all lack data is still a hard failure', () => {
    expect(() =>
      stateOf((d) => {
        for (const k of Object.keys(d)) if (/^CharacterClass_/.test(k)) delete d[k];
      }),
    ).toThrow(EmptyAccountError);
  });
});

describe('failed parser sections', () => {
  it('a broken obols section leaves the rows and lists obols once (US-6)', () => {
    const state = stateOf((d) => {
      d.ObolEqO1 = 5;
    });
    expect(state.characters.length).toBe(accountStateOf(first).characters.length);
    expect(state.diagnostics.failedSections).toEqual(['obols']);
  });
});

describe('isKnown', () => {
  const state = accountStateOf(first);

  it('is false for a path that is not a declared field', () => {
    expect(isKnown(state, 'account.stamps')).toBe(false);
  });

  it('is false for a character slot that is not in the state', () => {
    expect(isKnown(state, 'characters[42].level')).toBe(false);
  });

  it('is false for a field whose side read errored', () => {
    expect(
      isKnown(
        { ...state, diagnostics: { ...state.diagnostics, failedSideReads: ['serverVars'] } },
        'account.gameVersion.serverBuild',
      ),
    ).toBe(false);
  });
});
