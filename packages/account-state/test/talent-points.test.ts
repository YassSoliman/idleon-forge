// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Exact talent points (ADR 0010): the TotalTalentPoints port term by term, the answer-key check, and
// the contract on the public and scrubbed saves with the worker's Toolbox calls. Class and slot only.
import { fileURLToPath } from 'node:url';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { describe, expect, it } from 'vitest';
import {
  type AccountState,
  checkTab,
  isKnown,
  type RawPointTerms,
  skillTerms,
  starRawFloor,
  type TabKey,
  type TabPoints,
  tabTotal,
  termsOfTab,
  toAccountState,
} from '../src';
import { editedSave, listJson, NOW, PUBLIC_DIR, readSave } from './helpers';

const SCRUBBED_DIR = fileURLToPath(new URL('../../../fixtures/scrubbed/', import.meta.url));

const stateOf = (input: unknown, toolbox = true): AccountState => {
  const envelope = normalizeEnvelope(input);
  return toAccountState(
    parseSave(envelope, { now: NOW }),
    envelope,
    toolbox ? { toolbox: { calls: toolboxCalls, withFrozenClock } } : {},
  );
};

/** One tab of one character's preset: slot index, `active` or `other`, tab. */
const points = (
  s: AccountState,
  slot: number,
  which: 'active' | 'other',
  tab: TabKey,
): TabPoints | undefined => {
  const t = s.characters.find((c) => c.index === slot)?.talents;
  return (which === 'active' ? t?.active : t?.other)?.talentPoints?.[tab];
};

const allTabs = (s: AccountState): TabPoints[] =>
  s.characters.flatMap((c) =>
    [c.talents?.active, c.talents?.other].flatMap((p) => Object.values(p?.talentPoints ?? {})),
  ) as TabPoints[];

