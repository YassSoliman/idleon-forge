// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CHARACTER_FRESH_MS,
  type AccountState,
  accountReportFields,
  activeCharacterIndex,
  DAILY_RESET_PERIOD_MS,
  FIELD_SOURCES,
  isKnown,
  nextDailyReset,
} from '../src';
import { accountStateOf, editedSave, listJson, PRIVATE_DIR, PUBLIC_DIR, readSave } from './helpers';

const raw = readSave(PUBLIC_DIR, 'toolbox-raw.json');
const atSave = (input: unknown): AccountState => {
  const probe = accountStateOf(input);
  return accountStateOf(input, probe.account.lastCloudSave ?? 0);
};

describe('daily reset (for M10 Skip today)', () => {
  const state = atSave(raw);
  const saved = state.account.lastCloudSave ?? 0;

  it('is the ShopRestock countdown at the save, within the next 24 h', () => {
    const s = state.account.dailyResetInSeconds;
    expect(s).toEqual(expect.any(Number));
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThanOrEqual(24 * 3600);
    expect(isKnown(state, 'account.dailyResetInSeconds')).toBe(true);
    expect(FIELD_SOURCES['account.dailyResetInSeconds']).toContain('ShopRestock');
  });

  it('does not depend on when the save was parsed', () => {
    expect(accountStateOf(raw, saved + 9 * 3600_000).account.dailyResetInSeconds).toBe(
      state.account.dailyResetInSeconds,
    );
  });

  it('gives the reset before it lands, then rolls forward in 24 h steps', () => {
    const at = saved + Math.round((state.account.dailyResetInSeconds ?? 0) * 1000);
    const day = DAILY_RESET_PERIOD_MS;
    expect(nextDailyReset(state, at - 1)).toBe(at);
    expect(nextDailyReset(state, at)).toBe(at + day);
    expect(nextDailyReset(state, at + day - 1)).toBe(at + day);
    expect(nextDailyReset(state, at + 3 * day + 5)).toBe(at + 4 * day);
  });

  it('is null only without a countdown', () => {
    const none = { ...state, account: { ...state.account, dailyResetInSeconds: null } };
    expect(nextDailyReset(none, saved)).toBeNull();
  });

  it('reads as Unknown when the save has no TimeAway', () => {
    const s = accountStateOf(
      editedSave(raw, (d) => {
        delete d.TimeAway;
      }),
    );
    expect(s.account.dailyResetInSeconds).toBeNull();
    expect(isKnown(s, 'account.dailyResetInSeconds')).toBe(false);
  });

  it('every public save has one', () => {
    for (const f of listJson(PUBLIC_DIR)) {
      expect(accountStateOf(readSave(PUBLIC_DIR, f)).account.dailyResetInSeconds).toEqual(expect.any(Number));
    }
  });
});

describe('active character (US-5)', () => {
  const state = atSave(raw);
  const saved = state.account.lastCloudSave ?? 0;

  it('is the last-played character while the save is fresh', () => {
    expect(state.lastPlayedCharacterIndex).not.toBeNull();
    expect(activeCharacterIndex(state, saved + 30_000)).toBe(state.lastPlayedCharacterIndex);
  });

  it('is null once the save is 5 minutes old: the row is marked last played but not opened', () => {
    expect(activeCharacterIndex(state, saved + ACTIVE_CHARACTER_FRESH_MS)).toBeNull();
    expect(activeCharacterIndex(state, saved + 9 * 3600_000)).toBeNull();
  });

  it('is null on a tie', () => {
    expect(activeCharacterIndex({ ...state, lastPlayedCharacterIndex: null }, saved)).toBeNull();
  });

  const privateSaves = listJson(PRIVATE_DIR, '.raw.json');
  it.skipIf(!privateSaves.includes('yasser.raw.json'))(
    'yasser.raw.json parsed 9 h after its last save: slot 0 last played, not active',
    () => {
      const s = atSave(readSave(PRIVATE_DIR, 'yasser.raw.json'));
      const at = s.account.lastCloudSave ?? 0;
      expect(s.lastPlayedCharacterIndex === 0).toBe(true);
      expect(activeCharacterIndex(s, at + 9 * 3600_000) === null).toBe(true);
    },
  );
});

describe('accountReportFields (TR-22)', () => {
  const state = accountStateOf(raw);

  it('carries only the game build, the save age and one character class and level', () => {
    const c = state.characters[0];
    const saved = state.account.lastCloudSave ?? 0;
    const fields = accountReportFields(state, c?.index ?? 0, saved + 90_500);
    expect(Object.keys(fields).sort()).toEqual(['character', 'gameBuild', 'saveAgeSeconds']);
    expect(fields).toEqual({
      gameBuild: state.account.gameVersion.serverBuild,
      saveAgeSeconds: 90,
      character: { class: c?.class, level: c?.level },
    });
  });

  it('never contains a character name or a failed section', () => {
    const text = JSON.stringify(state.characters.map((c) => accountReportFields(state, c.index)));
    for (const c of state.characters) expect(text.includes(`"${c.name}"`)).toBe(false);
    expect(text.includes('failedSections')).toBe(false);
  });

  it('has no character when none is given or the slot is unknown', () => {
    expect(accountReportFields(state).character).toBeNull();
    expect(accountReportFields(state, 99).character).toBeNull();
  });
});
