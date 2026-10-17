// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine core (M10 §2): ranking with M2's comparator, dedupe, the contested move, Visit Order,
// per-module error isolation, the Expected Return re-run, and the "Nothing covered yet" result.
import { describe, expect, it } from 'vitest';
import { AFK_SAFETY_NOT_COVERED, createEngine, runEngine } from '../../src/core/engine';
import { invariantViolations } from '../../src/core/invariants';
import type { EngineModule } from '../../src/core/module';
import { rankGoals, type TaggedGoal } from '../../src/core/rank';
import { compareGoals, EMPTY_PRIORITY_LIST, type Rankable } from '../../src/core/stubs/compare-goals';
import { visitOrder } from '../../src/core/visit-order';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { renderNowText } from '../../src/now/render-text';
import { action, goal, input, NOW, PUBLIC_SAVES, publicState } from './helpers';

const R = (over: Partial<Rankable>): Rankable => ({
  entryId: 'x',
  category: 'spendable',
  stale: false,
  contested: false,
  cost: null,
  milestoneEtaSeconds: null,
  goalsServed: 0,
  urgency: null,
  deadline: null,
  framePosition: null,
  ...over,
});

describe('compareGoals (M2 TR-14 stub)', () => {
  const list = { id: 'l', positions: { a: 1, b: 4, c: 2 }, lastPosition: 9, carriedForward: ['d'] };
  const sort = (xs: Rankable[]) => [...xs].sort((a, b) => compareGoals(a, b, list)).map((x) => x.entryId);
  it('blockers first, then list position, carry-forward after the last position, unlisted last', () => {
    expect(
      sort([
        R({ entryId: 'z' }),
        R({ entryId: 'd' }),
        R({ entryId: 'b' }),
        R({ entryId: 'a' }),
        R({ entryId: 'q', category: 'blocker' }),
      ]),
    ).toEqual(['q', 'a', 'b', 'd', 'z']);
  });
  it('by-urgency items take their frame position; urgency then deadline within a position', () => {
    expect(
      sort([
        R({ entryId: 'c' }),
        R({ entryId: 'u2', framePosition: 1, urgency: 'lost-before-return', deadline: 5 }),
        R({ entryId: 'u1', framePosition: 1, urgency: 'losing-now', deadline: 9 }),
        R({ entryId: 'u3', framePosition: 1, urgency: 'lost-before-return', deadline: 2 }),
      ]),
    ).toEqual(['u1', 'u3', 'u2', 'c']);
  });
  it('fresh before Stale, then cheaper by a fixed unit order, then ETA, then Goals served, then id', () => {
    expect(
      sort([
        R({ entryId: 's', stale: true }),
        R({ entryId: 'g', cost: { unit: 'gems', amount: 1 } }),
        R({ entryId: 'h', cost: { unit: 'hours', amount: 2 } }),
        R({ entryId: 'h1', cost: { unit: 'hours', amount: 1 } }),
        R({ entryId: 'n' }),
      ]),
    ).toEqual(['h1', 'h', 'g', 'n', 's']);
    expect(
      sort([R({ entryId: 'e2', milestoneEtaSeconds: 9 }), R({ entryId: 'e1', milestoneEtaSeconds: 3 })]),
    ).toEqual(['e1', 'e2']);
    expect(sort([R({ entryId: 'm1', goalsServed: 1 }), R({ entryId: 'm3', goalsServed: 3 })])).toEqual([
      'm3',
      'm1',
    ]);
  });
  it('is a total order whatever the emit order', () => {
    const xs = [
      R({ entryId: 'a' }),
      R({ entryId: 'z', cost: { unit: 'coins', amount: 5 } }),
      R({ entryId: 'y', cost: { unit: 'gems', amount: 1 } }),
      R({ entryId: 'q', stale: true }),
    ];
    expect(sort(xs)).toEqual(sort([...xs].reverse()));
  });
});

describe('rankGoals: dedupe and the contested rule', () => {
  const t = (g: ReturnType<typeof goal>, moduleId = 'm'): TaggedGoal => ({ goal: g, moduleId });
  it('an M3 blocker wins over another module’s Goal of the same system and subject', () => {
    const out = rankGoals(
      [
        t(goal('afk.check.food', 'c0', { category: 'blocker', system: 'afk' }), 'afk-safety'),
        t(goal('afk.goal.other', 'c0', { system: 'afk' }), 'purpose'),
      ],
      EMPTY_PRIORITY_LIST,
    );
    expect(out.map((g) => g.id)).toEqual(['afk.check.food']);
  });
  it('the same rendered text on the same subject is one Goal', () => {
    const out = rankGoals(
      [
        t(goal('a.check.x', 'c0', {}, { text: 'Buy it' }), 'm6'),
        t(goal('b.check.y', 'c0', {}, { text: 'buy it' }), 'm8'),
      ],
      EMPTY_PRIORITY_LIST,
    );
    expect(out).toHaveLength(1);
  });
  it('a Contested Goal is never the first non-blocker (one move)', () => {
    const contested = { sides: [] };
    const out = rankGoals(
      [
        t(goal('a.check.contested', 'c0', {}, { contested })),
        t(goal('b.check.plain', 'c0')),
        t(goal('c.check.later', 'c0')),
      ],
      EMPTY_PRIORITY_LIST,
    );
    expect(out.map((g) => g.id)).toEqual(['b.check.plain', 'a.check.contested', 'c.check.later']);
  });
});

