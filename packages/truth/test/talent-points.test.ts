// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The exact talent point rules (ADR 0010): a tab whose formula total is below what the save spent is
// reported with the fields to check, and an exact count contradicts a "No points waiting" line.
import type { TabPoints } from '@idleon-forge/account-state';
import type { BuildTabView } from '@idleon-forge/engine/result';
import { describe, expect, it } from 'vitest';
import { checkTruth } from '../src/check';
import { TALENT_TOTAL_RULE } from '../src/rules/talent-total-vs-answer-key';
import { envelopeOf, presetView, resultOf, roadmap, stateOf } from './helpers';

/** Level 40 Squire with everything spent in tabs 1–3 (the raw floor reads 0 left everywhere). */
const FULL = { 75: 100, 76: 14, 90: 50, 91: 52, 125: 33 };

const tp = (partial: Partial<TabPoints>): TabPoints => ({
  total: 33,
  spent: 33,
  unspent: 0,
  confidence: 'exact',
  formula: 33,
  oracle: 33,
  ...partial,
});

const withPoints = (points: Partial<Record<1 | 2 | 3 | 'star', TabPoints>>) => {
  const state = stateOf([{ index: 0, live: FULL }]);
  const t = state.characters[0]?.talents;
  if (t) t.active.talentPoints = points;
  return state;
};

const tab = (n: number, partial: Partial<BuildTabView> = {}): BuildTabView => ({
  tab: n,
  name: `tab ${n}`,
  spent: 0,
  unspent: null,
  rows: [],
  others: [],
  ...partial,
});

describe(TALENT_TOTAL_RULE, () => {
  it('reports a tab whose formula is below what the save spent, with the fields to check', () => {
    const state = withPoints({
      3: tp({
        total: null,
        unspent: null,
        confidence: 'bound',
        formula: 30,
        oracle: 33,
        terms: { bubble: 5 },
      }),
    });
    const out = checkTruth({ envelope: envelopeOf([{ index: 0, live: FULL }]), state, result: null });
    const v = out.report.violations.filter((x) => x.rule === TALENT_TOTAL_RULE);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      key: 'c0.p0.t3.total',
      severity: 'P2',
      hold: false,
      scope: { kind: 'talents', character: 0, slot: 0, tab: 3 },
    });
    expect(v[0]?.message).toContain('preset 1 · tab 3');
    expect(v[0]?.evidence).toMatchObject({ formula: 30, answerKey: 33, spent: 33, 'term.bubble': 5 });
    expect(String(v[0]?.evidence.fields)).toContain('CYTalentPoints');
    // Nothing is held back: the advice already uses the lower bound on that tab.
    expect(out.report.suppressed).toEqual([]);
  });

  it('stays quiet on exact tabs and on tabs the formula could not compute', () => {
    const state = withPoints({
      1: tp({ confidence: 'exact-verified' }),
      2: tp({ total: null, unspent: null, confidence: 'bound', formula: null, oracle: null }),
    });
    const out = checkTruth({ envelope: envelopeOf([{ index: 0, live: FULL }]), state, result: null });
    expect(out.report.violations.filter((x) => x.rule === TALENT_TOTAL_RULE)).toEqual([]);
  });
});

describe('no-points-vs-unspent with the exact count', () => {
  const text = 'No points waiting in this tab; the next go into Precision Power (to 100)';
  const line = { key: 'c-s0-t3-0', tab: 3, label: 'Precision Power', points: 0, text };
  const result = resultOf([
    roadmap(0, [presetView(0, true, { tabs: [tab(3, { spent: 33 })], next: [line] })]),
  ]);

  it('fires when the exact count has points left where the raw floor and the bound see none', () => {
    const state = withPoints({ 3: tp({ total: 45, unspent: 12 }) });
    const out = checkTruth({ envelope: envelopeOf([{ index: 0, live: FULL }]), state, result });
    const v = out.report.violations.filter((x) => x.rule === 'no-points-vs-unspent');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ severity: 'P1', evidence: { exact: 12, rawAtLeast: 0 } });
    expect(v[0]?.message).toContain('the save has 12 unspent there');
  });

  it('ignores a count that fell back to the bound', () => {
    const state = withPoints({
      3: tp({ total: null, unspent: null, confidence: 'bound', formula: null, oracle: null }),
    });
    const out = checkTruth({ envelope: envelopeOf([{ index: 0, live: FULL }]), state, result });
    expect(out.report.violations.filter((x) => x.rule === 'no-points-vs-unspent')).toEqual([]);
  });
});
