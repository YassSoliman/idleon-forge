// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Each truth rule fires on its contradiction and stays quiet otherwise (M22 TR-3), and a violation
// replaces only the advice it touches (FR-3).
import type { BuildTabView, EngineResult, Goal, SpendLine } from '@idleon-forge/engine/result';
import { describe, expect, it } from 'vitest';
import { checkTruth } from '../src/check';
import { RULES } from '../src/rules';
import { CANT_BE_SURE } from '../src/suppress';
import { envelopeOf, presetView, resultOf, roadmap, stateOf } from './helpers';

const tab = (n: number, partial: Partial<BuildTabView> = {}): BuildTabView => ({
  tab: n,
  name: `tab ${n}`,
  spent: 0,
  unspent: null,
  rows: [],
  others: [],
  ...partial,
});

const powerStrike = (current: number) => ({
  id: 90,
  label: 'Power Strike',
  current,
  target: 54,
  max: 100,
  met: false,
  core: true,
  note: null,
});

/** Level 40 Squire, everything spent in tabs 1–2 except what the case leaves; tab 3 spent 33 (none left). */
const FULL = { 75: 100, 76: 14, 90: 50, 91: 52, 125: 33 };

describe('registry', () => {
  it('runs every rule once, in a stable order, with unique ids', () => {
    const ids = RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'raw-matches-state',
      'same-fact-everywhere',
      'star-total-floor',
      'talent-total-vs-answer-key',
      'next-not-at-target',
      'no-points-vs-unspent',
      'affordable-within-wallet',
    ]);
  });
});

describe('no-points-vs-unspent', () => {
  const line = { key: 'c-s0-t3-0', tab: 3, label: 'Precision Power', points: 0 };
  const text = 'No points waiting in this tab; the next go into Precision Power (to 100)';

  it('fires when the save has points left in that tab, and holds that line back', () => {
    const live = { ...FULL, 125: 3 }; // tab 3: 33 earned at Lv 40, 3 spent: at least 30 left
    const env = envelopeOf([{ index: 0, live }]);
    const result = resultOf([
      roadmap(0, [presetView(0, true, { tabs: [tab(3)], next: [{ ...line, text }] })]),
    ]);
    const out = checkTruth({ envelope: env, state: stateOf([{ index: 0, live }]), result });
    const v = out.report.violations.filter((x) => x.rule === 'no-points-vs-unspent');
    expect(v).toHaveLength(1);
    expect(v[0]?.evidence.rawAtLeast).toBe(30);
    expect(out.result?.builds?.[0]?.presets[0]?.next[0]?.text).toBe(CANT_BE_SURE);
    // The engine's own result is untouched: suppression works on a copy.
    expect(result.builds?.[0]?.presets[0]?.next[0]?.text).toBe(text);
  });

  it('fires on the engine’s own lower bound too', () => {
    const env = envelopeOf([{ index: 0, live: FULL }]);
    const result = resultOf([
      roadmap(0, [
        presetView(0, true, { tabs: [tab(3, { spent: 33, unspent: 4 })], next: [{ ...line, text }] }),
      ]),
    ]);
    const out = checkTruth({ envelope: env, state: stateOf([{ index: 0, live: FULL }]), result });
    expect(out.report.violations.map((x) => x.rule)).toEqual(['no-points-vs-unspent']);
  });

  it('reports, but does not hold back, the hedged "No unspent points known" line (#120)', () => {
    const live = { ...FULL, 125: 3 };
    const hedged = 'No unspent points known here; the next go into Precision Power (to 100)';
    const result = resultOf([
      roadmap(0, [presetView(0, true, { tabs: [tab(3, { spent: 3 })], next: [{ ...line, text: hedged }] })]),
    ]);
    const out = checkTruth({
      envelope: envelopeOf([{ index: 0, live }]),
      state: stateOf([{ index: 0, live }]),
      result,
    });
    const v = out.report.violations.filter((x) => x.rule === 'no-points-vs-unspent');
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({ hold: false, severity: 'P2' });
    expect(out.report.suppressed).toEqual([]);
    expect(out.result?.builds?.[0]?.presets[0]?.next[0]?.text).toBe(hedged);
  });

  it('stays quiet when the tab is fully spent', () => {
    const env = envelopeOf([{ index: 0, live: FULL }]);
    const result = resultOf([
      roadmap(0, [presetView(0, true, { tabs: [tab(3, { spent: 33 })], next: [{ ...line, text }] })]),
    ]);
    const out = checkTruth({ envelope: env, state: stateOf([{ index: 0, live: FULL }]), result });
    expect(out.report.violations).toEqual([]);
    expect(out.result).toBe(result);
  });
});

