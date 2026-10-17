// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CHARACTER_FRESH_MS,
  type AccountState,
  activeCharacterIndex,
  DAILY_RESET_PERIOD_MS,
  FIELD_SOURCES,
  isKnown,
  nextDailyReset,
  reportContext,
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

  it('is the save time plus the ShopRestock countdown, within the next 24 h', () => {
    expect(state.account.dailyResetAt).not.toBeNull();
    const ahead = (state.account.dailyResetAt ?? 0) - saved;
    expect(ahead).toBeGreaterThan(0);
    expect(ahead).toBeLessThanOrEqual(24 * 3600 * 1000);
    expect(isKnown(state, 'account.dailyResetAt')).toBe(true);
    expect(FIELD_SOURCES['account.dailyResetAt']).toContain('ShopRestock');
  });

  it('does not depend on when the save was parsed', () => {
    expect(accountStateOf(raw, saved + 9 * 3600_000).account.dailyResetAt).toBe(state.account.dailyResetAt);
  });

  it('gives the reset before it lands, then rolls forward in 24 h steps', () => {
    const at = state.account.dailyResetAt ?? 0;
    const day = DAILY_RESET_PERIOD_MS;
    expect(nextDailyReset(state, at - 1)).toBe(at);
    expect(nextDailyReset(state, at)).toBe(at + day);
    expect(nextDailyReset(state, at + day - 1)).toBe(at + day);
    expect(nextDailyReset(state, at + 3 * day + 5)).toBe(at + 4 * day);
  });

  it('is null only without a countdown', () => {
    const none = { ...state, account: { ...state.account, dailyResetAt: null } };
    expect(nextDailyReset(none, saved)).toBeNull();
  });

  it('reads as Unknown when the save has no TimeAway', () => {
    const s = accountStateOf(
      editedSave(raw, (d) => {
        delete d.TimeAway;
      }),
    );
    expect(s.account.dailyResetAt).toBeNull();
    expect(isKnown(s, 'account.dailyResetAt')).toBe(false);
  });

  it('every public save has one', () => {
    for (const f of listJson(PUBLIC_DIR)) {
      expect(accountStateOf(readSave(PUBLIC_DIR, f)).account.dailyResetAt).toEqual(expect.any(Number));
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

describe('reportContext (TR-22)', () => {
  const state = accountStateOf(raw);

  it('carries versions, failures and one character class and level, and nothing else', () => {
    const c = state.characters[0];
    const ctx = reportContext(state, c?.index ?? 0);
    expect(Object.keys(ctx).sort()).toEqual([
      'character',
      'failedSections',
      'failedSideReads',
      'gameVersion',
      'parserPin',
    ]);
    expect(ctx.character).toEqual({ class: c?.class, level: c?.level });
    expect(ctx.gameVersion.parserTarget).toBe(state.account.gameVersion.parserTarget);
  });

  it('never contains a character name', () => {
    const text = JSON.stringify(state.characters.map((c) => reportContext(state, c.index)));
    for (const c of state.characters) expect(text.includes(`"${c.name}"`)).toBe(false);
  });

  it('has no character when none is given or the slot is unknown', () => {
    expect(reportContext(state).character).toBeNull();
    expect(reportContext(state, 99).character).toBeNull();
  });
});
