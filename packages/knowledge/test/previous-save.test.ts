// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-7: a previous-save Detector compares declared sub-fields; only those decide "no previous save".
import type { AccountState } from '@idleon-forge/account-state';
import { describe, expect, it } from 'vitest';
import { previousSave, valueAt } from '../src/helpers';
import type { HistoryEntry } from '../src/types';

const entry = (schemaVersion: number, account: Record<string, unknown>, at = 1): HistoryEntry => ({
  lastCloudSave: at,
  receivedAt: at,
  state: { schemaVersion, account } as unknown as AccountState,
});
const killroy = [{ path: 'account.killroy.doneCode', valid: (v: unknown) => typeof v === 'number' }];

describe('previousSave (M26 FR-7)', () => {
  it('a different schemaVersion alone does not drop the previous save', () => {
    const h = [entry(24, { killroy: { doneCode: 3 } })];
    expect(previousSave(h, killroy)).toBe(h[0]);
  });

  it('a missing or reshaped compared sub-field reads as no previous save; other fields do not matter', () => {
    expect(previousSave([entry(25, { lab: {} })], killroy)).toBeNull();
    expect(previousSave([entry(25, { killroy: { doneCode: '3' } })], killroy)).toBeNull();
    expect(previousSave([entry(25, { killroy: { doneCode: 0 }, lab: null })], killroy)).not.toBeNull();
  });

  it('reads only the newest earlier save, and none on the first save', () => {
    const h = [entry(25, { killroy: { doneCode: 1 } }, 1), entry(25, {}, 2)];
    expect(previousSave(h, killroy)).toBeNull();
    expect(previousSave([], killroy)).toBeNull();
  });

  it('valueAt walks dot paths and stops at non-objects', () => {
    expect(valueAt({ a: { b: 2 } }, 'a.b')).toBe(2);
    expect(valueAt({ a: 1 }, 'a.b')).toBeUndefined();
  });
});
