// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 F5, Behind for your Stage (docs/specs/M15-account-depth.md US-5, FR-26 to FR-32, TR-9, TR-13).
// The full engine runs on the compiled bundle with every module, as in the app; characters are named by
// class and level only.
import type { AccountState } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS, stageIndex } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { newThisSession, runEngine } from '../../src/core/engine';
import type { EngineHistory, EngineModule } from '../../src/core/module';
import type { TaggedGoal } from '../../src/core/rank';
import { goldenModules, goldenResult } from '../../src/golden';
import {
  BEHIND_ID,
  behindRows,
  behindStep,
  EXPECTATIONS_ID,
  lookupOf,
  stageExpectations,
} from '../../src/metapath';
import { EMPTY_PRIORITY_LIST } from '../../src/metapath/priority';
import { buildNowView, DEFAULT_UI } from '../../src/now/build-now-view';
import { EMPTY_PREFS } from '../../src/now/prefs';
import type { EngineResult, Goal } from '../../src/result';

const ctx = await goldenContext();
const facts = lookupOf(ctx.kb);
const fixtures = listFixtures({ private: true }).filter((f) => f.kind !== 'public');
const w2 = fixtures.filter((f) => f.id === 'scrubbed-w2' || f.id === 'private:yasser');
const w3 = fixtures.filter((f) => f.id === 'scrubbed-w3' || f.id === 'private:joseph');

const input = (state: AccountState, now: number) => ({
  state,
  kb: ctx.kb,
  registries: ctx.registries,
  now,
  expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
});
const behindOf = (r: EngineResult): Goal | undefined => r.account.goals.find((g) => g.id === BEHIND_ID);
const fixGoals = (r: EngineResult, entryId: string) => [
  ...r.characters.flatMap((c) =>
    c.goals.filter((g) => g.nextAction.entryId === entryId && g.id !== BEHIND_ID),
  ),
  ...r.account.goals.filter((g) => g.nextAction.entryId === entryId && g.id !== BEHIND_ID),
];

/** Every module, with one fix entry's findings removed (as if that System were done). */
function runWithout(state: AccountState, now: number, entryId: string): EngineResult {
  const strip = (m: EngineModule): EngineModule => ({
    ...m,
    run: (i, p) => {
      const out = m.run(i, p);
      const keep = (gs?: { goal: Goal }[]) => gs?.filter((g) => g.goal.nextAction.entryId !== entryId);
      return {
        ...out,
        characters: out.characters?.map((c) => ({ ...c, goals: keep(c.goals) })),
        account: out.account ? { ...out.account, goals: keep(out.account.goals) } : undefined,
      };
    },
  });
  const i = input(state, now);
  return runEngine(
    {
      state,
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb: ctx.kb },
      now,
      options: { expectedReturnSeconds: 8 * 3600 },
    },
    goldenModules(i).map(strip),
  );
}

describe('the Stage Expectations table (TR-10)', () => {
  it('seeds the rows whose fix ships, in tie-break order, each with a player-readable Source', () => {
    const rows = stageExpectations(facts);
    expect(rows.map((r) => [r.id, r.expectedBy])).toEqual([
      ['cards-slots-filled', 'W1-mid'],
      ['anvil-points-spent', 'W1-mid'],
      ['stamps-town-shops', 'W1-late'],
      ['obol-altar', 'W2-early'],
      ['presets-set-up', 'W2-early'],
      ['big-bubbles', 'W2-mid'],
      ['post-office', 'W2-late'],
      ['salts-running', 'W3-early'],
      ['printer-per-character', 'W3-mid'],
      ['auto-refine', 'W3-mid'],
      // M20 FR-42: no free Cog Board square, and a skull on every character, by W3-mid.
      ['cog-board-full', 'W3-mid'],
      ['worship-skulls', 'W3-mid'],
    ]);
    for (const r of rows) {
      expect(ctx.kb.entries[r.fix], r.fix).toBeDefined();
      expect(r.sources.some((s) => s.tier > 1 && s.url.startsWith('https://idleon.wiki/'))).toBe(true);
    }
  });

  it('FR-26: rows at the current Stage or later are never behind', () => {
    const rows = stageExpectations(facts);
    expect(behindRows(rows, 'W2-late').map((r) => r.id)).not.toContain('post-office');
    expect(behindRows(rows, 'W3-early').map((r) => r.id)).toContain('post-office');
    expect(behindRows(rows, 'W1-early')).toEqual([]);
    for (const s of ['W1-mid', 'W2-late', 'W3-early'] as const)
      for (const r of behindRows(rows, s)) expect(stageIndex(r.expectedBy)).toBeLessThan(stageIndex(s));
  });
});

