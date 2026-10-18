// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3's history Detectors on empty, short and sufficient history. The live app now sends real save
// history (M10 TR-6), and a fresh browser's is partial: each Detector needs its minimum sample count,
// and with less it falls back exactly as with no history (D1: no worst-case guess).
// W3-early save order: Wizard Lv 73, Squire Lv 51, Bowman Lv 60, Squire Lv 85, Barbarian Lv 56, Shaman Lv 54.
import type { AccountState } from '@idleon-forge/account-state';
import type { HistoryEntry } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { HOUR_MS } from '../../src/afk';
import { blockers, charOf, evaluate, nextActions, patchAfk, W2, W3 } from './helpers';

const SQUIRE = 3;

const withSpare = (s: AccountState) => {
  const f = s.characters[SQUIRE]?.afk?.fighting;
  return f ? patchAfk(s, SQUIRE, { fighting: { ...f, spareHealthFood: 500 } }) : s;
};

/**
 * `stretches` earlier AFK Stretches of the Squire Lv 85, 2 h each, eating 20 health food an hour. Each
 * save is `offsetMs` after the switch-away; past 10 minutes it falls outside the load window.
 */
function foodHistory(s: AccountState, stretches: number, offsetMs = 0): HistoryEntry[] {
  const c = s.characters.find((x) => x.index === SQUIRE);
  const since = c?.afk?.afkSince ?? s.asOf;
  const health = (c?.afk?.food ?? []).filter((f) => f.kind === 'health').reduce((n, f) => n + f.amount, 0);
  return Array.from({ length: stretches }, (_, i) => stretches - i).map((k) => {
    const afkSince = since - k * 2 * HOUR_MS;
    const at = afkSince + offsetMs;
    const food = (c?.afk?.food ?? []).map((f) =>
      f.kind === 'health' ? { ...f, amount: health + 40 * k } : f,
    );
    const state = patchAfk(s, SQUIRE, { afkSince, food });
    return {
      lastCloudSave: at,
      receivedAt: at,
      state: { ...state, account: { ...state.account, lastCloudSave: at } },
    };
  });
}

/** Earlier saves 1 h apart with Water at the given levels (max 32 unless `max` says otherwise). */
function waterHistory(
  s: AccountState,
  levels: number[],
  max: (i: number) => number = () => 32,
): HistoryEntry[] {
  return levels.map((current, i) => {
    const at = s.asOf - (levels.length - i) * HOUR_MS;
    const afk = s.account.afk;
    const liquids = (afk?.liquids ?? []).map((l) => (l.index === 0 ? { ...l, current, max: max(i) } : l));
    const state = afk ? { ...s, account: { ...s.account, afk: { ...afk, liquids } } } : s;
    return { lastCloudSave: at, receivedAt: at, state };
  });
}

const finding = (s: AccountState, history: HistoryEntry[], id: string, hours = 8) =>
  charOf(evaluate(s, hours, { history }), SQUIRE).findings.find((f) => f.entryId === id);

describe('afk/health-food-runs-out needs two observed stretches', () => {
  const id = 'afk.check.health-food-runs-out';
  it('empty history: no food blocker, the estimate waits', () => {
    expect(finding(withSpare(W3()), [], id)).toBeUndefined();
  });
  it('one observed stretch is too short: still no blocker', () => {
    const s = withSpare(W3());
    expect(finding(s, foodHistory(s, 1), id)).toBeUndefined();
  });
  it('two observed stretches time it: 146 at 20 an hour runs out before an 8 h return', () => {
    const s = withSpare(W3());
    expect(finding(s, foodHistory(s, 2), id)?.role).toBe('blocker');
  });
  it('saves outside the 10-minute load window count for nothing, however many there are', () => {
    const s = withSpare(W3());
    expect(finding(s, foodHistory(s, 5, 30 * 60_000), id)).toBeUndefined();
  });
});

