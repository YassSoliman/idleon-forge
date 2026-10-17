// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Contract tests: the adapter must produce a valid Account State from every public Toolbox save at
// the current parser pin. After `pnpm sync-parsers`, a failure here means upstream changed a field we
// read; the snapshot diff shows what moved.
import { describe, expect, it } from 'vitest';
import { type AccountState, SCHEMA_VERSION } from '../src';
import { accountStateOf, listJson, NOW, PRIVATE_DIR, PUBLIC_DIR, readSave } from './helpers';

const publicSaves = listJson(PUBLIC_DIR);
const privateSaves = listJson(PRIVATE_DIR, '.raw.json');

function expectValid(state: AccountState) {
  expect(state.schemaVersion).toBe(SCHEMA_VERSION);
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
    expect(c.afkType?.length).toBeGreaterThan(0);
    if (c.afkType === 'Nothing') expect(c.afkTarget).toBeNull();
    expect(c.currentMap).toEqual(expect.any(String));
    for (const f of c.foodStacks) {
      expect(f.item?.length).toBeGreaterThan(0);
      expect(f.amount).toBeGreaterThan(0);
    }
    expect(c.secondsSinceLastSave).toBeGreaterThanOrEqual(0);
  }
  if (state.lastPlayedCharacterIndex !== null) expect(indices).toContain(state.lastPlayedCharacterIndex);

  // A clean save at this pin: every field passed its presence check and every id is known.
  const d = state.diagnostics;
  expect(d.failedSections).toEqual([]);
  expect(d.unreadableCharacters).toEqual([]);
  expect(d.unknownFields).toEqual([]);
  expect(d.unknownIds).toEqual({ monsters: [], maps: [], items: [], classes: [] });
  expect(d.parserPin.gameVersion).toBe(account.gameVersion.parserTarget);
}

/** No warnings other than skipped stub characters: anything else is a contract break. */
const unexpectedWarnings = (state: AccountState) =>
  state.warnings.filter((w) => !w.endsWith('has no save data and was skipped.'));

/** What the shape snapshot records: everything but names (and the pin's commit, which re-syncs move). */
const shapeOf = (state: AccountState) => ({
  account: state.account,
  characters: state.characters.map(({ name: _name, ...c }) => c),
  lastPlayedCharacterIndex: state.lastPlayedCharacterIndex,
  diagnostics: { ...state.diagnostics, parserPin: { gameVersion: state.diagnostics.parserPin.gameVersion } },
  warnings: state.warnings,
});

describe.each(publicSaves)('public save %s', (file) => {
  const state = accountStateOf(readSave(PUBLIC_DIR, file));

  it('produces a valid Account State', () => {
    expectValid(state);
  });

  it('parses every parser section and finds every name', () => {
    expect(unexpectedWarnings(state)).toEqual([]);
  });

  it('matches the recorded shape (review the diff after a re-sync)', () => {
    // Names are left out of the snapshot on purpose; the shape is what the contract is about.
    expect(shapeOf(state)).toMatchSnapshot();
  });
});

describe('across all public saves', () => {
  const states = publicSaves.map((f) => accountStateOf(readSave(PUBLIC_DIR, f)));
  const all = states.flatMap((s) => s.characters);

  it('reads the daily reset countdown from every public save', () => {
    for (const s of states) expect(s.account.dailyResetInSeconds).toEqual(expect.any(Number));
  });

  it('reads the total account level as the sum of every class level (issue #60)', () => {
    for (const s of states) {
      expect(s.account.accountLevel).toEqual(expect.any(Number));
      // Readable characters are a lower bound: Toolbox also counts any it could read and we couldn't.
      const sum = s.characters.reduce((n, c) => n + c.level, 0);
      expect(s.account.accountLevel).toBeGreaterThanOrEqual(sum);
    }
  });

  it('keeps every Account State under the 200 KB history cap (TR-16)', () => {
    const largest = Math.max(...states.map((s) => new TextEncoder().encode(JSON.stringify(s)).length));
    expect(largest).toBeLessThan(200 * 1024);
  });

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
  // Real accounts: assert without printing names or values (no toEqual on the state itself).
  const stateOf = (file: string) => accountStateOf(readSave(PRIVATE_DIR, file));

  it.each(privateSaves)('%s produces a valid Account State', (file) => {
    expectValid(stateOf(file));
  });

  it.each(privateSaves)('%s parses every parser section and finds every name', (file) => {
    expect(unexpectedWarnings(stateOf(file)).length).toBe(0);
  });

  it.each(privateSaves)('%s matches its local shape snapshot', async (file) => {
    // Kept beside the saves in the gitignored fixtures/private/, never committed.
    await expect(`${JSON.stringify(shapeOf(stateOf(file)), null, 2)}\n`).toMatchFileSnapshot(
      `${PRIVATE_DIR}__shape__/${file.replace(/\.raw\.json$/, '.shape.json')}`,
    );
  });

  // US-5 and TR-12: checked by hand on both real saves.
  const LAST_PLAYED: Record<string, number> = { 'yasser.raw.json': 0, 'joseph.raw.json': 5 };
  it.each(privateSaves.filter((f) => f in LAST_PLAYED))(
    '%s marks the right last-played character',
    (file) => {
      expect(stateOf(file).lastPlayedCharacterIndex === LAST_PLAYED[file]).toBe(true);
    },
  );
});