describe.each(w2.map((f) => [f.id, f] as const))('US-5 on the W2-late account (%s)', (_id, f) => {
  const state = stateOf(f);
  const r = goldenResult(input(state, f.now));

  it('behind rows: cards, stamps, talent presets and big bubbles; post office (W2-late) is on-path', () => {
    // Cards moved into the Behind Goal; the other behind rows' fixes still show in their own places.
    const fired = behindRows(stageExpectations(facts), 'W2-late')
      .filter((row) => row.id === 'cards-slots-filled' || fixGoals(r, row.fix).length > 0)
      .map((row) => row.id);
    expect(fired).toEqual(['cards-slots-filled', 'stamps-town-shops', 'presets-set-up', 'big-bubbles']);
    expect(fixGoals(r, 'post-office.check.unlock')).toHaveLength(1);
  });

  it('the weakest is Cards: its Next Action is the Bowman Lv 54 card line, the rest are details', () => {
    const g = behindOf(r);
    expect(g?.title).toBe('Behind for your Stage: Cards');
    expect(g?.nextAction.entryId).toBe('cards.check.empty-slots');
    expect(g?.nextAction.text).toBe('Bowman Lv 54: Equip 4 cards in your empty card slots');
    // Copy pass: the cards to equip ride in the why, after the Behind explanation.
    expect(g?.nextAction.why).toContain('Equip Carrotman, Bored Bean, Pincermin and Mashed Potato: ');
    expect(
      g?.nextAction.why.startsWith(
        "Accounts usually finish this well before where you are; it's the earliest thing yours has left.",
      ),
    ).toBe(true);
    expect(g?.details?.map((d) => d.text)).toEqual(['Fill the empty card slots of 2 characters']);
    expect(g?.nextAction.provenance.entryIds).toEqual(expect.arrayContaining([BEHIND_ID, EXPECTATIONS_ID]));
  });

  it('FR-29: the card Goals moved; they do not also show on character rows or as their own account line', () => {
    expect(fixGoals(r, 'cards.check.empty-slots')).toEqual([]);
  });

  it('FR-30: it ranks at the card check position, never above the push or position 1 items', () => {
    const goals = r.account.goals;
    const i = goals.findIndex((g) => g.id === BEHIND_ID);
    expect(i).toBeGreaterThan(0);
    expect(goals.slice(0, i).every((g) => g.id !== 'metapath.goal.family-unlock')).toBe(true);
  });
});

describe.each(w3.map((f) => [f.id, f] as const))('US-5 on the W3-early account (%s)', (_id, f) => {
  const state = stateOf(f);
  const r = goldenResult(input(state, f.now));

  it('the weakest is Cards (ahead of anvil points by row order); the Shaman Lv 54 first in Visit Order', () => {
    const g = behindOf(r);
    expect(g?.title).toBe('Behind for your Stage: Cards');
    expect(g?.nextAction.text).toBe('Shaman Lv 54: Equip 4 cards in your empty card slots');
    expect(g?.nextAction.why).toContain('Equip Slime, Bored Bean, Mimic and Sand Castle: ');
    expect(g?.details).toEqual([
      { subject: 'c1', text: 'Squire Lv 51: Equip 1 card in your empty card slots' },
    ]);
    expect(fixGoals(r, 'cards.check.empty-slots')).toEqual([]);
    // Anvil points stay where they were.
    expect(fixGoals(r, 'anvil.check.spend-points')).toHaveLength(1);
  });

  it('with every card slot filled, the weakest is Anvil points (M6 account line, details kept)', () => {
    const x = runWithout(state, f.now, 'cards.check.empty-slots');
    const g = behindOf(x);
    expect(g?.title).toBe('Behind for your Stage: Anvil');
    expect(g?.nextAction.text).toBe('Unspent anvil points on Bowman Lv 60 → Speed');
    expect(g?.details).toEqual([{ subject: 'c2', text: 'Bowman Lv 60: 3 into Speed, 0 into Capacity' }]);
    expect(fixGoals(x, 'anvil.check.spend-points')).toEqual([]);
  });

  it('a new level-1 character changes nothing (FR-26 level filter)', () => {
    const base = state.characters.find((c) => c.level === 54) as AccountState['characters'][number];
    const fresh = { ...structuredClone(base), index: 6, level: 1 };
    const s: AccountState = { ...state, characters: [...state.characters, fresh] };
    const g = behindOf(goldenResult(input(s, f.now)));
    expect(g?.title).toBe('Behind for your Stage: Cards');
    // The new character's own findings never count and never lead (M8 may still merge its card line with
    // an older character's into one account line, which then moves as a whole).
    expect(g?.nextAction.key.endsWith('@c6')).toBe(false);
    expect(g?.details?.some((d) => d.subject === 'c6')).toBe(false);
  });

  it('every Behind Goal stays inside the Account section render, behind "show more" when past the cap', () => {
    // US-5: the Thens assert EngineResult rank; M10's Account cap decides what is visible.
    const view = buildNowView(r, EMPTY_PREFS, { ...DEFAULT_UI, now: f.now });
    const rank = r.account.goals.filter((g) => g.category !== 'blocker').findIndex((g) => g.id === BEHIND_ID);
    expect(rank).toBeGreaterThanOrEqual(0);
    if (rank < view.account.goals.length)
      expect(view.account.goals.some((g) => JSON.stringify(g).includes('Behind for your Stage: Cards'))).toBe(
        true,
      );
    else expect(view.account.hiddenCount).toBeGreaterThan(0);
  });
});

