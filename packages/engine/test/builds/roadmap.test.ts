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
import { kb, run } from './helpers';

const facts = lookupOf(kb);
const roadmaps = (s: AccountState) => buildRoadmaps(s, facts, { entries: kb.entries });
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
    expect(r.status).toBe('118+ unspent on the skilling preset · next: Book of the Wise');
    expect(skilling?.next[0]?.text).toBe('Put the next 84 points into Book of the Wise (to 100)');
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
    expect(r.status).toBe('Skilling preset empty: 640+ points waiting · next: Brute Efficiency');
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
    const fighting = r.presets.find((p) => p.role === 'fighting');
    const tab2 = fighting?.next.filter((n) => n.tab === 2) ?? [];
    expect(tab2[0]?.text).toMatch(/^Put the next [\d,]+ points into High Polymer Limbs \(to \d+\)$/);
    expect(tab2[1]?.text).toMatch(/^then [\d,]+ into Veins of the Infernal/);
    expect(r.comingUp).toContain('Taking Hunter opens the Hunter talent tab (tab 3)');
    expect(r.comingUp.some((l) => l.startsWith('Then the Hunter fighting build starts tab 3 with'))).toBe(
      true,
    );
    expect(r.quiet).toMatch(/Low-confidence build/);
    expect(r.sources.some((s) => s.url.startsWith('https://idleon.wiki/'))).toBe(true);
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
