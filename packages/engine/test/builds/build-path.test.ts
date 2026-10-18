// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build path (hotfix fix/build-points; M21 FR-C1, FR-C2): every Build step of a tab, banded done /
// can add now / part now / next after these / later, with running totals. The regression case is the
// Release 9 report: a Hunter whose other preset is empty read "No points waiting in this tab" on tab 1
// while points were waiting in game. Synthetic Hunter, built from the W3-early Bowman's tabs (no names).
import type { AccountState, PresetTalents } from '@idleon-forge/account-state';
import { withCharacter } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { buildRoadmaps } from '../../src/builds';
import { lookupOf } from '../../src/metapath/knowledge';
import { pathMarker, tabBadge } from '../../src/now/words/characters';
import type { BuildPathStepView, BuildPresetView, BuildRoadmap } from '../../src/result';
import { W2, W3 } from '../afk/helpers';

import { boundOnly, kb } from './helpers';

const facts = lookupOf(kb);
// Lower-bound behaviour (M9 TR-7); the exact counts (ADR 0010) are tested on their own below.
const roadmaps = (s: AccountState) => buildRoadmaps(boundOnly(s), facts, { entries: kb.entries });
const roadmapsExact = (s: AccountState) => buildRoadmaps(s, facts, { entries: kb.entries });
const at = (list: BuildRoadmap[], index: number): BuildRoadmap => {
  const r = list.find((x) => x.index === index);
  if (!r) throw new Error(`no roadmap for ${index}`);
  return r;
};

const ID = {
  HEALTH_BOOSTER: 0,
  MANA_BOOSTER: 1,
  SHARPENED_AXE: 5,
  GILDED_SWORD: 6,
  IDLE_SHOOTING: 268,
} as const;

/** W3-early with a Lv 61 Hunter in slot 6: tab 1 at the given levels; the other preset as given. */
function hunter(active: Record<number, number>, other: Record<number, number> | 'empty'): AccountState {
  const s = W3();
  const bow = s.characters.find((c) => c.index === 2)?.talents;
  if (!bow) throw new Error('fixture');
  const set = (p: PresetTalents, levels: Record<number, number>): PresetTalents => ({
    ...p,
    tabs: p.tabs
      .filter((t) => t.tab <= 3)
      .map((t) => ({ ...t, talents: t.talents.map((x) => ({ ...x, base: levels[x.id] ?? 0 })) })),
  });
  return withCharacter(s, 5, {
    class: 'Hunter',
    classIndex: 21,
    level: 61,
    afkType: 'FIGHTING',
    talents: {
      ...bow,
      classIndex: 21,
      selectedPreset: 0,
      active: set(bow.active, active),
      other: set(bow.active, other === 'empty' ? {} : other),
    },
  });
}

const OWNER_TAB1 = { [ID.GILDED_SWORD]: 100, [ID.SHARPENED_AXE]: 100, [ID.IDLE_SHOOTING]: 50 };

const fightingOf = (r: BuildRoadmap): BuildPresetView => {
  const p = r.presets.find((x) => x.role === 'fighting');
  if (!p) throw new Error('no fighting preset');
  return p;
};
const tab = (p: BuildPresetView, n: number) => {
  const t = p.tabs.find((x) => x.tab === n);
  if (!t) throw new Error(`no tab ${n}`);
  return t;
};
const line = (s: BuildPathStepView) =>
  `${s.band} ${s.label} ${s.current}->${s.goal}${s.cumulative === null ? '' : ` +${s.cumulative}`}${
    s.partNow === null ? '' : ` (${s.partNow} now)`
  }`;

describe('Build path: the Release 9 Hunter report (fix/build-points)', () => {
  it('a bound of 0 never reads "No points waiting": no points are known, and the totals run on', () => {
    const r = at(roadmaps(hunter(OWNER_TAB1, 'empty')), 5);
    const f = fightingOf(r);
    const t1 = tab(f, 1);
    expect(t1.known).toEqual({ kind: 'lower-bound', points: 0, overBy: null });
    for (const p of r.presets) for (const n of p.next) expect(n.text).not.toMatch(/No points waiting/);
    const path = t1.path ?? [];
    // Every applicable step of tab 1, in M9's spend order (core first, then the Build's order).
    expect(path.map((s) => s.label)).toEqual([
      'Idle Shooting',
      'Gilded Sword',
      'Sharpened Axe',
      'Idle Shooting',
      'Mana Booster',
      'Fist of Rage',
      // A tie is one row (M21 FR-C11): its need is the members' sum, split evenly.
      'Health Booster = Quickness Boots',
    ]);
    expect(path.slice(0, 4).map(line)).toEqual([
      'done Idle Shooting 50->50',
      'done Gilded Sword 100->100',
      'done Sharpened Axe 100->100',
      'next Idle Shooting 50->100 +50',
    ]);
    // No "can add now" band without known points; every unmet step is "next" with a running total.
    expect(path.some((s) => s.band === 'now' || s.band === 'part')).toBe(false);
    let total = 0;
    for (const s of path.filter((x) => x.band === 'next')) {
      total += s.need;
      expect(s.cumulative).toBe(total);
    }
    // The empty skilling preset has the whole fighting spend known as waiting.
    const skilling = r.presets.find((x) => x.role === 'skilling');
    expect(tab(skilling as BuildPresetView, 1).known?.points).toBe(250);
  });

  it('a talent already at its target is done, and never the next step', () => {
    const levels = { ...OWNER_TAB1, [ID.IDLE_SHOOTING]: 100 };
    const r = at(roadmaps(hunter(levels, 'empty')), 5);
    const f = fightingOf(r);
    const path = tab(f, 1).path ?? [];
    for (const s of path.filter((x) => x.label === 'Idle Shooting')) expect(s.band).toBe('done');
    expect(f.next.some((n) => n.label === 'Idle Shooting')).toBe(false);
    expect(r.status).not.toMatch(/next: Idle Shooting/);
    expect(path.find((s) => s.band !== 'done')?.label).toBe('Mana Booster');
  });

  it('points the save shows as waiting read as "can add now", then "part now", then "next"', () => {
    // The other preset spent 70 more in tab 1, so at least 70 wait on the fighting preset.
    const other = { ...OWNER_TAB1, [ID.IDLE_SHOOTING]: 100, [ID.HEALTH_BOOSTER]: 20 };
    const r = at(roadmaps(hunter(OWNER_TAB1, other)), 5);
    const f = r.presets.find((p) => p.active) as BuildPresetView;
    const t1 = tab(f, 1);
    expect(t1.known).toEqual({ kind: 'lower-bound', points: 70, overBy: null });
    const path = (t1.path ?? []).filter((s) => s.band !== 'done');
    expect(path[0] && line(path[0])).toBe('now Idle Shooting 50->100 +50');
    expect(path[1]?.band).toBe('part');
    expect(path[1]?.partNow).toBe(20);
    expect(path.slice(2).every((s) => s.band === 'next' || s.band === 'later')).toBe(true);
    // The one-line "next points" agrees: 50 into Idle Shooting, then 20 into the next talent.
    expect(f.next.filter((n) => n.tab === 1).map((n) => n.points)).toEqual([50, 20]);
    // M22: each line names its talent and target, so the truth checks never parse the text.
    expect(f.next[0]).toMatchObject({ talentId: ID.IDLE_SHOOTING, to: 100 });
  });
});

