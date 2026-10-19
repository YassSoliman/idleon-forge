// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 engine rules for Builds past the third class, on Toolbox's public `first.json` (W4-entry: one of
// each elite class and a Maestro) with synthetic Build entries layered over the real Knowledge Base:
// - lineOf() returns the character's own elite or master class when it has a Build, and covers the
//   whole Journeyman line;
// - a step's level is read from its own tab (The Family Guy sits on every elite tab);
// - a skilling Build per AFK Target skill, falling back to the class's default skilling Build;
// - `inherits` (a master Build takes tabs 1-4 from its elite Build) and `stageHint` (World 5+).
import type { AccountState } from '@idleon-forge/account-state';
import type { Entry } from '@idleon-forge/knowledge';
import { withCharacter } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { analyzeAccount, buildRoadmaps, buildsKnowledge } from '../../src/builds';
import { levelOf } from '../../src/builds/classify';
import { lookupOf } from '../../src/metapath/knowledge';
import type { FactLookup } from '../../src/metapath/types';
import { publicState } from '../core/helpers';
import { kb } from './helpers';

const TOOLBOX = 'https://github.com/Morta1/IdleonToolbox/blob/6c37e3dac38e3cb79f8b6b56f6968ded7614b7d1/';
const src = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    url: `https://example.org/build-${i}`,
    title: `Community build ${i}`,
    tier: 3 as const,
    claimDate: '2026-10-11',
    verified: '2026-10-19',
    gameVersion: '2.3.540',
  }));
const data = {
  url: `${TOOLBOX}data/website-data/talents.json`,
  title: 'IdleOn Toolbox game data: talents',
  tier: 1 as const,
  verified: '2026-10-19',
  gameVersion: '2.3.540',
};

const tagsOf = (id: string): string[] => {
  const e = kb.entries[id];
  return e && e.type === 'build' && e.variant === 'afk' ? [...e.tags] : [];
};

type Step = { talent: string; target: number | 'max'; stageHint?: 'W5' | 'W6' | 'W7' };
function build(
  id: string,
  classLine: string,
  role: 'fighting' | 'skilling',
  tabs: { tab: 1 | 2 | 3 | 4 | 5; steps: Step[] }[],
  extra: Record<string, unknown> = {},
): Entry {
  return {
    id,
    system: 'talents',
    type: 'build',
    variant: 'afk',
    title: `${classLine} ${role} build`,
    text: `Follow the ${classLine} ${role} build`,
    why: 'Test build',
    values: {},
    classLine,
    role,
    serves: role === 'fighting' ? ['FIGHTING'] : ['FISHING'],
    tags: tabs.flatMap((t) => t.steps.map((s) => s.talent)),
    tabs,
    attacks: [],
    onePointOk: [],
    sources: [...src(2), data],
    appliesTo: { stages: [{ from: 'W4-entry', to: 'W4-entry' }], classes: [classLine] },
    confidence: 'L',
    status: 'active',
    ...extra,
  } as unknown as Entry;
}

const DK_FIGHTING = build(
  'talents.build.divine-knight-fighting',
  'Divine_Knight',
  'fighting',
  [
    { tab: 1, steps: [{ talent: 'GILDED_SWORD', target: 'max' }] },
    { tab: 3, steps: [{ talent: 'SHOCKWAVE_SLASH', target: 'max' }] },
    {
      tab: 4,
      steps: [
        { talent: 'ORB_OF_REMEMBRANCE', target: 'max' },
        { talent: 'THE_FAMILY_GUY', target: 1 },
        { talent: 'GAMER_STRENGTH', target: 'max', stageHint: 'W5' },
      ],
    },
  ],
  {
    sourceCount: 6,
    confidenceLabel: 'sources agree on tab 4',
    confidence: 'M',
    // The Squire fighting Build's role talents, so the presets classify as they do today.
    tags: [...tagsOf('talents.build.squire-fighting'), 'ORB_OF_REMEMBRANCE', 'THE_FAMILY_GUY'],
  },
);
const RG_FIGHTING = build(
  'talents.build.royal-guardian-fighting',
  'Royal_Guardian',
  'fighting',
  [{ tab: 5, steps: [{ talent: 'INDUSTRIAL_POLITICS', target: 'max' }] }],
  { inherits: 'talents.build.divine-knight-fighting', stageHint: 'W6', sources: [...src(1), data] },
);
const BB_SKILLING = build('talents.build.blood-berserker-skilling', 'Blood_Berserker', 'skilling', [
  { tab: 4, steps: [{ talent: 'SKILL_STRENGTHEN', target: 1 }] },
]);
const BB_COOKING = build(
  'talents.build.blood-berserker-skilling-cooking',
  'Blood_Berserker',
  'skilling',
  [{ tab: 4, steps: [{ talent: 'WAITING_TO_COOL', target: 'max' }] }],
  { serves: ['COOKING'] },
);
const MAESTRO = build('talents.build.maestro-fighting', 'Maestro', 'fighting', [
  { tab: 1, steps: [{ talent: "SLEEPIN'_ON_THE_JOB", target: 50 }] },
]);