describe('next-not-at-target', () => {
  const view = (text: string, current: number) =>
    resultOf([
      roadmap(0, [
        presetView(0, true, {
          tabs: [tab(2, { spent: current + 52, rows: [powerStrike(current)] })],
          next: [{ key: 'c-s0-t2-0', tab: 2, label: 'Power Strike', text, points: 4 }],
        }),
      ]),
    ]);

  it('fires when the save already has the talent at the line’s target (the Idle Shooting case)', () => {
    const env = envelopeOf([{ index: 0, live: { ...FULL, 90: 54 } }]);
    const out = checkTruth({
      envelope: env,
      state: stateOf([{ index: 0, live: { ...FULL, 90: 54 } }]),
      result: view('Put the next 4 points into Power Strike (to 54)', 54),
    });
    const v = out.report.violations.find((x) => x.rule === 'next-not-at-target');
    expect(v?.evidence).toMatchObject({ raw: 54, target: 54 });
    expect(out.result?.builds?.[0]?.presets[0]?.next[0]?.text).toBe(CANT_BE_SURE);
  });

  it('fires when the first line starts from a level the save doesn’t have', () => {
    const env = envelopeOf([{ index: 0, live: FULL }]); // Power Strike at 50
    const out = checkTruth({
      envelope: env,
      state: stateOf([{ index: 0, live: FULL }]),
      result: view('Put the next 10 points into Power Strike (to 54)', 50),
    });
    expect(out.report.violations.find((x) => x.rule === 'next-not-at-target')?.evidence.shownStart).toBe(44);
  });

  it('stays quiet on a correct line', () => {
    const env = envelopeOf([{ index: 0, live: FULL }]);
    const out = checkTruth({
      envelope: env,
      state: stateOf([{ index: 0, live: FULL }]),
      result: view('Put the next 4 points into Power Strike (to 54)', 50),
    });
    expect(out.report.violations).toEqual([]);
  });

  it('checks the Build path: a step shown done must be done in the save (M21 FR-C1)', () => {
    const step = (band: 'done' | 'now', current: number) => ({
      key: 'p-s0-t2-0',
      talentId: 90,
      label: 'Power Strike',
      page: null,
      current,
      goal: 54,
      need: band === 'done' ? 0 : 54 - current,
      cumulative: band === 'done' ? null : 4,
      band,
      partNow: null,
      core: true,
      condition: null,
      note: null,
    });
    const result = (band: 'done' | 'now', current: number) =>
      resultOf([
        roadmap(0, [
          presetView(0, true, { tabs: [tab(2, { spent: 102, rows: [], path: [step(band, current)] })] }),
        ]),
      ]);
    const state = stateOf([{ index: 0, live: FULL }]); // Power Strike at 50
    const env = envelopeOf([{ index: 0, live: FULL }]);
    const wrong = checkTruth({ envelope: env, state, result: result('done', 54) });
    expect(wrong.report.violations.find((x) => x.rule === 'next-not-at-target')?.evidence).toMatchObject({
      raw: 50,
      goal: 54,
      band: 'done',
    });
    expect(wrong.result?.builds?.[0]?.presets[0]?.tabs[0]?.path?.[0]?.note).toBe(CANT_BE_SURE);
    const right = checkTruth({ envelope: env, state, result: result('now', 50) });
    expect(right.report.violations).toEqual([]);
  });

  it('checks M9’s "Next talent points" Goal against every preset', () => {
    const live = { ...FULL, 90: 60 };
    const goal = {
      id: 'g',
      title: 'Talents',
      system: 'talents',
      category: 'compounding',
      milestone: null,
      nextAction: {
        key: 'talents.check.next-step@c0',
        entryId: 'talents.check.next-step',
        text: 'Next talent points: Power Strike to 54',
        why: '',
      },
    } as unknown as Goal;
    const result = view('Put the next 4 points into Power Strike (to 64)', 60);
    (result.characters[0] as { goals: Goal[] }).goals = [goal];
    const out = checkTruth({
      envelope: envelopeOf([{ index: 0, live }]),
      state: stateOf([{ index: 0, live }]),
      result,
    });
    const v = out.report.violations.filter((x) => x.rule === 'next-not-at-target');
    expect(v.map((x) => x.key)).toEqual(['talents.check.next-step@c0']);
    expect(out.result?.characters[0]?.goals[0]?.nextAction.text).toBe(CANT_BE_SURE);
  });
});

