// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 area N: the answer-first parts of the Now screen (FR-N2 counter, FR-N3 grouped jobs and roster
// findings, FR-N4 folds) on the scrubbed and public saves, and the pause points with the Away card
// (FR-N6, FR-N7, US-5) on histories built by `historyOf`. Characters are named by class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src/core/engine';
import type { EngineHistory } from '../../src/core/module';
import { goldenModules } from '../../src/golden';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import { buildSessionView } from '../../src/now/session-view';
import type { SessionUi } from '../../src/now/view';
import { historyOf, sessionOf } from '../helpers/history-of';

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const fixture = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return { state: stateOf(f), now: f.now };
};

const NO_HISTORY: EngineHistory = { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null };

function engineOn(state: AccountState, now: number, history: EngineHistory = NO_HISTORY) {
  const input = {
    state,
    kb: ctx.kb,
    registries: ctx.registries,
    now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  };
  return runEngine(
    {
      state,
      history,
      knowledge: {
        version: ctx.kb.version.display,
        coverage: () => [],
        kb: ctx.kb,
        registries: [ctx.registries.knowledge, ctx.registries.engine],
      },
      now,
      options: { expectedReturnSeconds: Math.round(DEFAULT_EXPECTED_RETURN_MS / 1000) },
    },
    goldenModules(input),
  );
}

const UI: SessionUi = { visited: [], returnChangedThisSession: false, manualTab: null };

function screenOf(
  id: string,
  opts: { fresh?: boolean; history?: EngineHistory; ui?: Partial<typeof UI> } = {},
) {
  const { state, now: at } = fixture(id);
  const saved = state.account.lastCloudSave ?? at;
  const now = opts.fresh ? saved + 60_000 : at;
  const result = engineOn(state, now, opts.history);
  const view = buildNowView(result, EMPTY_PREFS, { ...DEFAULT_UI, now, lastCloudSave: saved });
  return { result, view, s: buildSessionView(view, result, { ...UI, ...opts.ui }), saved, state };
}

describe('US-1 The answer first (FR-N2)', () => {
  it('W3-early, fresh: "2 fixes before you leave", the Bowman 60 first, the 2 Unknowns folded', () => {
    const { s } = screenOf('scrubbed-w3', { fresh: true });
    expect(s.counter.count).toBe(2);
    expect(s.counter.line).toBe('2 fixes before you leave');
    expect(s.counter.first?.who?.label).toBe('Bowman 60');
    expect(s.counter.first?.where).toBe('Sands of Time');
    expect(s.counter.first?.text).toBe('Swap to your fighting preset before you leave');
    // D-10: no fixSeconds ships, so the time token is hidden (DS-3, DS-23).
    expect(s.counter.first?.howLong).toBeNull();
    expect(s.counter.unknown?.count).toBe(2);
    expect(s.counter.unknown?.text).toBe("2 we can't tell: see why");
  });

  it('W2-late, fresh: 1 character + 1 account blocker = 2, the character first', () => {
    const { s } = screenOf('scrubbed-w2', { fresh: true });
    expect(s.counter.line).toBe('2 fixes before you leave');
    expect(s.counter.first?.who).not.toBeNull();
  });
});

describe('US-2 One job, said once (FR-N3, DS-7)', () => {
  it('W3-early: "Anvil full on 6 · collect" and "Worship full on 4 · spend" are roster findings', () => {
    const { s } = screenOf('scrubbed-w3');
    expect(s.findings.map((f) => f.text)).toEqual(['Anvil full on 6 · collect', 'Worship full on 4 · spend']);
    for (const f of s.findings)
      for (const i of f.indexes) expect(s.marks[i]?.inFindings).toContain(f.entryId);
  });

  it("latest: the trap job is one card with its groupText and each character's own count (V-10)", () => {
    const { s, view } = screenOf('latest', { fresh: true });
    const traps = s.groups.find((g) => g.entryId === 'trapping.check.slots-and-timers');
    expect(traps?.text).toBe('Collect and re-place your finished traps');
    const chips = traps?.stops.flatMap((st) => st.chips) ?? [];
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(traps?.heading).toBe(`Same job on ${chips.length} characters`);
    expect(new Set(chips.map((c) => c.detail))).toEqual(new Set(['6', '7']));
    // Biggest stop first.
    const sizes = traps?.stops.map((st) => st.chips.length) ?? [];
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
    for (const c of chips) expect(s.marks[c.index]?.group).toBe(traps?.entryId);
    // DS-7: no sentence more than twice on the rows that stay.
    const shown = view.roster.filter((r) => s.marks[r.index]?.group === null).map((r) => r.summary);
    const counts = new Map<string, number>();
    for (const t of shown) counts.set(t, (counts.get(t) ?? 0) + 1);
    expect([...counts.values()].every((n) => n <= 2)).toBe(true);
  });

  it('latest (11 characters) folds its Ready rows; W2-late (5) does not (FR-N4)', () => {
    const late = screenOf('latest', { fresh: true });
    expect(late.s.readyFold).toEqual(
      late.view.roster.filter((r) => r.pill.kind === 'ready').map((r) => r.index),
    );
    expect(screenOf('scrubbed-w2', { fresh: true }).s.readyFold).toEqual([]);
  });
});

