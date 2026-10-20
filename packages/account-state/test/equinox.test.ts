// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-8: Equinox's real unlock (authored reader, not Toolbox's `equinox.unlocked`), on the raw saves.
import { normalizeEnvelope, parseSave } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { EQUINOX_MIRROR, equinoxUnlockedOf } from '../src';
import { accountStateOf, editedSave, NOW, PUBLIC_DIR, readSave } from './helpers';

const dataOf = (file: string) =>
  normalizeEnvelope(readSave(PUBLIC_DIR, file) as never).data as Record<string, unknown>;

describe('account.equinoxUnlocked (M26 FR-8)', () => {
  it("first.json: Toolbox says unlocked, but no Mirror and no Dream Upgrade level, so it isn't", () => {
    const env = normalizeEnvelope(readSave(PUBLIC_DIR, 'first.json') as never);
    const toolbox = (parseSave(env, { now: NOW }).account as { equinox?: { unlocked?: boolean } }).equinox;
    expect(toolbox?.unlocked).toBe(true);
    expect(accountStateOf(readSave(PUBLIC_DIR, 'first.json')).account.equinoxUnlocked).toBe(false);
  }, 30_000);

  it('fourth.json: no Mirror held, but Dream Upgrades have levels', () => {
    expect(equinoxUnlockedOf(dataOf('fourth.json'))).toBe(true);
  });

  it('the Mirror in the chest or a bag alone opens it', () => {
    const d = dataOf('first.json');
    expect(equinoxUnlockedOf(d)).toBe(false);
    expect(equinoxUnlockedOf({ ...d, ChestOrder: [EQUINOX_MIRROR] })).toBe(true);
    expect(equinoxUnlockedOf({ ...d, InventoryOrder_2: JSON.stringify(['Blank', EQUINOX_MIRROR]) })).toBe(
      true,
    );
  });

  it('no Dream key: false (no Equinox yet); an unreadable one: null, marked unknown', () => {
    const { Dream: _d, ...rest } = dataOf('first.json');
    expect(equinoxUnlockedOf(rest)).toBe(false);
    expect(equinoxUnlockedOf({ ...rest, Dream: '{not json' })).toBeNull();
    const s = accountStateOf(editedSave(readSave(PUBLIC_DIR, 'first.json'), (x) => (x.Dream = '{not json')));
    expect(s.account.equinoxUnlocked).toBeNull();
    expect(s.diagnostics.unknownFields).toContain('account.equinoxUnlocked');
  }, 30_000);
});
