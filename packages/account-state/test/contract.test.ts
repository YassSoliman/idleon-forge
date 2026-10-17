// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Contract tests: the adapter must produce a valid Account State from every public Toolbox save at
// the current parser pin. After `pnpm sync-parsers`, a failure here means upstream changed a field we
// read; the snapshot diff shows what moved.
import { describe, expect, it } from 'vitest';
import type { AccountState } from '../src';
import { accountStateOf, listJson, NOW, PRIVATE_DIR, PUBLIC_DIR, readSave } from './helpers';

const publicSaves = listJson(PUBLIC_DIR);
const privateSaves = listJson(PRIVATE_DIR, '.raw.json');

function expectValid(state: AccountState) {
  expect(state.asOf).toBe(NOW);
  const { account, characters } = state;
  expect(account.currentWorld).toBeGreaterThanOrEqual(1);
  expect(account.currentWorld).toBeLessThanOrEqual(8);
  for (const w of account.finishedWorlds) expect(w).toBeLessThan(account.currentWorld ?? 0);
  expect(account.lastCloudSave).toBeGreaterThan(Date.UTC(2020, 0, 1));
  expect(account.secondsSinceLastSave).toBeGreaterThanOrEqual(0);
  expect(account.gameVersion.parserTarget).toMatch(/^\d+\.\d+\.\d+$/);

  expect(characters.length).toBeGreaterThan(0);
  const indices = characters.map((c) => c.index);
  expect(new Set(indices).size).toBe(indices.length);
  for (const c of characters) {
    expect(c.name.length).toBeGreaterThan(0);
    expect(c.class.length).toBeGreaterThan(0);
    expect(c.level).toBeGreaterThanOrEqual(1);
    expect(c.afkType.length).toBeGreaterThan(0);
    if (c.afkType === 'Nothing') expect(c.afkTarget).toBeNull();
    expect(c.currentMap).toEqual(expect.any(String));
    for (const f of c.foodStacks) {
      expect(f.item.length).toBeGreaterThan(0);
      expect(f.amount).toBeGreaterThan(0);
    }
    expect(c.secondsSinceLastSave).toBeGreaterThanOrEqual(0);
  }
}

describe.each(publicSaves)('public save %s', (file) => {
  const state = accountStateOf(readSave(PUBLIC_DIR, file));

  it('produces a valid Account State', () => {
    expectValid(state);
  });

  it('parses every parser section and finds every name', () => {
    // Skipped stub characters are expected in a few saves; anything else is a contract break.
    expect(state.warnings.filter((w) => !w.endsWith('has no save data and was skipped.'))).toEqual([]);
  });

  it('matches the recorded shape (review the diff after a re-sync)', () => {
    // Names are left out of the snapshot on purpose; the shape is what the contract is about.
    expect({
      account: state.account,
      characters: state.characters.map(({ name: _name, ...c }) => c),
      warnings: state.warnings,
    }).toMatchSnapshot();
  });
});

describe('across all public saves', () => {
  const states = publicSaves.map((f) => accountStateOf(readSave(PUBLIC_DIR, f)));
  const all = states.flatMap((s) => s.characters);

  it('has the 11 public saves', () => {
    expect(publicSaves).toHaveLength(11);
  });

  it('sees fighting and skilling AFK Targets, with targets and food', () => {
    const types = new Set(all.map((c) => c.afkType));
    expect(types.has('FIGHTING')).toBe(true);
    expect([...types].some((t) => t !== 'FIGHTING' && t !== 'Nothing')).toBe(true);
    expect(all.some((c) => c.afkTarget !== null)).toBe(true);
    expect(all.some((c) => c.foodStacks.length > 0)).toBe(true);
  });
});

describe.skipIf(privateSaves.length === 0)('private saves (local only)', () => {
  // Real accounts: assert on structure only, and never print names or values.
  it.each(privateSaves)('%s produces a valid Account State', (file) => {
    expectValid(accountStateOf(readSave(PRIVATE_DIR, file)));
  });
});