describe('afk/low-food-untimed stays until a food rate exists', () => {
  const id = 'afk.check.low-food-untimed';
  it('empty history: the Squire Lv 85 gets "Low food: N left; can\'t time it yet"', () => {
    expect(finding(W3(), [], id)?.role).toBe('next-action');
  });
  it('one observed stretch: no rate yet, so the low-food line stays', () => {
    const s = W3();
    expect(finding(s, foodHistory(s, 1), id)?.role).toBe('next-action');
  });
  it('earlier stretches whose saves miss the load window give no rate: the line stays', () => {
    // Before, two earlier stretches silenced it even though no Check could time the food.
    const s = W3();
    const h = foodHistory(s, 3, 30 * 60_000);
    expect(finding(s, h, id)?.role).toBe('next-action');
    expect(finding(s, h, 'afk.check.health-food-runs-out')).toBeUndefined();
  });
  it('two observed stretches: the timed Check takes over and this one is silent', () => {
    const s = withSpare(W3());
    const h = foodHistory(s, 2);
    expect(finding(s, h, id)).toBeUndefined();
    expect(finding(s, h, 'afk.check.health-food-runs-out')?.role).toBe('blocker');
  });
});

describe('afk/dies-fixable-by-food says stock up only with an observed rate (R-FOOD-1)', () => {
  const id = 'afk.check.dies-fixable-by-food';
  const text = (history: HistoryEntry[]) =>
    charOf(evaluate(W2(), 8, { history }), 0).findings.find((f) => f.entryId === id)?.nextAction.text;
  /**
   * `saves` earlier switch-aways of the Barbarian Lv 60 eating 30 Meat Pie an hour. The current save
   * has no Meat Pie equipped, so `saves` give `saves - 1` observations.
   */
  const eating = (stretches: number): HistoryEntry[] => {
    const s = W2();
    const since = s.characters[0]?.afk?.afkSince ?? s.asOf;
    return Array.from({ length: stretches }, (_, i) => stretches - i).map((k) => {
      const afkSince = since - k * 2 * HOUR_MS;
      const pie = {
        slot: 2,
        item: 'FoodHealth7',
        kind: 'health' as const,
        amount: 100 + 60 * k,
        healPerBite: 500,
      };
      const state = patchAfk(s, 0, { afkSince, food: [...(s.characters[0]?.afk?.food ?? []), pie] });
      return {
        lastCloudSave: afkSince,
        receivedAt: afkSince,
        state: { ...state, account: { ...state.account, lastCloudSave: afkSince } },
      };
    });
  };
  it('no observation or one: plain equip text, no stock-up', () => {
    expect(text([])).toBe('Equip Meat Pie before you leave');
    expect(text(eating(1))).toBe('Equip Meat Pie before you leave');
    expect(text(eating(2))).toBe('Equip Meat Pie before you leave');
  });
  it('two observations: the stack is judged short and the stock-up text shows', () => {
    expect(text(eating(3))).toMatch(/and stock up on it/);
  });
});

describe('alchemy/liquid-cap blocks only on two clean refill intervals (R-PILL-2)', () => {
  const at8 = (h: HistoryEntry[]) => evaluate(W2(), 8, { history: h }).account.findings;
  it('empty history: the account line, never the blocker', () => {
    expect(blockers(at8([]))).not.toContain('alchemy.check.liquid-cap');
    expect(nextActions(at8([]))).toContain('alchemy.check.liquid-cap-line');
  });
  it('one interval is too short: a spend between two saves would read as a slow refill', () => {
    const f = at8(waterHistory(W2(), [0, 2]));
    expect(blockers(f)).not.toContain('alchemy.check.liquid-cap');
    expect(nextActions(f)).toContain('alchemy.check.liquid-cap-line');
  });
  it('two intervals at 2 an hour (16 h to refill) block an 8 h return', () => {
    expect(blockers(at8(waterHistory(W2(), [0, 2, 4])))).toContain('alchemy.check.liquid-cap');
  });
  it('an interval where the cap changed (a level-up) is dropped', () => {
    const f = at8(waterHistory(W2(), [0, 2, 4], (i) => (i === 2 ? 40 : 32)));
    expect(blockers(f)).not.toContain('alchemy.check.liquid-cap');
  });
});