describe.each(fixtures.map((f) => [f.id, f] as const))('P6 wording on %s', (_id, f) => {
  it('no Behind text names a tier, a rating, a score or a Stage label', () => {
    const g = behindOf(goldenResult(input(stateOf(f), f.now)));
    const text = `${g?.title ?? ''} ${g?.nextAction.why ?? ''}`;
    expect(text).not.toMatch(/\bTier\b|rated|score|World \d|W\d-(early|mid|late|entry)/i);
  });
});

describe('FR-31 and the unit rules of behindStep', () => {
  const goalFor = (entryId: string, subject: string, over: Partial<Goal['nextAction']> = {}): TaggedGoal => ({
    moduleId: 'm',
    goal: {
      id: entryId,
      title: 't',
      system: entryId.split('.')[0] as string,
      category: 'compounding',
      nextAction: {
        key: `${entryId}@${subject}`,
        entryId,
        text: `${entryId} text`,
        why: 'fix why',
        sources: [],
        stale: false,
        contested: null,
        confidence: 'H',
        provenance: { entryIds: [entryId], fields: [] },
        ...over,
      },
      milestone: null,
    },
  });
  const base = (goals: TaggedGoal[], level = 50) => ({
    kb: facts,
    stage: 'W3-early' as const,
    list: EMPTY_PRIORITY_LIST,
    characters: [{ index: 0, level, label: 'Squire Lv 50', goals }],
    account: [],
    visitOrder: [0],
    newCharacters: new Set<number>(),
    unknownEntries: new Set<string>(),
  });

  it('picks the earliest row; skips a Contested or Stale fix and uses the next-weakest', () => {
    const cards = goalFor('cards.check.empty-slots', 'c0');
    const stamps = goalFor('stamps.check.shop-now', 'c0');
    expect(behindStep(base([cards, stamps]))?.row.id).toBe('cards-slots-filled');
    const contested = goalFor('cards.check.empty-slots', 'c0', { contested: { sides: [] } });
    expect(behindStep(base([contested, stamps]))?.row.id).toBe('stamps-town-shops');
    const stale = goalFor('cards.check.empty-slots', 'c0', { stale: true });
    expect(behindStep(base([stale]))).toBeNull();
  });

  it('a `when` row counts only findings whose Detector slot matches (F2 on the 3D Printer)', () => {
    const late = (goals: TaggedGoal[]) => ({ ...base(goals), stage: 'W3-late' as const });
    const build = (building: string): TaggedGoal => ({
      ...goalFor('construction.check.build-next', 'account'),
      slots: { building },
    });
    const i = { ...late([]), characters: [], account: [build('3D_Printer')] };
    expect(behindStep(i)?.row.id).toBe('printer-per-character');
    expect(behindStep({ ...i, account: [build('Salt_Lick')] })).toBeNull();
    const auto = goalFor('refinery.check.auto-refine-off', 'account');
    expect(behindStep({ ...i, account: [build('Salt_Lick'), auto] })?.row.id).toBe('auto-refine');
  });

  it('an unknown fix (its Detector failed) is skipped, never read as met', () => {
    const i = {
      ...base([goalFor('cards.check.empty-slots', 'c0')]),
      unknownEntries: new Set(['cards.check.empty-slots']),
    };
    expect(behindStep(i)).toBeNull();
  });

  it('characters below level 30 or new this session never count', () => {
    expect(behindStep(base([goalFor('cards.check.empty-slots', 'c0')], 12))).toBeNull();
    const i = { ...base([goalFor('cards.check.empty-slots', 'c0')]), newCharacters: new Set([0]) };
    expect(behindStep(i)).toBeNull();
  });

  it('with no behind row, no Goal and no "on track" line', () => {
    expect(behindStep(base([goalFor('refinery.check.salt-off', 'c0')]))).toBeNull();
  });

  it('newThisSession: a character absent from the last save before the session is new', () => {
    const f = w3[0];
    if (!f) throw new Error('scrubbed-w3 missing');
    const s = stateOf(f);
    const before = { ...s, characters: s.characters.slice(0, -1) };
    const history: EngineHistory = {
      entries: [{ lastCloudSave: 1, receivedAt: 1, state: before }],
      sessionStartedAt: 2,
      learnedExpectedReturnSeconds: null,
    };
    const last = s.characters[s.characters.length - 1]?.index as number;
    expect([...newThisSession(history, s)]).toEqual([last]);
    expect([...newThisSession({ ...history, sessionStartedAt: null }, s)]).toEqual([]);
  });
});
