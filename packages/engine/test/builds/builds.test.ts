// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9 Builds (docs/specs/M9-builds.md): the user stories' Given/When/Then on the scrubbed W2-late and
// W3-early accounts (the spec's two fixture accounts, without names) and on synthetic edits of them.
import { withCharacter } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { runEngine } from '../../src';
import { createAfkSafetyModule, toModuleOutput } from '../../src/afk';
import {
  analyzeAccount,
  createBuildsModule,
  levelUpSignal,
  lowerBound,
  NOT_COVERED,
  tagged,
} from '../../src/builds';
import { lookupOf } from '../../src/metapath/knowledge';
import { charOf, evaluate, registry, W2, W3 } from '../afk/helpers';
import { input, publicState } from '../core/helpers';
import { goalOf, goalsOf, kb, m9, run, setBar, setTalent, swapPresets, TALENT, withItems } from './helpers';

const facts = lookupOf(kb);
const m9Blockers = (s: Parameters<typeof evaluate>[0]) =>
  evaluate(s).characters.map((c) =>
    c.findings
      .filter((f) => f.role === 'blocker' && /^(talent-presets|talents)\./.test(f.entryId))
      .map((f) => f.nextAction.text),
  );

describe('TR-6 preset classification', () => {
  it('pins the 17 classifiable presets of the two fixture accounts (and the empty and incomplete ones)', () => {
    const roles = (s: Parameters<typeof analyzeAccount>[0]) =>
      [...analyzeAccount(s, facts).characters.values()].map((a) => [a.active.cls, a.other?.cls ?? null]);
    expect(roles(W2())).toEqual([
      ['fighting', 'empty'],
      ['skilling', 'fighting'],
      ['fighting', 'skilling'],
      ['fighting', 'empty'],
      ['fighting', 'empty'],
    ]);
    expect(roles(W3())).toEqual([
      ['fighting', 'skilling'],
      ['skilling', 'fighting'],
      ['skilling', 'fighting'],
      ['fighting', 'empty'],
      ['fighting', 'skilling'],
      ['fighting', 'incomplete'],
    ]);
  });
});

describe('US-1 wrong preset before I leave', () => {
  it('W3-early: the Bowman Lv 60 and the fishing Barbarian Lv 56 get the blocker, through M3', () => {
    expect(m9Blockers(W3())).toEqual([
      [],
      [],
      ['Swap to your fighting preset before you leave'],
      [],
      ['Swap to your skilling preset before you leave'],
      [],
    ]);
    const out = toModuleOutput(evaluate(W3()), kb);
    expect(out.characters?.[2]?.verdict?.kind).toBe('fix');
    expect(out.characters?.[2]?.verdict?.blockerKeys).toContain('talent-presets.check.wrong-preset@c2');
  });

  it('FR-6: no other M9 Goal shows on those two characters', () => {
    const out = run(W3());
    expect(goalsOf(out, 2)).toEqual([]);
    expect(goalsOf(out, 4)).toEqual([]);
  });

  it('W2-late: no M9 blocker', () => {
    expect(m9Blockers(W2()).flat()).toEqual([]);
  });

  it("after the swap is saved, the blocker is gone and the character's Goals come back", () => {
    const swapped = swapPresets(W3(), 2);
    expect(m9Blockers(swapped)[2]).toEqual([]);
    expect(goalsOf(run(swapped), 2).length).toBeGreaterThan(0);
  });

  it('FR-5: an unclassified active preset never blocks', () => {
    // The Bowman's skilling preset with a big pile of fighting points becomes a hybrid.
    const base = analyzeAccount(W3(), facts).characters.get(2);
    if (!base) throw new Error('fixture');
    const skillingPoints = tagged(base.active.talents, base.builds.skilling);
    const s = setTalent(W3(), 2, 'active', TALENT.GILDED_SWORD, skillingPoints);
    const a = analyzeAccount(s, facts).characters.get(2);
    expect(a?.active.cls).toBe('unclassified');
    expect(m9Blockers(s)[2]).toEqual([]);
  });
});

