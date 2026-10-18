// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build view's roadmaps (docs/specs/M9-builds.md "Build view", owner request 2026-10-18) on the
// scrubbed W2-late and W3-early accounts, and on a synthetic Lv 15 Archer built from the W3 Bowman's tabs.
import type { AccountState, PresetTalents } from '@idleon-forge/account-state';
import { withCharacter } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { buildRoadmaps } from '../../src/builds';
import { lookupOf } from '../../src/metapath/knowledge';
import type { BuildRoadmap } from '../../src/result';
import { W2, W3 } from '../afk/helpers';
import { boundOnly, kb, run } from './helpers';

const facts = lookupOf(kb);
// Lower-bound behaviour (M9 TR-7); the exact counts (ADR 0010) are tested on their own below.
const roadmaps = (s: AccountState) => buildRoadmaps(boundOnly(s), facts, { entries: kb.entries });
const roadmapsExact = (s: AccountState) => buildRoadmaps(s, facts, { entries: kb.entries });
const at = (list: BuildRoadmap[], index: number): BuildRoadmap => {
  const r = list.find((x) => x.index === index);
  if (!r) throw new Error(`no roadmap for ${index}`);
  return r;
};

const ID = { PIERCING_ARROW: 270, KUNG_FU_KICK: 271, HIGH_POLYMER_LIMBS: 277 } as const;

/** W3-early with a Lv 15 Archer in slot 5 (tabs 1 and 2 of the Bowman, a few points in tab 2). */
function withArcher(): AccountState {
  const s = W3();
  const bow = s.characters.find((c) => c.index === 2)?.talents;
  if (!bow) throw new Error('fixture');
  const levels: Record<number, number> = {
    [ID.PIERCING_ARROW]: 1,
    [ID.KUNG_FU_KICK]: 1,
    [ID.HIGH_POLYMER_LIMBS]: 3,
  };
  const fresh = (p: PresetTalents, withPoints: boolean): PresetTalents => ({
    ...p,
    tabs: p.tabs
      .filter((t) => t.tab <= 2)
      .map((t) => ({
        ...t,
        talents: t.talents.map((x) => ({ ...x, base: withPoints ? (levels[x.id] ?? 0) : 0 })),
      })),
    attackBar: withPoints ? [ID.PIERCING_ARROW, ID.KUNG_FU_KICK] : [],
  });
  return withCharacter(s, 5, {
    class: 'Archer',
    classIndex: 19,
    level: 15,
    afkType: 'FIGHTING',
    talents: {
      ...bow,
      classIndex: 19,
      selectedPreset: 0,
      active: fresh(bow.active, true),
      other: fresh(bow.active, false),
    },
  });
}