describe('visitOrder', () => {
  it('worst Verdict first, then most to spend, then level, then index', () => {
    expect(
      visitOrder([
        { index: 0, level: 10, verdict: 'ready', toSpend: 0 },
        { index: 1, level: 10, verdict: 'unknown', toSpend: 0 },
        { index: 2, level: 10, verdict: 'fix', toSpend: 0 },
        { index: 3, level: 10, verdict: 'ready', toSpend: 4 },
        { index: 4, level: 30, verdict: 'ready', toSpend: 0 },
      ]),
    ).toEqual([2, 1, 3, 4, 0]);
  });
  it('a pool-after hint moves a character after its pool, within its Verdict band', () => {
    const c = [0, 1, 2].map((index) => ({ index, level: 10, verdict: 'ready' as const, toSpend: 0 }));
    const hint = {
      characterIndex: 0,
      kind: 'pool-after' as const,
      after: [2],
      roleId: 'r',
      provenance: { entryIds: [], fields: [] },
    };
    expect(visitOrder(c, [hint])).toEqual([1, 2, 0]);
  });
});

describe('the core before M2–M9 ("Nothing covered yet", M10 §6)', () => {
  it.each(PUBLIC_SAVES)(
    '%s: every Verdict is Unknown not-covered, AFK safety is listed, invariants hold',
    (f) => {
      const state = publicState(f);
      const r = runEngine(input(state));
      expect(r.characters.length).toBeGreaterThan(0);
      expect(
        r.characters.every(
          (c) => c.verdict.unknownReason === 'not-covered' || c.verdict.unknownReason === 'cannot-tell',
        ),
      ).toBe(true);
      expect(r.notCovered[0]).toEqual(AFK_SAFETY_NOT_COVERED);
      expect(r.account.safety).toBe('not-covered');
      expect(invariantViolations(r)).toEqual([]);
      expect(structuredClone(r)).toEqual(r);
      // TR-12: under 200 KB as JSON.
      expect(JSON.stringify(r).length).toBeLessThan(200 * 1024);
    },
  );
  it('US-9 R1: the screen never says "safe to log off" while AFK safety is not covered', () => {
    for (const f of PUBLIC_SAVES) {
      const r = runEngine(input(publicState(f)));
      const v = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: NOW });
      const text = renderNowText(v);
      expect(text).not.toContain('safe to log off');
      expect(JSON.stringify(v)).not.toContain('safe to log off');
      if (r.characters.every((c) => c.verdict.unknownReason === 'not-covered'))
        expect(v.allSet?.text).toBe("Nothing ActiveOn checks needs fixing · AFK safety isn't covered yet");
    }
  });
  it('the largest public save builds its view in under 5 ms (TR-12, CI fails at 2x)', () => {
    const biggest = PUBLIC_SAVES.map(publicState).sort(
      (a, b) => b.characters.length - a.characters.length,
    )[0];
    if (!biggest) throw new Error('no saves');
    const r = runEngine(input(biggest));
    buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: NOW });
    const t0 = performance.now();
    for (let i = 0; i < 20; i++)
      buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: NOW, focus: r.visitOrder[0] ?? null });
    expect((performance.now() - t0) / 20).toBeLessThan(10);
  });
});