describe('US-2 set up the empty second preset', () => {
  it('W2-late: three fighters with an empty second preset, with the first steps, the points and the swap back', () => {
    const out = run(W2());
    expect(goalOf(out, 0, 'talent-presets.check.empty')?.goal.nextAction.text).toBe(
      'Set up your second preset for skilling: start with Brute Efficiency, Idle Skilling. At least 640 points are waiting, then swap back to your fighting preset',
    );
    expect(goalOf(out, 3, 'talent-presets.check.empty')?.goal.nextAction.text).toBe(
      'Set up your second preset for skilling: start with Elusive Efficiency, Quickness Boots. At least 575 points are waiting, then swap back to your fighting preset',
    );
    expect(goalOf(out, 4, 'talent-presets.check.empty')?.goal.nextAction.text).toBe(
      "Set up your second preset for skilling: start with Smart Efficiency, Active AFK'er. At least 592 points are waiting, then swap back to your fighting preset",
    );
    expect(goalOf(out, 0, 'talent-presets.check.empty')?.goal.title).toBe('Talent presets');
  });

  it('W3-early: the Squire Lv 85 is empty (at least 1,020) and the Shaman Lv 54 incomplete (at least 383)', () => {
    const out = run(W3());
    expect(goalOf(out, 3, 'talent-presets.check.empty')?.goal.nextAction.text).toContain(
      'At least 1,020 points are waiting',
    );
    expect(goalOf(out, 5, 'talent-presets.check.incomplete')?.goal.nextAction.text).toMatch(
      /^Finish your skilling preset: .*At least 383 points are waiting, then swap back to your fighting preset$/,
    );
  });

  it('FR-2: a character below Lv 15 gets no preset Goal', () => {
    const s = withCharacter(W2(), 3, { level: 14 });
    const titles = goalsOf(run(s), 3).map(([title]) => title);
    expect(titles).not.toContain('Talent presets');
  });
});

describe('US-3 points left behind on the other preset', () => {
  it('W2-late: the Shaman Lv 44 (118) and the Squire Lv 43 (17)', () => {
    const out = run(W2());
    expect(goalOf(out, 2, 'talent-presets.check.behind')?.goal.nextAction.text).toMatch(
      /^Spend at least 118 talent points on your skilling preset/,
    );
    expect(goalOf(out, 1, 'talent-presets.check.behind')?.goal.nextAction.text).toMatch(
      /^Spend at least 17 talent points on your fighting preset/,
    );
  });

  it('W3-early: the Wizard Lv 73 (215) and the Squire Lv 51 (115, all in the Squire tab, Refinery Throttle first)', () => {
    const out = run(W3());
    expect(goalOf(out, 0, 'talent-presets.check.behind')?.goal.nextAction.text).toMatch(/at least 215 /);
    expect(goalOf(out, 1, 'talent-presets.check.behind')?.goal.nextAction.text).toBe(
      'Spend at least 115 talent points on your skilling preset (Squire), starting with Refinery Throttle',
    );
    // The Barbarian Lv 56's 148 is suppressed by its wrong-preset blocker.
    expect(goalOf(out, 4, 'talent-presets.check.behind')).toBeUndefined();
    expect(analyzeAccount(W3(), facts).characters.get(4)?.other?.lb?.total).toBe(148);
  });

  it('equal presets leave nothing behind', () => {
    const s = W2();
    const t = s.characters[1]?.talents;
    if (!t?.other) throw new Error('fixture');
    const same = withCharacter(s, 1, { talents: { ...t, other: t.active } });
    expect(goalOf(run(same), 1, 'talent-presets.check.behind')).toBeUndefined();
  });

  it('TR-7 contract: the Squire Lv 51 tab 2 (244 and 248, Back To Basics 0 and 4) gives exactly 0', () => {
    const a = analyzeAccount(W3(), facts).characters.get(1);
    if (!a?.other) throw new Error('fixture');
    const granting = analyzeAccount(W3(), facts).kb.talents.tab2Granting;
    expect(lowerBound(a.active.talents, a.other.talents, 2, granting)).toBe(0);
    expect(a.active.lb?.byTab).toEqual({ 1: 0, 2: 0, 3: 115 });
  });
});