describe('Build path with exact counts (ADR 0010, #125)', () => {
  const exact = (s: AccountState, byTab: Record<1 | 2 | 3, number>, verified: boolean): AccountState => {
    const c = s.characters.find((x) => x.index === 5);
    const t = c?.talents;
    if (!t) throw new Error('fixture');
    const points = Object.fromEntries(
      ([1, 2, 3] as const).map((k) => [
        k,
        {
          total: 0,
          spent: 0,
          unspent: byTab[k],
          confidence: verified ? 'exact-verified' : 'exact',
          formula: null,
          oracle: null,
        },
      ]),
    );
    return withCharacter(s, 5, { talents: { ...t, active: { ...t.active, talentPoints: points } } });
  };

  it('an exact count replaces the lower bound: "70 points waiting", and the path bands by it', () => {
    const r = at(roadmapsExact(exact(hunter(OWNER_TAB1, 'empty'), { 1: 70, 2: 0, 3: 0 }, true)), 5);
    const f = r.presets.find((p) => p.active) as BuildPresetView;
    const t1 = tab(f, 1);
    expect(t1.known).toEqual({ kind: 'exact', points: 70, overBy: null, verified: true });
    expect(pathMarker(t1)).toBe('70 points waiting · they end here');
    expect(tabBadge(t1)).toBe('70 points');
    expect((t1.path ?? []).some((s) => s.band === 'now')).toBe(true);
  });

  it('an exact 0 says the tab is all spent (never "no points waiting")', () => {
    const r = at(roadmapsExact(exact(hunter(OWNER_TAB1, 'empty'), { 1: 0, 2: 0, 3: 0 }, false)), 5);
    const f = r.presets.find((p) => p.active) as BuildPresetView;
    const t1 = tab(f, 1);
    expect(t1.known).toEqual({ kind: 'exact', points: 0, overBy: null, verified: false });
    expect(pathMarker(t1)).toBe('All spent: the totals show where new points go');
    for (const n of f.next) expect(n.text).toMatch(/^All spent here; the next go into /);
  });
});

describe('Build path on the scrubbed saves', () => {
  it('W2-late Shaman skilling preset, tab 1: 44 known points land in Book of the Wise', () => {
    const r = at(roadmaps(W2()), 2);
    const skilling = r.presets[1] as BuildPresetView;
    const path = tab(skilling, 1).path ?? [];
    expect(path.map(line)).toEqual([
      'done Smart Efficiency 100->100',
      'part Book of the Wise 16->100 +84 (44 now)',
      "done Active AFK'er 100->100",
    ]);
  });

  it('every tab of every preset with a Build has a path; totals never borrow another tab', () => {
    for (const s of [W2(), W3()])
      for (const r of roadmaps(s))
        for (const p of r.presets) {
          if (!p.buildTitle) continue;
          for (const t of p.tabs.filter((x) => x.tab <= 3 && x.rows.length > 0)) {
            const path = t.path ?? [];
            expect(path.length).toBeGreaterThan(0);
            const known = t.known?.points ?? 0;
            let total = 0;
            for (const x of path) {
              if (x.band === 'done' || x.band === 'later') {
                expect(x.cumulative).toBeNull();
                continue;
              }
              total += x.need;
              expect(x.cumulative).toBe(total);
              if (x.band === 'now') expect(total).toBeLessThanOrEqual(known);
              if (x.band === 'next') expect(total - x.need).toBeGreaterThanOrEqual(known);
            }
            // A step at its goal is never anything but done.
            for (const x of path) if (x.need === 0 && x.band !== 'later') expect(x.band).toBe('done');
          }
        }
  });
});