describe('modules, failures and the Expected Return re-run', () => {
  const state = () => publicState(PUBLIC_SAVES[0] as string);
  const afk = (calls: number[]): EngineModule => ({
    id: 'afk-safety',
    covers: ['afk-safety', 'verdict'],
    dependsOnExpectedReturn: true,
    affectsVerdict: true,
    run: ({ state: s, options }) => {
      calls.push(options.expectedReturnSeconds);
      return {
        characters: s.characters.map((c) => {
          const b = goal('afk.check.food', `c${c.index}`, { category: 'blocker', system: 'afk' });
          const fix = options.expectedReturnSeconds > 4 * 3600;
          return {
            index: c.index,
            verdict: fix
              ? { kind: 'fix', blockerKeys: [b.nextAction.key], unknownReason: null, suggestion: null }
              : { kind: 'ready', blockerKeys: [], unknownReason: null, suggestion: null },
            goals: fix ? [{ goal: b }] : [],
          };
        }),
        account: { safety: 'safe' },
      };
    },
  });
  const stable = (calls: number[]): EngineModule => ({
    id: 'unspent',
    covers: [],
    dependsOnExpectedReturn: false,
    affectsVerdict: false,
    run: ({ state: s }) => {
      calls.push(1);
      return {
        account: { goals: [{ goal: goal('gem-shop.check.unspent', 'account') }] },
        notCovered: [{ systemId: 'x', label: 'X' }],
        characters: [{ index: s.characters[0]?.index ?? 0, spendCount: 9 }],
      };
    },
  });

  it('a covered AFK safety drops the "AFK safety" gap and its Verdicts render', () => {
    const r = runEngine(input(state()), [afk([])]);
    expect(r.notCovered.map((n) => n.systemId)).not.toContain('afk');
    expect(r.characters.every((c) => c.verdict.kind === 'fix')).toBe(true);
    expect(invariantViolations(r)).toEqual([]);
  });
  it('rerun re-runs only the Expected-Return-dependent modules', () => {
    const dep: number[] = [];
    const st: number[] = [];
    const engine = createEngine([afk(dep), stable(st)]);
    expect(engine.ready).toBe(false);
    const first = engine.run(input(state()));
    expect(first.characters.every((c) => c.verdict.kind === 'fix')).toBe(true);
    const again = engine.rerun(4 * 3600);
    expect(again.characters.every((c) => c.verdict.kind === 'ready')).toBe(true);
    expect(again.expectedReturn.usedSeconds).toBe(4 * 3600);
    expect(again.account.goals.map((g) => g.id)).toEqual(['gem-shop.check.unspent']);
    expect(dep).toEqual([8 * 3600, 4 * 3600]);
    expect(st).toEqual([1]);
  });
  it('the most-to-spend character visits first among equals', () => {
    const r = runEngine(input(state()), [stable([])]);
    expect(r.visitOrder[0]).toBe(state().characters[0]?.index);
  });
  it('a failing blocker module turns every character Unknown cannot-tell; others only drop their lines', () => {
    const boom = (affectsVerdict: boolean): EngineModule => ({
      id: 'boom',
      covers: affectsVerdict ? ['afk-safety', 'verdict'] : [],
      dependsOnExpectedReturn: false,
      affectsVerdict,
      run: () => {
        throw new TypeError('nope');
      },
    });
    const hard = runEngine(input(state()), [boom(true)]);
    expect(hard.characters.every((c) => c.verdict.unknownReason === 'cannot-tell')).toBe(true);
    expect(hard.account.safety).toBe('unknown');
    expect(hard.diagnostics.failedDetectors).toEqual([
      { detectorId: 'boom/module', entryIds: [], message: 'TypeError: nope' },
    ]);
    const soft = runEngine(input(state()), [boom(false), stable([])]);
    expect(soft.characters.every((c) => c.verdict.unknownReason === 'not-covered')).toBe(true);
    expect(soft.account.goals).toHaveLength(1);
  });
  it('the character being played is lastPlayedCharacterIndex', () => {
    const s = state();
    const r = runEngine(input({ ...s, lastPlayedCharacterIndex: s.characters[0]?.index ?? 0 }));
    expect(r.characters.filter((c) => c.isPlaying).map((c) => c.index)).toEqual([s.characters[0]?.index]);
  });
  it('an unreadable character is an Unknown cannot-tell row in its slot', () => {
    const s = state();
    const r = runEngine(input({ ...s, diagnostics: { ...s.diagnostics, unreadableCharacters: [9] } }));
    expect(r.characters.find((c) => c.index === 9)?.verdict.unknownReason).toBe('cannot-tell');
    expect(r.visitOrder).toContain(9);
  });
  it('a no-purpose Verdict carries its suggestion through', () => {
    const m: EngineModule = {
      id: 'verdicts',
      covers: ['verdict', 'afk-safety'],
      dependsOnExpectedReturn: true,
      affectsVerdict: true,
      run: ({ state: s }) => ({
        characters: s.characters.map((c) => ({
          index: c.index,
          verdict: {
            kind: 'unknown',
            blockerKeys: [],
            unknownReason: 'no-purpose',
            suggestion: action('leverage.check.unknown-purpose', `c${c.index}`),
          },
        })),
      }),
    };
    expect(runEngine(input(state()), [m]).characters[0]?.verdict.suggestion?.entryId).toBe(
      'leverage.check.unknown-purpose',
    );
  });
});