describe('Build view roadmaps', () => {
  it('one roadmap per character, in save order, with a one-line status', () => {
    const list = roadmaps(W2());
    expect(list.map((r) => r.index)).toEqual([0, 1, 2, 3, 4]);
    expect(list.every((r) => r.status.length > 0)).toBe(true);
  });

  it('W2-late Shaman Lv 44: both presets side by side, 118 points waiting on the skilling preset', () => {
    const r = at(roadmaps(W2()), 2);
    expect(r.classLabel).toBe('Shaman');
    expect(r.presets.map((p) => [p.slot, p.heading, p.active])).toEqual([
      [0, 'Fighting preset', true],
      [1, 'Skilling preset', false],
    ]);
    const skilling = r.presets[1];
    expect(skilling?.unspent).toBe(118);
    expect(skilling?.tabs.slice(0, 3).map((t) => t.unspent)).toEqual([44, 40, 34]);
    expect(r.status).toBe('at least 118 points unspent on the skilling preset · next: Book of the Wise');
    // Each step takes no more than its tab has waiting (44 in tab 1).
    expect(skilling?.next.map((n) => n.text)).toEqual([
      'Put the next 44 points into Book of the Wise (to 60 of 100)',
      'Put the next 40 points into Leaf Thief (to 40 of 100)',
      'Put the next 34 points into Bubble Breakthrough (to 70 of 100)',
    ]);
    // No points are known on the fighting preset (a bound of 0 can't prove none wait): one line per
    // tab says where the next points go, never "no points waiting" (fix/build-points).
    expect(r.presets[0]?.next[0]?.text).toBe(
      'No unspent points known here; the next go into Idle Casting (to 50)',
    );
    // Every Build talent shows current / target, in the Build's step order.
    const tab1 = skilling?.tabs[0]?.rows.map((x) => `${x.label} ${x.current}/${x.target}`);
    expect(tab1).toEqual(['Smart Efficiency 100/100', 'Book of the Wise 16/100', "Active AFK'er 100/100"]);
  });

  it('W2-late Shaman: the class path and the elite class next', () => {
    const r = at(roadmaps(W2()), 2);
    expect(r.path.map((p) => `${p.label}:${p.state}`)).toEqual([
      'Beginner:done',
      'Mage:done',
      'Shaman:now',
      'Bubonic Conjuror:next',
      'Arcane Cultist:later',
    ]);
    expect(r.nextClass).toBe('Elite class: Bubonic Conjuror at Eliteus');
    expect(r.comingUp).toContain('Elite talent builds are not covered yet');
  });

  it('W2-late Barbarian: the empty preset reads as one status part, with the attack bar checked', () => {
    const r = at(roadmaps(W2()), 0);
    expect(r.status).toBe('Skilling preset empty: at least 640 points waiting · next: Brute Efficiency');
    expect(r.presets[1]?.roleText).toBe('Empty: set it up for skilling');
    expect(r.presets[0]?.attackBar?.text).toBe('Every attack the build wants is on the bar');
  });

  it('a Lv 15 Archer (future Hunter): the class path, High Polymer Limbs next in tab 2, tab 3 coming up', () => {
    const r = at(roadmaps(withArcher()), 5);
    expect(r.path.map((p) => `${p.label}:${p.state}`)).toEqual([
      'Beginner:done',
      'Archer:now',
      'Hunter:next',
      'Beast Master:later',
      ...r.path.slice(4).map((p) => `${p.label}:later`),
    ]);
    expect(r.nextClass).toBe('Next class: take Hunter at Speccius');
    // The fighting preset has spent more than the empty one in every tab: no points known waiting.
    const fighting = r.presets.find((p) => p.role === 'fighting');
    const tab2 = fighting?.next.filter((n) => n.tab === 2) ?? [];
    expect(tab2.map((n) => n.text)).toEqual([
      expect.stringMatching(/^No unspent points known here; the next go into High Polymer Limbs \(to \d+\)$/),
    ]);
    expect(r.comingUp).toContain('Taking Hunter opens the Hunter talent tab (tab 3)');
    expect(r.comingUp.some((l) => l.startsWith('Then the Hunter fighting build starts tab 3 with'))).toBe(
      true,
    );
    expect(r.quiet).toMatch(/Low-confidence build/);
    expect(r.sources.some((s) => s.url.startsWith('https://idleon.wiki/'))).toBe(true);
  });

  it('W3-early Squire Lv 51 (R5 QA P2-1): all 115 points wait in tab 3, so Refinery Throttle leads everywhere', () => {
    const s = W3();
    const r = at(roadmaps(s), 1);
    expect(r.status).toBe('at least 115 points unspent on the skilling preset · next: Refinery Throttle');
    const skilling = r.presets.find((p) => p.role === 'skilling');
    expect(skilling?.tabs.slice(0, 3).map((t) => t.unspent)).toEqual([0, 0, 115]);
    expect(skilling?.next.map((n) => n.text)).toEqual([
      'Put the next 100 points into Refinery Throttle (to 100)',
      'then 15 into Redox Rates (to 15 of 100)',
    ]);
    // No step in a tab with nothing to spend, and never more points than the tab has.
    for (const p of r.presets)
      for (const n of p.next) {
        const waiting = p.tabs.find((t) => t.tab === n.tab)?.unspent ?? 0;
        if (waiting === 0) expect(n.text).not.toMatch(/^(Put|then)/);
        expect(n.points).toBeLessThanOrEqual(waiting);
      }
    // The M9 Goal agrees.
    const goals = run(s).characters?.find((c) => c.index === 1)?.goals ?? [];
    const behind = goals.find((g) => g.goal.nextAction.entryId === 'talent-presets.check.behind');
    expect(behind?.goal.nextAction.why).toMatch(/starting with Refinery Throttle\./);
  });

  it('the overview, the Build view and the preset Goal name the same next talent on every save', () => {
    for (const s of [W2(), W3()]) {
      const out = run(s);
      for (const r of roadmaps(s)) {
        const lead = r.presets.reduce((m, p) => ((p.unspent ?? 0) > (m?.unspent ?? 0) ? p : m), r.presets[0]);
        if (!lead?.unspent || !lead.next[0]) continue;
        expect(r.status).toContain(`next: ${lead.next[0].label}`);
        const goals = out.characters?.find((c) => c.index === r.index)?.goals ?? [];
        const g = goals.find((x) => x.goal.nextAction.entryId === 'talent-presets.check.behind');
        if (g) expect(g.goal.nextAction.why).toContain(`starting with ${lead.next[0].label}`);
      }
    }
  });

  it('a character with no Build for its class shows plain levels and the note', () => {
    const s = withCharacter(W2(), 1, { class: 'Journeyman', classIndex: 2 });
    const r = at(roadmaps(s), 1);
    expect(r.note).toMatch(/^No build yet for this class/);
    expect(r.presets.length).toBeGreaterThan(0);
    expect(r.presets.every((p) => p.tabs.every((t) => t.rows.length === 0))).toBe(true);
    expect(r.presets.flatMap((p) => p.tabs.flatMap((t) => t.others)).length).toBeGreaterThan(0);
  });

  it('rides on the M9 module output, and is deterministic', () => {
    const a = run(W2()).builds;
    const b = run(W2()).builds;
    expect(a?.length).toBe(5);
    expect(a).toEqual(b);
  });
});

describe('Build view roadmaps with exact counts (ADR 0010)', () => {
  it('W3-early: where the save gives an exact count, no tab or status says "at least" for it', () => {
    for (const r of roadmapsExact(W3()))
      for (const p of r.presets)
        for (const t of p.tabs)
          if (t.known?.kind === 'exact') expect(t.known.points).toBeGreaterThanOrEqual(0);
    const exactly = roadmapsExact(W3()).filter((r) =>
      r.presets.every((p) => p.tabs.every((t) => t.tab > 3 || t.known?.kind === 'exact')),
    );
    for (const r of exactly) expect(r.status).not.toMatch(/at least/);
  });
});
