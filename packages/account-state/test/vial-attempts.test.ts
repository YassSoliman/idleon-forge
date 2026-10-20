// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Real saves can hold a negative remaining vial-attempt count (`CauldronP2W[5][0]`, seen -3 of 18);
// Toolbox passes it through raw, so the adapter clamps it to 0..max.
import { describe, expect, it } from 'vitest';
import { accountStateOf, editedSave, PUBLIC_DIR, readSave } from './helpers';

const first = readSave(PUBLIC_DIR, 'first.json');
const attemptsWith = (remaining: number) => {
  const save = editedSave(first, (d) => {
    const p2w =
      typeof d.CauldronP2W === 'string' ? JSON.parse(d.CauldronP2W) : structuredClone(d.CauldronP2W);
    p2w[5][0] = remaining;
    d.CauldronP2W = typeof d.CauldronP2W === 'string' ? JSON.stringify(p2w) : p2w;
  });
  return accountStateOf(save).account.alchemy?.vialAttempts;
};

describe('vial attempts', () => {
  it('reads the remaining count as saved', () => {
    expect(attemptsWith(7)).toEqual({ current: 7, max: 13 });
  });
  it('reads a negative remaining count as none left', () => {
    expect(attemptsWith(-3)).toEqual({ current: 0, max: 13 });
  });
  it('never reads more than the daily max', () => {
    expect(attemptsWith(40)).toEqual({ current: 13, max: 13 });
  });
});