describe('US-4 the core talent I missed', () => {
  it('W2-late: the Idle fighting talent to 50 on the Barbarian, Shaman and Wizard, and Idle Shooting 13 -> 50 on the Bowman', () => {
    const out = run(W2());
    const next = (i: number) => goalOf(out, i, 'talents.check.next-step');
    expect(next(0)?.goal.nextAction.text).toBe('Next talent points: Idle Brawling to 50');
    expect(next(2)?.goal.nextAction.text).toBe('Next talent points: Idle Casting to 50');
    expect(next(4)?.goal.nextAction.text).toBe('Next talent points: Idle Casting to 50');
    expect(next(3)?.goal.nextAction.text).toBe('Next talent points: Idle Shooting to 50');
    expect(next(3)?.goal.nextAction.why).toContain('is at 13');
    expect(next(3)?.goal.category).toBe('compounding');
  });

  it("FR-11: the mining Squire Lv 43's core step is on its inactive fighting preset", () => {
    expect(goalOf(run(W2()), 1, 'talents.check.next-step')?.goal.nextAction.text).toBe(
      'Next talent points: Idle Brawling to 50 on your fighting preset',
    );
  });

  it('W3-early: Idle Casting on the Wizard and the Shaman; the Squire Lv 51 only has tab 3 points', () => {
    const out = run(W3());
    expect(goalOf(out, 0, 'talents.check.next-step')?.goal.nextAction.text).toBe(
      'Next talent points: Idle Casting to 50',
    );
    expect(goalOf(out, 5, 'talents.check.next-step')?.goal.nextAction.text).toBe(
      'Next talent points: Idle Casting to 50',
    );
    // R5 QA P2-1: points are per tab. The Squire Lv 51's 115 waiting points are all in tab 3, so its
    // next step is Refinery Throttle (tab 3, not core: D6 keeps it to the preset Goal), never Big Pick.
    expect(goalOf(out, 1, 'talents.check.next-step')).toBeUndefined();
    expect(goalOf(out, 1, 'talent-presets.check.behind')?.goal.nextAction.text).toMatch(
      /starting with Refinery Throttle$/,
    );
  });

  it('RT1: a core step sits at position 3 only while its tab has points left behind', () => {
    // The Squire Lv 43's fighting preset is 9 behind on tab 1: position 3.
    expect(goalOf(run(W2()), 1, 'talents.check.next-step')?.rank).toEqual({ framePosition: 3 });
    // The Barbarian Lv 60's other preset is empty, so its own tab 1 has nothing behind: the bottom.
    expect(goalOf(run(W2()), 0, 'talents.check.next-step')?.rank).toMatchObject({ atLastPosition: true });
  });

  it('D6: a non-core step shows only after a level-up with no spend since', () => {
    // The Squire Lv 85's next step is not core: without history it never shows.
    expect(goalOf(run(W3()), 3, 'talents.check.next-step')).toBeUndefined();
    const now = W3();
    const before = withCharacter(now, 3, { level: 84 });
    const history = {
      entries: [{ lastCloudSave: 1, receivedAt: 1, state: before }],
      sessionStartedAt: 2,
      learnedExpectedReturnSeconds: null,
    };
    expect(levelUpSignal(now, history, 3, 0)).toBe(true);
    const g = goalOf(run(now, { history }), 3, 'talents.check.next-step');
    expect(g?.goal.category).toBe('compounding');
    expect(g?.rank).toMatchObject({ atLastPosition: true });
  });
});

describe('US-5 attacks on the bar', () => {
  it('W2-late: no attack-bar or skill-attack Goal', () => {
    const out = run(W2());
    for (const c of out.characters ?? [])
      expect(
        (c.goals ?? []).filter((g) => /attack-bar|skill-attack/.test(g.goal.nextAction.entryId)),
      ).toEqual([]);
  });

  it('D1: 0 attacks on an AFK fighter with attacks levelled is a blocker naming them', () => {
    const s = setBar(W2(), 0, [TALENT.FIRMLY_GRASP_IT]);
    const c = charOf(evaluate(s), 0);
    expect(c.safety).toBe('unsafe');
    expect(c.findings.find((f) => f.entryId === 'talents.check.attack-bar')?.nextAction.text).toBe(
      'Put your attacks on the bar before you leave: Power Strike, Whirl, Bear Swipe, Axe Hurl',
    );
  });

  it('D1: exactly 1 attack is a compounding Goal, never a blocker', () => {
    const s = setBar(W2(), 0, [TALENT.POWER_STRIKE, TALENT.FIRMLY_GRASP_IT]);
    expect(charOf(evaluate(s), 0).findings.some((f) => f.entryId === 'talents.check.attack-bar')).toBe(false);
    const g = goalOf(run(s), 0, 'talents.check.attack-bar');
    expect(g?.goal.category).toBe('compounding');
    expect(g?.goal.nextAction.text).toBe(
      'Put more attacks on the bar: only one is on it, and Whirl, Bear Swipe, Axe Hurl are levelled on this preset',
    );
  });

  it('0 attacks with none levelled is the "level an attack" Goal, not a blocker (M3 FR-7 b)', () => {
    let s = setBar(W2(), 0, []);
    for (const id of [TALENT.POWER_STRIKE, TALENT.WHIRL, 105, 106]) s = setTalent(s, 0, 'active', id, 0);
    expect(charOf(evaluate(s), 0).findings.some((f) => f.entryId === 'talents.check.attack-bar')).toBe(false);
    expect(goalOf(run(s), 0, 'talents.check.attack-bar')?.goal.nextAction.text).toBe(
      'Level an attack and put it on the bar',
    );
  });

  it('FR-14: a mining Squire without Big Pick on its bar', () => {
    const s = setBar(W2(), 1, []);
    expect(goalOf(run(s), 1, 'talents.check.skill-attack')?.goal.nextAction.text).toBe(
      'Put Big Pick on the bar: it only helps Mining while it is there',
    );
  });
});