describe('US-5 Pause points pick themselves (FR-N6, FR-N7)', () => {
  const base = fixture('scrubbed-w3');
  const saved = base.state.account.lastCloudSave ?? base.now;
  // This session started 2 minutes before the save; the previous one ended 9 h before it began, with
  // the Wizard 73 at 70 and the Bowman 60 at 58 then.
  const lastSession = sessionOf({
    endedMinutesBefore: 2 + 9 * 60,
    lengthMinutes: 60,
    levels: { 0: 70, 2: 58 },
  });
  const history: EngineHistory = {
    entries: historyOf(base.state, [...lastSession, { minutesBefore: 2 }]),
    sessionStartedAt: saved - 2 * 60_000,
    learnedExpectedReturnSeconds: null,
  };
  /** The engine on the W3 save as parsed `minutesAfter` the save (the app's asOf is the parse time). */
  const at = (minutesAfter: number, ui: Partial<typeof UI> = {}, h: EngineHistory = history) => {
    const now = saved + minutesAfter * 60_000;
    const result = engineOn({ ...base.state, asOf: now }, now, h);
    const view = buildNowView(result, EMPTY_PREFS, { ...DEFAULT_UI, now, lastCloudSave: saved });
    return { view, v: buildSessionView(view, result, { ...UI, ...ui }) };
  };

  it('picks Log in after 9 h away, with the full Away card: levels gained, at most 7 rows', () => {
    const { v } = at(0);
    expect(v.tab).toBe('login');
    expect(v.why).toBe('Picked Log in: you were away 9h 00m');
    expect(v.away?.size).toBe('card');
    expect(v.away?.text).toBe('While you were away · 9h 00m');
    expect(v.login?.rows.filter((r) => r.kind === 'level').map((r) => r.text)).toEqual([
      '+3 levels on Wizard 73 · new talent points: see Build',
      '+2 levels on Bowman 60 · new talent points: see Build',
    ]);
    expect(v.away?.rows.length).toBeLessThanOrEqual(7);
    expect(v.away?.first?.who?.label).toBe('Bowman 60');
  });

  it('12 minutes later, with a Fix not yet opened, it is Rounds', () => {
    expect(at(12).v.tab).toBe('rounds');
  });

  it('every character with a Fix opened and the count at 2: Log off, listing the 2 items', () => {
    const fixes = at(12)
      .view.roster.filter((r) => r.pill.kind === 'fix')
      .map((r) => r.index);
    const { v } = at(12, { visited: fixes });
    expect(v.tab).toBe('logoff');
    expect(v.why).toBe('Picked Log off: every character with a fix was opened');
    expect(v.logoff.items.map((i) => i.who?.label)).toEqual(['Bowman 60', 'Barbarian 56']);
  });

  it('a manual pick holds and says so; the Return chips changed this session pick Log off', () => {
    expect(at(12, { manualTab: 'login' }).v.why).toBe('You picked Log in: it stays for this session');
    expect(at(12, { returnChangedThisSession: true }).v.tab).toBe('logoff');
  });

  it('away 1h 30m: one line, never the full card', () => {
    const short: EngineHistory = {
      ...history,
      entries: historyOf(base.state, [
        ...sessionOf({ endedMinutesBefore: 2 + 90, lengthMinutes: 30 }),
        { minutesBefore: 2 },
      ]),
    };
    const { v } = at(0, {}, short);
    expect(v.tab).toBe('login');
    expect(v.away?.size).toBe('line');
    expect(v.away?.text).toMatch(/^Welcome back · away 1h 30m · \d+ things? filled$/);
  });

  it('a pasted save (no history) shows no Away card and is Rounds', () => {
    const { s } = screenOf('scrubbed-w3', { fresh: true });
    expect(s.away).toBeNull();
    expect(s.login).toBeNull();
    expect(s.tab).toBe('rounds');
  });
});
