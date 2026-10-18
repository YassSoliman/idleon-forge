// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-C9 to FR-C15 (US-7): the Star Talent tab on every character and preset. Exact known points
// (FR-C10), the star Builds' spend order with ties and useful caps (FR-C11, FR-C12), the later band for
// a book not found (FR-C13), and the empty star tab as one account Goal (FR-C15, DS-25). Public and
// scrubbed fixtures only; characters are named by class and level.
import type { AccountState, PresetTalents } from '@idleon-forge/account-state';
import { listFixtures, stateOf } from '@idleon-forge/kb-tools/src/fixtures';
import { goldenContext } from '@idleon-forge/kb-tools/src/golden';
import { DEFAULT_EXPECTED_RETURN_MS, withCharacter } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { buildRoadmaps } from '../../src/builds';
import { buildsKnowledge } from '../../src/builds/knowledge';
import { STAR_TAB, starGroups, starKnown } from '../../src/builds/path';
import { starEmptyCharacters } from '../../src/builds/star';
import { goldenResult } from '../../src/golden';
import { lookupOf } from '../../src/metapath/knowledge';
import { buildOverviewLine, pathMarker, tabBadge } from '../../src/now/words/characters';
import type { BuildPresetView, BuildRoadmap, BuildTabView } from '../../src/result';
import { W2, W3 } from '../afk/helpers';
import { kb } from './helpers';

const facts = lookupOf(kb);
const roadmaps = (s: AccountState) => buildRoadmaps(s, facts, { entries: kb.entries });
const star = (p: BuildPresetView): BuildTabView => {
  if (!p.star) throw new Error('no star tab');
  return p.star;
};
const at = (list: BuildRoadmap[], index: number) => {
  const r = list.find((x) => x.index === index);
  if (!r) throw new Error(`no roadmap ${index}`);
  return r;
};
const p0: PresetTalents = { tabs: [], star: [], attackBar: null };
const withStar = (levels: Record<number, number>, max = 100): PresetTalents => ({
  ...p0,
  star: Object.entries(levels).map(([id, base]) => ({ id: Number(id), base, max })),
});

const ctx = await goldenContext();
const fixtures = listFixtures({ private: false });
const fixture = (id: string) => {
  const f = fixtures.find((x) => x.id === id);
  if (!f) throw new Error(`no fixture ${id}`);
  return f;
};
const engineOn = (id: string) => {
  const f = fixture(id);
  return goldenResult({
    state: stateOf(f),
    kb: ctx.kb,
    registries: ctx.registries,
    now: f.now,
    expectedReturnMs: DEFAULT_EXPECTED_RETURN_MS,
  });
};

describe('FR-C10: star known points are exact', () => {
  it('reads unspent as total − star levels, with the −2 to 1 tolerance and "about" over budget', () => {
    const p = withStar({ 620: 10, 621: 30 });
    expect(starKnown(80, p, null)).toEqual({ kind: 'exact', points: 40, overBy: null });
    expect(starKnown(41, p, null)).toEqual({ kind: 'exact', points: 0, overBy: null });
    expect(starKnown(38, p, null)).toEqual({ kind: 'exact', points: 0, overBy: null });
    expect(starKnown(37, p, null)).toEqual({ kind: 'exact', points: 0, overBy: 3 });
    const words = (total: number) =>
      tabBadge({ tab: STAR_TAB, unspent: null, known: starKnown(total, p, null) });
    expect([words(80), words(41), words(37), words(-161)]).toEqual([
      '40 unspent',
      'all spent',
      'over budget by about 3',
      'over budget by about 201',
    ]);
  });

  it('falls back to M9 TR-7 against the other preset, then to nothing known', () => {
    const p = withStar({ 620: 5 });
    expect(starKnown(null, p, withStar({ 620: 25 }))).toEqual({
      kind: 'lower-bound',
      points: 20,
      overBy: null,
    });
    expect(starKnown(null, p, null)).toEqual({ kind: 'none', points: null, overBy: null });
  });
});

