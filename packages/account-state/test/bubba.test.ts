// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 TR-2, TR-10: `account.bubba` from Toolbox's Bubba parse, the raw record and ADR 0010's derived values.
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import { type AccountState, BUBBA_BOON_AHEAD, charismaLevelsFrom, toAccountState } from '../src';
import { editedSave, listJson, NOW, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED = new URL('../../../fixtures/scrubbed/', import.meta.url).pathname;

const withCalls = (input: unknown): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(parseSave(envelope, { now: NOW }), envelope, {
    toolbox: { calls: toolboxCalls, withFrozenClock },
  });
};

describe('account.bubba', () => {
  it('is null, and not unknown, on the saves from before Bubba (first to fourth)', () => {
    for (const f of ['first.json', 'second.json', 'third.json', 'fourth.json']) {
      const s = withCalls(readSave(PUBLIC_DIR, f));
      expect(s.account.bubba).toBeNull();
      expect(s.diagnostics.unknownFields).not.toContain('account.bubba');
    }
  });

  it('is filled on every other public save', () => {
    const others = listJson(PUBLIC_DIR).filter((f) => !/^(first|second|third|fourth)\.json$/.test(f));
    for (const f of others) expect(withCalls(readSave(PUBLIC_DIR, f)).account.bubba, f).not.toBeNull();
  }, 60_000);

  it('reads latest.json: Toolbox numbers, raw indices and the X1 values', () => {
    const b = withCalls(readSave(PUBLIC_DIR, 'latest.json')).account.bubba;
    expect(b).not.toBeNull();
    if (!b) return;
    expect(b.levels).toHaveLength(28);
    expect(b.prestige).toHaveLength(28);
    expect(b.costs).toHaveLength(28);
    expect(b.megaflesh).toBe(12);
    expect(b.levels[3]).toBe(146);
    expect(b.types).toBe(23);
    expect(b.bonuses).toEqual([420, 210, 210, 630, 42, 168, 120]);
    expect(b.smoker).toEqual({ unlocked: true, seconds: expect.closeTo(341380.135, 2) });
    expect(b.gifts).toEqual([5, 6]);
    expect(b.pats).toEqual({ used: -10, timer: expect.closeTo(83225.97, 1), perHour: 11 });
    expect(b.charisma.levels).toEqual([120, 0, 0, 0, 62, 17]);
    expect(b.charisma.selected).toBe(1);
    expect(b.charisma.emulsified).toBe(1);
    expect(b.charisma.maxLevel).toBe(120);
    expect(b.charisma.levelsBanked).toBe(155);
    expect(b.megafleshMultiplier).toBe(2);
    expect(b.boonNextDelta).toBe(6);
    expect(b.rateBase).toBe(b.ratePerMin);
  });

  it('reads the W3-early account (scrubbed-w3): Hustle maxed and training, Megaflesh 3, Boon 11', () => {
    const b = withCalls(readSave(SCRUBBED, 'scrubbed-w3.json')).account.bubba;
    expect(b?.megaflesh).toBe(3);
    expect(b?.levels[3]).toBe(11);
    expect(b?.charisma.levels[0]).toBe(120);
    expect(b?.charisma.selected).toBe(1);
    expect(b?.megafleshMultiplier).toBe(1.2);
    expect(b?.costs[8]).toBeCloseTo(245074812968.87, 0);
  });

  it('carries the next Boon and Fun Gifts prices from Toolbox, rising, and Fun Gifts only to its cap', () => {
    const w3 = withCalls(readSave(SCRUBBED, 'scrubbed-w3.json')).account.bubba;
    const ahead = w3?.ahead;
    expect(ahead?.boonCosts).toHaveLength(BUBBA_BOON_AHEAD);
    expect(ahead?.boonCosts[0]).toBe(w3?.costs[3]);
    const boon = (ahead?.boonCosts ?? []) as number[];
    for (let k = 1; k < boon.length; k++) expect(boon[k]).toBeGreaterThan((boon[k - 1] ?? 0) * 5);
    // Fun Gifts 2 of 6: four more levels.
    expect(ahead?.funGiftsCosts).toHaveLength(4);
    expect(withCalls(readSave(PUBLIC_DIR, 'latest.json')).account.bubba?.ahead?.funGiftsCosts).toEqual([]);
  });

  it('banks the same levels from the folded XP as X1 does at the save', () => {
    for (const s of [
      withCalls(readSave(SCRUBBED, 'scrubbed-w3.json')),
      withCalls(readSave(PUBLIC_DIR, 'latest.json')),
    ]) {
      const c = s.account.bubba?.charisma;
      const total = (c?.levels ?? []).reduce((a, b) => a + b, 0);
      expect(charismaLevelsFrom(total, c?.xpFolded ?? 0)).toBe(c?.levelsBanked);
    }
  });

  it('has no X1 values without the worker Toolbox calls (they hide, M23 TR-6)', () => {
    const envelope = normalizeEnvelope(readSave(PUBLIC_DIR, 'latest.json'));
    const b = toAccountState(parseSave(envelope, { now: NOW }), envelope).account.bubba;
    expect(b?.rateBase).toBeNull();
    expect(b?.charisma.levelsBanked).toBeNull();
    expect(b?.boonNextDelta).toBeNull();
    expect(b?.ahead).toBeNull();
  });

  it('is unknown when the record is unreadable', () => {
    const save = editedSave(readSave(PUBLIC_DIR, 'latest.json'), (d) => {
      d.Bubba = 'not json';
    });
    const s = withCalls(save);
    expect(s.account.bubba).toBeNull();
    expect(s.diagnostics.unknownFields).toContain('account.bubba');
  });

  it('adds about 1.5 KB per save (TR-2)', () => {
    const b = withCalls(readSave(PUBLIC_DIR, 'highend.json')).account.bubba;
    expect(new TextEncoder().encode(JSON.stringify(b)).length).toBeLessThan(2048);
  });
});
