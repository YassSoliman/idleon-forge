// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C contract tests (section 11): `characters[].anvil` on every public save. The hammers are the raw
// `AnvilPAselect_i` list in save order (V33: Toolbox sorts its copy in place), -1 a free hammer; a bare
// number reads as one hammer; the stock of a product with hammers equals M3's `afk.anvil[].amount`
// (V-C1); the speed terms reproduce Toolbox's `anvilSpeed`. Never a name.
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, ANVIL_PRODUCTS, hammersOf, stockOf, toAccountState } from '../src';
import { editedSave, listJson, NOW, PUBLIC_DIR, readSave } from './helpers';

const stateOf = (input: unknown): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(parseSave(envelope, { now: NOW }), envelope, {
    toolbox: { calls: toolboxCalls, withFrozenClock },
  });
};

describe('hammersOf (V33)', () => {
  it('reads a list, its JSON string and a bare number', () => {
    expect(hammersOf([2, 4, 3])).toEqual([2, 4, 3]);
    expect(hammersOf('[0,4,-1]')).toEqual([0, 4, -1]);
    expect(hammersOf(3)).toEqual([3]);
    expect(hammersOf('5')).toEqual([5]);
  });
  it('rejects what is not a hammer list', () => {
    expect(hammersOf(undefined)).toBeNull();
    expect(hammersOf([])).toBeNull();
    expect(hammersOf([1, 'x'])).toBeNull();
    expect(hammersOf([11])).toBeNull();
    expect(hammersOf(-2)).toBeNull();
  });
  it('keeps save order (never sorted)', () => {
    expect(hammersOf([6, 3, 5])).toEqual([6, 3, 5]);
  });
});

describe('stockOf (V-C1)', () => {
  it('takes currentAmount of products 0-10', () => {
    const rows = Array.from({ length: 14 }, (_, p) => [p * 10, 0, 0, 0]);
    expect(stockOf(rows)).toEqual(Array.from({ length: ANVIL_PRODUCTS }, (_, p) => p * 10));
    expect(stockOf(rows.slice(0, 5))).toBeNull();
  });
});

describe.each(listJson(PUBLIC_DIR))('%s', (file) => {
  const state = stateOf(readSave(PUBLIC_DIR, file));

  it('reads every anvil, hammers in save order', () => {
    for (const c of state.characters) {
      const a = c.anvil;
      expect(a, `c${c.index}`).toBeTruthy();
      if (!a) continue;
      expect(a.hammers.length).toBeGreaterThanOrEqual(1);
      expect(a.hammers.length).toBeLessThanOrEqual(4);
      for (const h of a.hammers) expect(h).toBeGreaterThanOrEqual(-1);
      expect(a.stock).toHaveLength(ANVIL_PRODUCTS);
      expect(a.capacity).toBeGreaterThan(0);
    }
  });

  it("V-C1: the stock of a hammered product is M3's amount", () => {
    for (const c of state.characters) {
      for (const p of c.afk?.anvil ?? []) {
        const idx = c.anvil?.hammers.find((h) => h >= 0 && p.hammers > 0 && c.anvil?.stock[h] === p.amount);
        expect(idx, `c${c.index} ${p.item}`).not.toBeUndefined();
      }
    }
  });

  it('the speed terms reproduce Toolbox anvilSpeed', () => {
    for (const c of state.characters) {
      const parts = c.anvil?.speedParts;
      if (!parts || c.anvilSpeed == null) continue;
      expect(toolboxCalls.anvilSpeedOf(parts)).toBeCloseTo(c.anvilSpeed, 3);
      expect(c.anvil?.speedStampNext ?? 0).toBeGreaterThan(c.anvilSpeed);
    }
  });
});

describe('null field (US-C-S3)', () => {
  it('a missing AnvilPAselect_i makes that anvil unknown, the others stay', () => {
    const save = editedSave(readSave(PUBLIC_DIR, 'first.json'), (d) => {
      delete d.AnvilPAselect_2;
    });
    const state = stateOf(save);
    expect(state.characters.find((c) => c.index === 2)?.anvil).toBeNull();
    expect(state.diagnostics.unknownFields).toContain('characters[2].anvil');
    expect(state.characters.filter((c) => c.anvil).length).toBe(state.characters.length - 1);
  });
  it('a bare-number select reads as one hammer', () => {
    const save = editedSave(readSave(PUBLIC_DIR, 'first.json'), (d) => {
      d.AnvilPAselect_0 = 3;
    });
    expect(stateOf(save).characters.find((c) => c.index === 0)?.anvil?.hammers).toEqual([3]);
  });
});