/** The real Knowledge Base with these entries layered over it (a fresh lookup per test: buildsKnowledge memoises). */
function over(...entries: Entry[]): FactLookup {
  const base = lookupOf(kb);
  const extra = new Map(entries.map((e) => [e.id, e] as const));
  // The shipped Builds past the third class are hidden, so each test names exactly the ones it uses.
  const shipped =
    /^talents\.build\.(divine-knight|royal-guardian|blood-berserker|maestro|journeyman|voidwalker)-/;
  return { get: (id) => extra.get(id) ?? (shipped.test(id) ? undefined : base.get(id)) };
}

const first = (): AccountState => publicState('first.json');
const indexOf = (s: AccountState, cls: string) => {
  const c = s.characters.find((x) => x.class === cls);
  if (!c) throw new Error(`first.json has no ${cls}`);
  return c.index;
};

describe('M26 lineOf: the character class own Build first', () => {
  it('a Divine Knight uses the Squire Build until a Divine Knight Build exists, then its own', () => {
    expect(buildsKnowledge(over()).lineOf('Divine_Knight')).toBe('Squire');
    const k = buildsKnowledge(over(DK_FIGHTING));
    expect(k.lineOf('Divine_Knight')).toBe('Divine_Knight');
    expect(k.lineOf('Squire')).toBe('Squire');
  });

  it('a master class without a Build of its own takes its elite Build; with one, its own', () => {
    expect(buildsKnowledge(over(DK_FIGHTING)).lineOf('Royal_Guardian')).toBe('Divine_Knight');
    expect(buildsKnowledge(over(DK_FIGHTING, RG_FIGHTING)).lineOf('Royal_Guardian')).toBe('Royal_Guardian');
  });

  it('covers the Journeyman line: null without a Build, the nearest Build of the line with one', () => {
    expect(buildsKnowledge(over()).lineOf('Maestro')).toBeNull();
    const k = buildsKnowledge(over(MAESTRO));
    expect(k.lineOf('Maestro')).toBe('Maestro');
    expect(k.lineOf('Voidwalker')).toBe('Maestro');
    expect(k.lineOf('Journeyman')).toBeNull();
  });
});

describe('M26 lineOf on the shipped Knowledge Base', () => {
  it('every elite and released master class, and the whole Journeyman line, has its own Build', () => {
    const k = buildsKnowledge(lookupOf(kb));
    for (const cls of [
      'Divine_Knight',
      'Blood_Berserker',
      'Siege_Breaker',
      'Beast_Master',
      'Elemental_Sorcerer',
      'Bubonic_Conjuror',
      'Voidwalker',
      'Royal_Guardian',
      'Death_Bringer',
      'Wind_Walker',
      'Arcane_Cultist',
      'Journeyman',
      'Maestro',
    ])
      expect(k.lineOf(cls), cls).toBe(cls);
    // Unreleased in the game data: the elite Build carries on.
    expect(k.lineOf('Spiritual_Monk')).toBe('Elemental_Sorcerer');
    expect(k.lineOf('Infinilyte')).toBe('Voidwalker');
  });
});

describe('M26 Build resolution', () => {
  it('a master Build takes tabs 1-4 from the Build it inherits, and its own tab 5', () => {
    const b = buildsKnowledge(over(DK_FIGHTING, RG_FIGHTING)).build('Royal_Guardian', 'fighting');
    expect(b?.tabs.map((t) => t.tab)).toEqual([1, 3, 4, 5]);
    expect(b?.inherited?.id).toBe('talents.build.divine-knight-fighting');
    expect(b?.stageHint).toBe('W6');
    expect(b?.confidence).toEqual({ level: 'L', sourceCount: 1, label: null });
  });

  it('a skilling Build for the AFK Target skill wins; otherwise the class default', () => {
    const k = buildsKnowledge(over(BB_SKILLING, BB_COOKING));
    expect(k.build('Blood_Berserker', 'skilling', 'COOKING')?.entry.id).toBe(
      'talents.build.blood-berserker-skilling-cooking',
    );
    expect(k.build('Blood_Berserker', 'skilling', 'FISHING')?.entry.id).toBe(
      'talents.build.blood-berserker-skilling',
    );
    expect(k.build('Blood_Berserker', 'skilling')?.entry.id).toBe('talents.build.blood-berserker-skilling');
  });

  it('confidence: the stated source count and label, else the dated community Sources', () => {
    const k = buildsKnowledge(over(DK_FIGHTING, BB_SKILLING));
    expect(k.build('Divine_Knight', 'fighting')?.confidence).toEqual({
      level: 'M',
      sourceCount: 6,
      label: 'sources agree on tab 4',
    });
    expect(k.build('Blood_Berserker', 'skilling')?.confidence.sourceCount).toBe(2);
  });
});