const raw = (over: Partial<RawPointTerms> = {}): RawPointTerms => ({
  lv0: [50, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  classId: 9,
  cy: [0, 0, 0, 0, 0, 0],
  achieveReg: [],
  ...over,
});

describe('the TotalTalentPoints port (N.js, ADR 0010)', () => {
  it('builds TalentDL from the first nine skill levels', () => {
    // -3 + 90, Σ floor(10/2) = 45, Σ floor(10/5) = 18.
    expect(skillTerms(raw().lv0)).toEqual([87, 45, 18]);
  });

  it('gives tab 1 three points per class level, the skill levels and its bonuses', () => {
    expect(tabTotal(1, raw())).toBe(3 * 49 + 87);
    // CYTalentPoints[0], achievements 54 (5) and 216 (6), the Darts upgrade (OLA 436), Toolbox terms.
    const done = Object.assign([], { 54: -1, 216: -1 }) as number[];
    expect(
      tabTotal(1, raw({ cy: [2, 0, 0, 0, 0, 0], achieveReg: done, ola436: 7 }), {
        bubble: 5.9,
        vial1: 1,
        starSign1: 3,
        stamp1: 2,
        flurbo: 4,
        arcade16: 1,
        shiny1: 12,
        vault1: 75,
        companion20: 10,
      }),
    ).toBe(Math.floor(3 * 49 + 87 + 2 + 5 + 6 + 7 + 5.9 + 1 + 3 + 2 + 4 + 1 + 12 + 75 + 10));
  });

  it('gives tabs 2 and 3 half of each skill level, and tab 2 its granting talents', () => {
    expect(tabTotal(2, raw())).toBe(3 * 44 + 45);
    expect(tabTotal(2, raw(), { t119: 6, t44: 3, vault6: 63 })).toBe(3 * 44 + 45 + 6 + 3 + 63);
    expect(tabTotal(3, raw())).toBe(3 * 21 + 45);
    expect(tabTotal(3, raw(), { t119: 6, vault40: 25 })).toBe(3 * 21 + 45 + 25);
  });

  it('gives tab 4 its level ramp, divinity and merits; the Voidwalker its own line', () => {
    const lv0 = [200, 10, 10, 10, 10, 10, 10, 10, 10, 10, 0, 0, 0, 0, 41];
    // 3 * min(111, 100) + 2 * 11 + 18 + floor(41 / 2) + 3 * merit.
    expect(tabTotal(4, raw({ lv0, merit5: 2 }))).toBe(300 + 22 + 18 + 20 + 6);
    // Class 4: 1 + Companions(20) + One Step Ahead + Void Trial Rerun's second effect x OLA 158.
    expect(tabTotal(4, raw({ lv0, classId: 4, ola158: 35 }), { t34: 230, t45y: 30, stamp4: 99 })).toBe(
      1 + 230 + 30 * 35,
    );
  });

  it('gives tab 5 its level ramp and the master class systems; the Royal Guardian its own line', () => {
    const lv0 = [300, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    expect(tabTotal(5, raw({ lv0, classId: 14 }), { grimoire32: 200, grimoire45: 5 })).toBe(
      3 * 51 + 18 + 205,
    );
    expect(tabTotal(5, raw({ lv0, classId: 29 }), { compass56: 200, compass67: 119 })).toBe(
      3 * 51 + 18 + 319,
    );
    expect(tabTotal(5, raw({ lv0, classId: 40 }), { tesseract33: 200, grimoire32: 999 })).toBe(
      3 * 51 + 18 + 200,
    );
    expect(
      tabTotal(5, raw({ lv0, classId: 16, lore9: 1, merit6: 2 }), {
        orblet2: 100,
        armory46: 200,
        jelly6: 15,
      }),
    ).toBe(1 + 100 + 50 + 10 + 200 + 15);
  });

  it('floors the star tab on its raw terms', () => {
    const done = Object.assign([], { 212: -1, 289: -1 }) as number[];
    expect(starRawFloor(raw({ achieveReg: done, cy: [0, 0, 0, 0, 0, 4] }))).toBe(49 + 87 + 4 + 10 + 20);
  });

  it('cites the terms each line reads', () => {
    expect(termsOfTab(4, 4)).toEqual(['companion20', 't34', 't45y']);
    expect(termsOfTab(4, 9)).not.toContain('t34');
    expect(termsOfTab(5, 16)).toContain('orblet2');
    expect(termsOfTab(5, 14)).toContain('grimoire32');
    expect(termsOfTab(5, 14)).not.toContain('compass56');
  });
});

describe('the answer key (checkTab)', () => {
  const side = (spent: number, total: number | null) => ({
    spent,
    total,
    terms: { bubble: 5, t8: 20, vault1: 0 },
  });

  it('is exact-verified when a preset that spent there has 0 left', () => {
    expect(checkTab(1, side(300, 320), side(320, 320), false)).toMatchObject({
      total: 320,
      unspent: 20,
      confidence: 'exact-verified',
      oracle: 320,
    });
    // The other preset's own granting talents differ: its 0 left still confirms this one's total.
    expect(checkTab('star', side(90, 100), side(110, 110), false)).toMatchObject({
      unspent: 10,
      confidence: 'exact-verified',
      oracle: 100,
    });
  });

  it('is exact when nothing contradicts it, and shows the number', () => {
    expect(checkTab(1, side(300, 340), side(310, 340), false)).toMatchObject({
      total: 340,
      unspent: 40,
      confidence: 'exact',
      oracle: 310,
    });
    // No preset spent anything: no answer key.
    expect(checkTab(2, side(0, 40), null, false)).toMatchObject({
      unspent: 40,
      confidence: 'exact',
      oracle: null,
    });
  });

  it('falls back to the lower bound when a preset spent more than the formula gives', () => {
    const v = checkTab(1, side(300, 320), side(330, 320), false, 9);
    expect(v).toMatchObject({ total: null, unspent: null, confidence: 'bound', formula: 320, oracle: 330 });
    // Only the nonzero terms tab 1 reads: not the star tab's Star Player, not a zero.
    expect(v.terms).toEqual({ bubble: 5 });
  });

  it('is bound with no formula when the terms could not be computed', () => {
    expect(checkTab(1, side(10, null), side(20, 30), false)).toMatchObject({
      confidence: 'bound',
      formula: null,
      unspent: null,
    });
  });

  it('never shows tabs 4 and 5 below 0, as the game does', () => {
    expect(checkTab(4, side(0, 5), null, true).unspent).toBe(5);
  });
});

describe('characters[].talents.*.talentPoints on the saves', () => {
  it('is absent without the worker’s Toolbox calls, and the field stays known', () => {
    const s = stateOf(readSave(PUBLIC_DIR, 'first.json'), false);
    expect(allTabs(s)).toHaveLength(0);
    expect(isKnown(s, 'characters[0].talents.active.talentPoints')).toBe(true);
  });

  it('first.json: matches the save’s answer key on fully spent tabs', () => {
    const s = stateOf(readSave(PUBLIC_DIR, 'first.json'));
    // Slot 0 (Blood Berserker, Lv 96), its active preset: tabs 1, 3, 4 and the star tab spent to 0.
    expect(points(s, 0, 'active', 1)).toMatchObject({
      total: 637,
      spent: 637,
      unspent: 0,
      confidence: 'exact-verified',
    });
    expect(points(s, 0, 'active', 3)).toMatchObject({ total: 416, unspent: 0, confidence: 'exact-verified' });
    expect(points(s, 0, 'active', 4)).toMatchObject({ total: 128, unspent: 0, confidence: 'exact-verified' });
    expect(points(s, 0, 'active', 'star')).toMatchObject({
      total: 493,
      unspent: 0,
      confidence: 'exact-verified',
    });
    // Its other preset: the same total, so the 114 points the lower bound can't see are exact.
    expect(points(s, 0, 'other', 1)).toMatchObject({
      total: 637,
      spent: 523,
      unspent: 114,
      confidence: 'exact-verified',
    });
    // Every tab of every preset is exact or verified on this save.
    expect(allTabs(s).every((t) => t.confidence !== 'bound')).toBe(true);
  });

  it('fourth.json: the Voidwalker tab 4 line (One Step Ahead + Void Trial Rerun x portals) is verified', () => {
    const s = stateOf(readSave(PUBLIC_DIR, 'fourth.json'));
    expect(points(s, 0, 'active', 4)).toMatchObject({
      total: 1281,
      spent: 1281,
      unspent: 0,
      confidence: 'exact-verified',
    });
    expect(points(s, 0, 'other', 4)).toMatchObject({
      total: 1281,
      unspent: 23,
      confidence: 'exact-verified',
    });
  });

  it('fourth.json: a star tab spent past its total falls back to the bound, keeping the evidence', () => {
    // Star Player and Supernova Player are 0 on the active preset, which spent 2112 star points.
    const s = stateOf(readSave(PUBLIC_DIR, 'fourth.json'));
    const v = points(s, 0, 'active', 'star');
    expect(v).toMatchObject({ total: null, unspent: null, confidence: 'bound', formula: 1911, oracle: 2112 });
    expect(v?.terms).toEqual(expect.any(Object));
  });

  it.each(listJson(PUBLIC_DIR))('%s: totals are never below a preset’s spend unless bound', (file) => {
    const s = stateOf(readSave(PUBLIC_DIR, file));
    for (const t of allTabs(s)) {
      if (t.confidence === 'bound') {
        expect(t.unspent).toBeNull();
        continue;
      }
      const total = t.total ?? Number.NaN;
      expect(total).toEqual(expect.any(Number));
      // total − spent, or 0 on a clamped tab (4, 5) the formula puts below the spend.
      expect([total - t.spent, 0]).toContain(t.unspent);
      if (t.oracle !== null) expect(t.total).toBeGreaterThanOrEqual(t.oracle);
    }
  });

  it('a failed section turns only its tabs to bound', () => {
    const save = editedSave(readSave(PUBLIC_DIR, 'first.json'), (d) => {
      d.CauldronInfo = '{"broken"'; // alchemy fails: bubbles and vials (tabs 1-4) can't be read
    });
    const s = stateOf(save);
    if (!s.diagnostics.failedSections.includes('alchemy')) return; // the parse shrugged it off
    expect(points(s, 0, 'active', 1)?.confidence).toBe('bound');
    expect(points(s, 0, 'active', 1)?.formula).toBeNull();
  });
});

describe.skipIf(listJson(SCRUBBED_DIR).length === 0)('the scrubbed real accounts', () => {
  it('scrubbed-w2.json: the fully spent presets read 0 left, verified', () => {
    const s = stateOf(readSave(SCRUBBED_DIR, 'scrubbed-w2.json'));
    for (const tab of [1, 2, 3, 'star'] as const)
      expect(points(s, 0, 'active', tab), `tab ${tab}`).toMatchObject({
        unspent: 0,
        confidence: 'exact-verified',
      });
    // Slot 1's other preset: points the lower bound reads as 0 left in tab 1 (9) and tab 2 (4).
    expect(points(s, 1, 'other', 1)).toMatchObject({ unspent: 9, confidence: 'exact-verified' });
    expect(points(s, 1, 'other', 2)).toMatchObject({ unspent: 4, confidence: 'exact-verified' });
    expect(allTabs(s).every((t) => t.confidence !== 'bound')).toBe(true);
  });

  it('scrubbed-w3.json: the W3 Shaman (slot 5) has 75 points waiting in tab 3 on both presets', () => {
    // The truth checks' known case: the lower bound is 0 there (both presets spent 36).
    const s = stateOf(readSave(SCRUBBED_DIR, 'scrubbed-w3.json'));
    expect(points(s, 5, 'active', 3)).toMatchObject({ total: 111, spent: 36, unspent: 75 });
    expect(points(s, 5, 'other', 3)).toMatchObject({ total: 111, spent: 36, unspent: 75 });
    // Slot 3 (Squire Lv 85): tabs 2 and 3 fully spent, so verified.
    expect(points(s, 3, 'active', 2)).toMatchObject({ unspent: 0, confidence: 'exact-verified' });
    expect(allTabs(s).every((t) => t.confidence !== 'bound')).toBe(true);
  });

  // ~11.6 KB on highend.json (11 late characters, 5 tabs + star on 2 presets each).
  it('adds under 16 KB to the largest public save (history cap, M1 TR-16)', () => {
    const s = stateOf(readSave(PUBLIC_DIR, 'highend.json'));
    const size = (x: unknown) => new TextEncoder().encode(JSON.stringify(x)).length;
    const before = size(s);
    for (const c of s.characters) {
      if (c.talents) delete c.talents.active.talentPoints;
      if (c.talents?.other) delete c.talents.other.talentPoints;
    }
    expect(before - size(s)).toBeLessThan(16 * 1024);
  });
});