describe('FR-C14: a star tile on every character and preset', () => {
  for (const [name, state] of [
    ['W2-late', W2()],
    ['W3-early', W3()],
  ] as const)
    it(`${name}: every preset has a star tab with a path in the star Build's order`, () => {
      for (const r of roadmaps(state))
        for (const p of r.presets) {
          const s = star(p);
          expect(s.tab).toBe(STAR_TAB);
          expect(s.name).toBe('Star talents');
          expect((s.path ?? []).length).toBeGreaterThan(0);
          // One pool: the running total climbs across pages, never resets per page.
          let last = 0;
          for (const step of s.path ?? [])
            if (step.cumulative !== null) {
              expect(step.cumulative).toBeGreaterThan(last);
              last = step.cumulative;
            }
          for (const step of s.path ?? []) expect(step.label).not.toMatch(/can't/i);
        }
    });

  it('a character below class Lv 15 still gets the star tab on its one preset', () => {
    const s = withCharacter(W3(), 5, { level: 9 });
    const r = at(roadmaps(s), 5);
    expect(r.presets.length).toBeGreaterThanOrEqual(1);
    for (const p of r.presets) expect(p.star).toBeTruthy();
  });
});

describe('FR-C11 to FR-C13: star Builds on the W3-early save', () => {
  const list = roadmaps(W3());

  it('Supersource only where the preset serves Mining, Choppin, Fishing or Catching (servesAny)', () => {
    // The Wizard Lv 73's skilling Build serves Choppin (its matched class Build), so the step stays, with
    // no condition words.
    const r = at(list, 0);
    const skilling = r.presets.find((p) => p.role === 'skilling') as BuildPresetView;
    const step = (star(skilling).path ?? []).find((s) => s.label === 'Supersource');
    expect(step).toBeTruthy();
    expect(step?.note ?? '').not.toMatch(/only helps/);
    // A preset that serves another skill drops it; an unknown one keeps it with the condition in words.
    const b = buildsKnowledge(facts).starBuild('skilling');
    if (!b) throw new Error('no star Build');
    const p = withStar({ 636: 0 });
    const sctx = { bestLevel: 80, bestBeginner: 0, stage: { stage: null, bubbleCapped: new Set<number>() } };
    const labels = (serves: string[] | null) =>
      starGroups(p, b, serves, sctx, buildsKnowledge(facts))
        .flat()
        .map((m) => [m.label, m.note]);
    expect(labels(['WORSHIP']).map(([l]) => l)).not.toContain('Supersource');
    expect(labels(null).find(([l]) => l === 'Supersource')?.[1]).toBe(
      'only helps Mining, Choppin, Fishing and Catching',
    );
  });

  it('no Beginner-line character: Beginner Best Class never takes points', () => {
    for (const r of list)
      for (const p of r.presets)
        for (const s of star(p).path ?? [])
          if (s.label === 'Beginner Best Class') expect(s.cumulative).toBeNull();
  });

  it('a skilling tie is one row, split evenly, with each member in the note', () => {
    const r = at(list, 1);
    const row = (star(r.presets.find((p) => p.role === 'skilling') as BuildPresetView).path ?? []).find((s) =>
      s.label.includes(' = '),
    );
    expect(row?.label).toBe('Tick Tock = Will of the Eldest');
    expect(row?.note).toMatch(/^split evenly: Tick Tock 0 → \d+, Will of the Eldest \d+ → 8/);
  });

  it('Will of the Eldest stops at its useful cap: floor(best level ÷ 10)', () => {
    const best = Math.max(...W3().characters.map((c) => c.level));
    for (const r of list)
      for (const p of r.presets)
        for (const s of star(p).path ?? [])
          if (s.label === 'Will of the Eldest') expect(s.goal).toBe(Math.floor(best / 10));
  });

  it('a book not found is "later", with where the book comes from, and outside the totals', () => {
    const r = at(list, 0);
    const stonks = (star(r.presets[0] as BuildPresetView).path ?? []).find((s) => s.talentId === 622);
    expect(stonks?.band).toBe('later');
    expect(stonks?.condition).toBe("find its book (Wellington's quest)");
    expect(stonks?.cumulative).toBeNull();
  });

  it('with Stonks! unlocked, an empty star preset starts at "Stonks! +30" and says it pays for itself', () => {
    const s = W2();
    const c = s.characters.find((x) => x.index === 0);
    const t = c?.talents;
    if (!t?.other) throw new Error('fixture');
    const unlock = (p: PresetTalents): PresetTalents => ({
      ...p,
      star: p.star.map((x) => (x.id === 622 ? { ...x, max: 100 } : x)),
    });
    const r = at(
      roadmaps(withCharacter(s, 0, { talents: { ...t, active: unlock(t.active), other: unlock(t.other) } })),
      0,
    );
    const empty = r.presets.find((p) => star(p).spent === 0) as BuildPresetView;
    const first = (star(empty).path ?? []).find((x) => x.cumulative !== null);
    expect(first?.label).toBe('Stonks!');
    expect(first?.cumulative).toBe(30);
    expect(first?.note).toMatch(/pays for itself/);
    expect(pathMarker(star(empty))).toMatch(/Stonks! returns more as it levels/);
  });
});

describe('FR-C6: the overview line', () => {
  it('names the lead tab, its known points and up to 4 next steps with running totals', () => {
    for (const r of roadmaps(W2())) {
      const line = buildOverviewLine(r);
      if (r.note) continue;
      expect(line).toMatch(/^Tab \d · /);
      expect((line.match(/ \+\d/g) ?? []).length).toBeGreaterThan(0);
    }
  });
});

describe('FR-C15 (Q2, DS-25): the empty star tab is ONE account Goal', () => {
  it('lists every character with one empty star preset and points waiting, exactly', () => {
    for (const f of fixtures) {
      const s = stateOf(f);
      for (const x of starEmptyCharacters(s)) {
        const c = s.characters.find((y) => y.index === x.index);
        expect(x.points).toBeGreaterThan(1);
        expect(c?.level ?? 0).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it('on W2-late it is one account Goal with a detail per character, never a character Goal', () => {
    const r = engineOn('scrubbed-w2');
    const list = starEmptyCharacters(stateOf(fixture('scrubbed-w2')));
    expect(list.length).toBe(5);
    const goals = r.account.goals.filter((g) => g.id === 'talent-presets.check.star-empty');
    expect(goals.length).toBe(1);
    expect(goals[0]?.nextAction.text).toBe('Spend your star points on the other preset too');
    expect(goals[0]?.details?.length).toBe(5);
    for (const c of r.characters)
      expect(c.goals.some((g) => g.id === 'talent-presets.check.star-empty')).toBe(false);
  });
});