describe('M26 the Divine Knight on first.json (W4-entry)', () => {
  it('gets the Divine Knight Build, its tab 4 counted, its World 5 step silent', () => {
    const s = first();
    const dk = indexOf(s, 'Divine_Knight');
    const a = analyzeAccount(s, over(DK_FIGHTING)).characters.get(dk);
    expect(a?.classLine).toBe('Divine_Knight');
    expect(a?.tabs).toEqual([1, 2, 3, 4]);
    const view = a?.active.cls === 'fighting' ? a.active : a?.other;
    const tab4 = view?.states.filter((x) => x.tab === 4).map((x) => x.step.talent);
    expect(tab4).toEqual(['ORB_OF_REMEMBRANCE', 'THE_FAMILY_GUY']);
    expect(analyzeAccount(s, over(DK_FIGHTING)).eliteTabs).not.toContain(dk);
  });

  it('reads The Family Guy from tab 4 only', () => {
    const s = first();
    const p = s.characters.find((c) => c.class === 'Divine_Knight')?.talents?.active;
    if (!p) throw new Error('fixture');
    const id = buildsKnowledge(over()).talents.idOf('THE_FAMILY_GUY') as number;
    expect(levelOf(p, id, 3)).toBe(0);
    expect(levelOf(p, id, 4)).toBe(levelOf(p, id));
  });

  it('the Build view: tab-4 rows, the confidence label, and the Sources', () => {
    const s = first();
    const dk = indexOf(s, 'Divine_Knight');
    const r = buildRoadmaps(s, over(DK_FIGHTING)).find((x) => x.index === dk);
    const fighting = r?.presets.find((p) => p.role === 'fighting');
    const tab4 = fighting?.tabs.find((t) => t.tab === 4);
    expect(tab4?.rows.map((x) => [x.label, x.note])).toEqual([
      ['Orb of Remembrance', null],
      ['The Family Guy', null],
      ['Gamer Strength', 'from World 5'],
    ]);
    expect(fighting?.confidence?.text).toBe('Community build · 6 sources');
    expect(r?.sources.length).toBeGreaterThan(0);
    expect(r?.comingUp).toContain('From World 5: Gamer Strength (fighting build, tab 4)');
    expect(r?.comingUp).not.toContain('Elite talent tabs show plain levels: no elite build yet');
  });

  it('a Blood Berserker AFK on Cooking gets the cooking Build on its skilling preset', () => {
    const s0 = first();
    const bb = indexOf(s0, 'Blood_Berserker');
    const s = withCharacter(s0, bb, { afkType: 'COOKING' });
    const a = analyzeAccount(s, over(BB_SKILLING, BB_COOKING)).characters.get(bb);
    expect(a?.builds.skilling?.entry.id).toBe('talents.build.blood-berserker-skilling-cooking');
    expect(a?.neededRole).toBe('skilling');
  });

  it('a master Build stays silent below World 5 even on a master-class character', () => {
    const s0 = first();
    const dk = indexOf(s0, 'Divine_Knight');
    const s = withCharacter(s0, dk, { class: 'Royal_Guardian' });
    const acc = analyzeAccount(s, over(DK_FIGHTING, RG_FIGHTING));
    expect(acc.characters.get(dk)).toBeUndefined();
  });
});

describe('M26 the shipped Builds on first.json (W4-entry)', () => {
  it('the Divine Knight gets the Divine Knight Builds, with tab-4 steps on both presets', () => {
    const s = first();
    const dk = indexOf(s, 'Divine_Knight');
    const r = buildRoadmaps(s, lookupOf(kb), { entries: kb.entries }).find((x) => x.index === dk);
    expect(r?.entryIds).toEqual(
      expect.arrayContaining([
        'talents.build.divine-knight-fighting',
        'talents.build.divine-knight-skilling',
      ]),
    );
    for (const p of r?.presets ?? []) {
      const tab4 = p.tabs.find((t) => t.tab === 4);
      expect(tab4?.rows.length, p.heading).toBeGreaterThan(0);
      expect(p.confidence?.text).toMatch(/^Community build · (one source|\d+ sources)$/);
    }
    const fighting = r?.presets.find((p) => p.role === 'fighting');
    expect(fighting?.tabs.find((t) => t.tab === 4)?.rows[0]?.label).toBe('Orb of Remembrance');
    expect(fighting?.confidence?.text).toBe('Community build · 6 sources');
    // The Gaming talents wait for World 5; the master class's Build stays out of a W4 account's plan.
    expect(r?.comingUp).toContain('From World 5: Bitty Litty (skilling build, tab 4)');
    expect(r?.comingUp.some((x) => x.includes('Royal Guardian') && x.startsWith('Then the'))).toBe(false);
  });

  it('every elite character and the Maestro get their own class Build', () => {
    const s = first();
    const a = analyzeAccount(s, lookupOf(kb));
    for (const c of s.characters) expect(a.characters.get(c.index)?.classLine, c.class).toBe(c.class);
    expect(a.eliteTabs).toEqual([]);
  });
});
