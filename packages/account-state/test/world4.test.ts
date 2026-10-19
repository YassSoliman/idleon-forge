// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4 contract tests: `account.lab`, `account.cooking` and `account.breeding` on every public save
// (no crash, the shapes hold), the early-World-4 save `first.json` (the values the read-only pages show),
// a save with no World 4 record (null, not unknown) and a broken one (unknown). Never a name.
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, KITCHENS, LAB_CHIP_SLOTS, toAccountState } from '../src';
import { editedSave, listJson, NOW, PUBLIC_DIR, readSave } from './helpers';

const stateOf = (input: unknown, toolbox = true): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(
    parseSave(envelope, { now: NOW }),
    envelope,
    toolbox ? { toolbox: { calls: toolboxCalls, withFrozenClock } } : {},
  );
};

describe.each(listJson(PUBLIC_DIR))('%s', (file) => {
  const state = stateOf(readSave(PUBLIC_DIR, file));
  const { lab, cooking, breeding } = state.account;

  it('reads every World 4 field, none unknown', () => {
    expect(lab).not.toBeNull();
    expect(cooking).not.toBeNull();
    expect(breeding).not.toBeNull();
    expect(state.diagnostics.unknownFields.filter((f) => /lab|cooking|breeding/.test(f))).toEqual([]);
  });

  it('holds the shapes', () => {
    expect(cooking?.kitchens).toHaveLength(KITCHENS);
    expect(cooking?.kitchens[0]?.status).not.toBe('locked');
    for (const k of cooking?.kitchens ?? []) if (k.status !== 'cooking') expect(k.meal).toBeNull();
    expect(cooking?.mealMaxLevel).toBeGreaterThan(0);
    for (const c of lab?.characters ?? []) {
      expect(c.chips).toHaveLength(LAB_CHIP_SLOTS);
      if (c.connected) expect(c.uploaded).toBe(true);
    }
    const labIndexes = lab?.characters.map((c) => c.index) ?? [];
    for (const c of state.characters) expect(labIndexes).toContain(c.index);
    expect(breeding?.eggs).toBeLessThanOrEqual(breeding?.eggCapacity ?? 0);
    expect(breeding?.territories[0]?.name).toBe('Grasslands');
    expect(breeding?.upgrades[0]?.name.startsWith('Gene_Splicing')).toBe(true);
    expect(lab?.shop?.items.map((x) => x.kind)).toEqual(['chip', 'chip', 'jewel']);
  });
});

describe('first.json, an account early in World 4', () => {
  const state = stateOf(readSave(PUBLIC_DIR, 'first.json'));
  const { lab, cooking, breeding } = state.account;

  it('Cooking: 4 kitchens bought (one on a recipe, three on Pie), 5 spices found', () => {
    expect(cooking?.kitchens.map((k) => k.status)).toEqual([
      'recipe',
      'cooking',
      'cooking',
      'cooking',
      ...Array(6).fill('locked'),
    ]);
    expect(cooking?.kitchens.slice(1, 4).map((k) => k.meal)).toEqual(['Pie', 'Pie', 'Pie']);
    expect(cooking?.kitchens[0]).toMatchObject({ speedLv: 28, fireLv: 23, luckLv: 11 });
    expect(cooking?.spices.filter((s) => s.held !== null).map((s) => s.name)).toEqual([
      'Grasslands',
      'Jungle',
      'Encroaching Forest',
      'Tree Interior',
      'Stinky Sewers',
    ]);
    expect(cooking?.meals.find((m) => m.name === 'Turkey_of_Thank')?.level).toBe(4);
  });

  it('Breeding: 1 of 4 eggs, 5 territories foraging, best arena wave 7', () => {
    expect(breeding).toMatchObject({ eggs: 1, eggCapacity: 4, arenaBestWave: 7, level: 11 });
    expect(breeding?.territories.slice(0, 6).map((t) => t.status)).toEqual([
      'foraging',
      'foraging',
      'foraging',
      'foraging',
      'foraging',
      'not-won',
    ]);
  });

  it('Lab: 4 connected characters light 3 bonuses; the Repository is open, the Spinner not', () => {
    expect(lab?.characters.filter((c) => c.connected)).toHaveLength(4);
    expect(lab?.bonuses.filter((b) => b.lit).map((b) => b.name)).toEqual([
      'Wired_In',
      'Gilded_Cyclical_Tubing',
      'No_Bubble_Left_Behind',
    ]);
    expect(lab).toMatchObject({ repositoryOpen: true, spinnerOpen: false });
    expect(lab?.characters[2]?.chips[0]).toBe('Grounded_Motherboard');
  });

  it('the shop needs the worker call; without it the rest still reads', () => {
    const bare = stateOf(readSave(PUBLIC_DIR, 'first.json'), false);
    expect(bare.account.lab?.shop).toBeNull();
    expect(bare.account.lab?.bonuses.length).toBe(lab?.bonuses.length);
  });
});

describe('missing and broken records', () => {
  const raw = readSave(PUBLIC_DIR, 'first.json');

  it('a save with no World 4 record has null fields, not unknown ones', () => {
    const state = stateOf(
      editedSave(raw, (d) => {
        delete d.Lab;
        delete d.Cooking;
        delete d.Breeding;
      }),
    );
    expect(state.account.lab).toBeNull();
    expect(state.account.cooking).toBeNull();
    expect(state.account.breeding).toBeNull();
    expect(state.diagnostics.unknownFields.filter((f) => /lab|cooking|breeding/.test(f))).toEqual([]);
  });

  it('a Breeding record Toolbox can not read is unknown', () => {
    const state = stateOf(
      editedSave(raw, (d) => {
        d.Breeding = '{"not":"a list"}';
      }),
    );
    expect(state.account.breeding).toBeNull();
    expect(state.diagnostics.unknownFields).toContain('account.breeding');
  });
});
