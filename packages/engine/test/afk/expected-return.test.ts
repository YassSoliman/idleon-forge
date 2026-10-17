// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 US-3, FR-1, FR-3: which Expected Return the engine uses. The learned value itself (FR-2, D5,
// RT-6) is M1's `learnedExpectedReturn` and is tested in @idleon-forge/sync.
import { describe, expect, it } from 'vitest';
import { DEFAULT_EXPECTED_RETURN_MS, HOUR_MS, resolveExpectedReturn } from '../../src/afk';

const SESSION = Date.UTC(2026, 9, 17, 20);

describe('resolveExpectedReturn', () => {
  it('defaults to 8 h with no history and no choice', () => {
    expect(resolveExpectedReturn({ choice: null, learnedMs: null, currentSessionStart: SESSION })).toEqual({
      usedMs: 28_800_000,
      learnedMs: null,
      source: 'default',
    });
    expect(DEFAULT_EXPECTED_RETURN_MS).toBe(8 * HOUR_MS);
  });

  it('uses the learned value until the player picks a chip', () => {
    expect(
      resolveExpectedReturn({ choice: null, learnedMs: 9 * HOUR_MS, currentSessionStart: SESSION }),
    ).toEqual({
      usedMs: 9 * HOUR_MS,
      learnedMs: 9 * HOUR_MS,
      source: 'learned',
    });
  });

  it('keeps a 2 h choice for the rest of its Play Session (a save 20 min later)', () => {
    const choice = { seconds: 7200, chosenAt: SESSION + 10 * 60_000 };
    expect(resolveExpectedReturn({ choice, learnedMs: 9 * HOUR_MS, currentSessionStart: SESSION })).toEqual({
      usedMs: 2 * HOUR_MS,
      learnedMs: 9 * HOUR_MS,
      source: 'player',
    });
  });

  it('drops the choice once a new Play Session starts (after a 3 h gap)', () => {
    const choice = { seconds: 7200, chosenAt: SESSION + 10 * 60_000 };
    const next = SESSION + 3 * HOUR_MS;
    expect(resolveExpectedReturn({ choice, learnedMs: 9 * HOUR_MS, currentSessionStart: next }).source).toBe(
      'learned',
    );
    expect(resolveExpectedReturn({ choice, learnedMs: null, currentSessionStart: next }).source).toBe(
      'default',
    );
  });

  it('ignores a broken choice or learned value', () => {
    const r = resolveExpectedReturn({
      choice: { seconds: Number.NaN, chosenAt: SESSION },
      learnedMs: -1,
      currentSessionStart: SESSION,
    });
    expect(r).toEqual({ usedMs: DEFAULT_EXPECTED_RETURN_MS, learnedMs: null, source: 'default' });
  });
});