describe('US-6 when to use a reset potion', () => {
  it('neither fixture account gets a reset', () => {
    for (const s of [W2(), W3()])
      for (const c of run(s).characters ?? [])
        expect((c.goals ?? []).some((g) => g.goal.nextAction.entryId === 'talent-resets.check.reset')).toBe(
          false,
        );
  });

  const squire = () => {
    let s = setTalent(W2(), 1, 'active', TALENT.GILDED_SWORD, 30);
    s = setTalent(s, 1, 'active', TALENT.MEAT_SHANK, 15);
    return s;
  };

  it('a skilling preset with 45 points in Gilded Sword and Meat Shank, and 1 potion: the reset, in order', () => {
    const g = goalOf(run(withItems(squire(), 1, 0)), 1, 'talent-resets.check.reset');
    expect(g?.goal.title).toBe('Talents');
    // The in-game check names a talent this preset has well above the other preset (FR-16).
    expect(g?.goal.nextAction.text).toMatch(
      /^Reset your skilling preset with a Talent Point Reset Potion \(you have 1\): check it shows [A-Z][\w' ]+ at \d+, use the potion, then spend from Brute Efficiency on$/,
    );
    expect(g?.goal.nextAction.why).toContain('45 points');
  });

  it('with only fragments, the title counts them and the steps add the combine', () => {
    const g = goalOf(run(withItems(squire(), 0, 12)), 1, 'talent-resets.check.reset');
    expect(g?.goal.nextAction.text).toMatch(/\(you have 12 fragments\): .*combine 10 fragments/);
  });

  it('on the other preset, the steps start with the swap', () => {
    const s = withItems(setTalent(W2(), 2, 'other', TALENT.GILDED_SWORD, 40), 1, 0);
    expect(goalOf(run(s), 2, 'talent-resets.check.reset')?.goal.nextAction.text).toMatch(
      /^Reset your skilling preset .*: swap to it, .*then swap back$/,
    );
  });

  it('FR-18: no potion and no fragments, no reset Goal', () => {
    expect(goalOf(run(withItems(squire(), 0, 9)), 1, 'talent-resets.check.reset')).toBeUndefined();
  });

  it('FR-22: a Stale Build never drives a reset', () => {
    const entry = kb.entries['talents.build.squire-skilling'];
    if (entry?.type !== 'build') throw new Error('kb');
    const staleKb = {
      ...kb,
      entries: {
        ...kb.entries,
        [entry.id]: {
          ...entry,
          stale: { flaggedAt: '2.3.540', reason: 'test', pr: 'https://example.com/1' },
        },
      },
    };
    const out = createBuildsModule({ kb: staleKb }).run(input(squire(), { now: squire().asOf }));
    expect(goalOf(out, 1, 'talent-resets.check.reset')).toBeUndefined();
  });
});

describe('US-7 what the advice is based on', () => {
  it("every Build-driven Next Action carries the Build's dated community Source and the entry ids", () => {
    const g = goalOf(run(W2()), 0, 'talents.check.next-step');
    const guide = g?.goal.nextAction.sources.find((s) => s.url.includes('id=ih5wAK'));
    expect(guide).toMatchObject({ tier: 3, verifiedOn: '2026-10-17', gameVersion: '2.3.531' });
    expect(g?.goal.nextAction.provenance.entryIds).toEqual([
      'talents.check.next-step',
      'talents.build.barbarian-fighting',
    ]);
    expect(g?.goal.nextAction.sources.some((s) => s.url.startsWith('https://idleon.wiki/'))).toBe(true);
  });

  it('a Hunter gets its transcribed Build, not Stale: Idle Shooting to 50 first', () => {
    let s = withCharacter(W2(), 3, { class: 'Hunter' });
    s = withItems(setTalent(s, 3, 'active', 273, 60), 5, 0);
    const out = run(s);
    const g = goalOf(out, 3, 'talents.check.next-step');
    expect(g?.goal.nextAction.text).toBe('Next talent points: Idle Shooting to 50');
    expect(g?.goal.nextAction.stale).toBe(false);
    expect(g?.goal.nextAction.sources.some((s) => s.url.includes('id=MDGrBz'))).toBe(true);
    expect(goalOf(out, 3, 'talent-resets.check.reset')).toBeUndefined();
  });
  it('highend (past World 4): no Detector throws, no M9 Goal or blocker, "talent builds past World 4"', () => {
    const s = publicState('highend.json');
    const out = m9.run(input(s));
    expect((out.characters ?? []).flatMap((c) => c.goals ?? [])).toEqual([]);
    expect(out.notCovered).toEqual([NOT_COVERED.beyond]);
    const r = evaluate(s);
    for (const c of r.characters)
      expect(c.findings.some((f) => /^(talent-presets|talents)\./.test(f.entryId))).toBe(false);
  });

  it('a 5-tab character parses: the classifier and the Build walk run on its tabs 1-3', () => {
    const s = publicState('highend.json');
    const five = s.characters.find((c) => (c.talents?.active.tabs.length ?? 0) >= 5);
    expect(five).toBeDefined();
    const a = analyzeAccount(withCharacter(s, five?.index ?? 0, {}), facts);
    expect(a.beyond).toBe(true);
  });

  it('every M9 Next Action text carries no character name and at most one talent level or point total', () => {
    for (const s of [W2(), W3()]) {
      const names = s.characters.map((c) => c.name);
      for (const c of run(s).characters ?? [])
        for (const g of c.goals ?? []) {
          const t = g.goal.nextAction.text;
          for (const n of names) expect(t.includes(n)).toBe(false);
          expect((t.match(/\d[\d,]*/g) ?? []).length).toBeLessThanOrEqual(1);
        }
    }
  });
});

describe('US-8 cannot read the save', () => {
  it("a character whose talents failed to read gets nothing from M9, and its Verdict is the other modules'", () => {
    const s = withCharacter(W3(), 2, { talents: null });
    expect(goalsOf(run(s), 2)).toEqual([]);
    expect(m9Blockers(s)[2]).toEqual([]);
    expect(charOf(evaluate(s), 2).safety).not.toBe('unknown');
  });
});

describe('FR-19 and FR-23', () => {
  it('at most one blocker and two Goals per character, the same on every run', () => {
    for (const s of [W2(), W3()]) {
      const a = run(s);
      const b = run(s);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      for (const c of a.characters ?? []) expect((c.goals ?? []).length).toBeLessThanOrEqual(2);
      for (const blockers of m9Blockers(s)) expect(blockers.length).toBeLessThanOrEqual(1);
    }
  });

  it('runs inside the engine with M3 and gives the W3 account two Fix Verdicts from talents', () => {
    const afk = createAfkSafetyModule({ kb, registry });
    const r = runEngine(input(W3(), { now: W3().asOf }), [afk, m9]);
    expect(
      r.characters.filter((c) => c.verdict.blockerKeys.some((k) => k.startsWith('talent-presets'))).length,
    ).toBe(2);
  });
});

describe('TR-12 performance', () => {
  it('all M9 Detectors on a fixture account well inside the budget (5 ms target, loose bound for CI)', () => {
    const s = W3();
    const t0 = performance.now();
    for (let i = 0; i < 20; i++) m9.run(input({ ...s }, { now: s.asOf }));
    expect((performance.now() - t0) / 20).toBeLessThan(25);
  });
});