describe('raw-matches-state: a corrupted Account State', () => {
  it('flags wrong preset points and holds back only that preset’s lines and the talent Goals', () => {
    const live = FULL;
    const other = { 75: 100, 90: 10 };
    const env = envelopeOf([{ index: 0, live, other }]);
    // The Account State says the other preset has 15 in Power Strike; the save says 10.
    const state = stateOf([{ index: 0, live, other: { ...other, 90: 15 } }]);
    const next = (slot: 0 | 1) => [
      {
        key: `c-s${slot}-t2-0`,
        tab: 2,
        label: 'Power Strike',
        text: 'No points waiting in this tab; the next go into Power Strike (to 54)',
        points: 0,
      },
    ];
    const result = resultOf([
      roadmap(0, [
        presetView(0, true, { tabs: [tab(2, { spent: 102, rows: [powerStrike(50)] })], next: next(0) }),
        presetView(1, false, { tabs: [tab(2, { spent: 15, rows: [powerStrike(15)] })], next: next(1) }),
      ]),
    ]);
    const out = checkTruth({ envelope: env, state, result });
    const v = out.report.violations.filter((x) => x.rule === 'raw-matches-state');
    expect(v.map((x) => x.key).sort()).toEqual(['c0.p1.t2.spent', 'c0.p1.talent.90']);
    const presets = out.result?.builds?.[0]?.presets;
    expect(presets?.[1]?.next[0]?.text).toBe(CANT_BE_SURE);
    expect(presets?.[1]?.tabs[0]?.rows[0]?.note).toBe(CANT_BE_SURE);
    // The live preset's line is a different item: left alone by this rule.
    expect(
      out.report.suppressed.some((s) => s.key === 'c-s0-t2-0' && s.rules.includes('raw-matches-state')),
    ).toBe(false);
  });
});

describe('same-fact-everywhere', () => {
  it('flags a Build level that differs from the Account State', () => {
    const env = envelopeOf([{ index: 0, live: FULL }]);
    const result = resultOf([roadmap(0, [presetView(0, true)], 41)]);
    const out = checkTruth({ envelope: env, state: stateOf([{ index: 0, live: FULL }]), result });
    const v = out.report.violations.find((x) => x.rule === 'same-fact-everywhere');
    expect(v?.key).toBe('c0.level');
    expect(v?.evidence).toEqual({ state: 40, build: 41 });
  });
});

describe('affordable-within-wallet', () => {
  const line = (coins: number, status: SpendLine['status'] = 'buy'): SpendLine =>
    ({
      id: `l${coins}`,
      entryId: 'e',
      status,
      coins,
      payer: 0,
      steps: [],
      text: 'Buy it',
      detail: null,
      reportText: 'Buy it',
      why: '',
    }) as unknown as SpendLine;
  const withPlan = (lines: SpendLine[]): EngineResult =>
    resultOf([], {
      account: { goals: [], spendPlan: { lines, wallets: [] } },
    } as unknown as Partial<EngineResult>);

  it('fires when a buy-now line costs more than the payer carries, and holds that line back', () => {
    const env = envelopeOf([{ index: 0, live: FULL, money: 500 }]);
    const out = checkTruth({
      envelope: env,
      state: stateOf([{ index: 0, live: FULL }]),
      result: withPlan([line(900)]),
    });
    expect(out.report.violations.map((x) => x.rule)).toEqual(['affordable-within-wallet']);
    expect(out.result?.account.spendPlan?.lines[0]?.text).toBe(CANT_BE_SURE);
  });

  it('lets a move-coins line use the bank', () => {
    const env = envelopeOf([{ index: 0, live: FULL, money: 500 }]);
    const out = checkTruth({
      envelope: env,
      state: stateOf([{ index: 0, live: FULL }]),
      result: withPlan([line(1200, 'move-coins')]),
    });
    expect(out.report.violations).toEqual([]);
  });
});

describe('checkTruth', () => {
  it('never throws: a broken rule is an error in the report and suppresses nothing', () => {
    const env = envelopeOf([{ index: 0, live: FULL }]);
    const result = resultOf([]);
    const out = checkTruth({
      envelope: env,
      state: stateOf([{ index: 0, live: FULL }]),
      result,
      rules: [
        {
          id: 'boom',
          title: 'throws',
          check: () => {
            throw new Error('bad');
          },
        },
      ],
    });
    expect(out.report.error).toBe('Error: bad');
    expect(out.result).toBe(result);
  });
});
