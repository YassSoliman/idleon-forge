// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `kb check` for M26's class Builds past the third class: talents on the class's own tab of that number,
// `inherits` naming the parent class's Build, skilling variants serving their skill, master Builds
// carrying a stageHint. Edits are made in memory on the shipped Knowledge Base.
import type { Entry } from '@idleon-forge/knowledge';
import { describe, expect, it } from 'vitest';
import { buildIssues } from '../src/build-checks';
import { type KbSource, loadSource } from '../src/load';

const facts = (src: KbSource) => new Map(src.facts.map((f) => [f.value.id, f]));
const issues = (src: KbSource) => buildIssues(src, facts(src)).map((i) => `${i.id}: ${i.message}`);

type Afk = Extract<Entry, { type: 'build'; variant: 'afk' }>;
/** The shipped source with `edit` applied to a copy of one Build (or a new Build cloned from it). */
function edited(id: string, edit: (b: Afk) => Afk, asNew = false): KbSource {
  const src = loadSource();
  const at = src.authored.findIndex((e) => e.value.id === id);
  const e = src.authored[at];
  if (!e) throw new Error(`no ${id}`);
  const value = edit(structuredClone(e.value) as Afk) as unknown as typeof e.value;
  const authored = [...src.authored];
  if (asNew) authored.push({ ...e, value });
  else authored[at] = { ...e, value };
  return { ...src, authored };
}

describe('buildIssues (M26)', () => {
  it('passes on the shipped Knowledge Base', () => {
    expect(issues(loadSource())).toEqual([]);
  });

  it('fails a talent on another tab, and a tab the class does not have', () => {
    const src = edited('talents.build.squire-fighting', (b) => {
      const t1 = b.tabs[0];
      if (t1?.steps[0]) t1.steps[0] = { ...t1.steps[0], talent: 'SHOCKWAVE_SLASH' };
      b.tabs.push({ tab: 4, steps: [{ talent: 'ORB_OF_REMEMBRANCE', target: 'max' }] });
      return b;
    });
    expect(issues(src)).toEqual([
      'talents.build.squire-fighting: talent SHOCKWAVE_SLASH is not on tab 1 (Rage_Basics)',
      'talents.build.squire-fighting: Squire has no talent tab 4',
    ]);
  });

  it('fails an elite step naming another line Symbols of Beyond', () => {
    const src = edited(
      'talents.build.squire-fighting',
      (b) => ({
        ...b,
        id: 'talents.build.divine-knight-fighting',
        classLine: 'Divine_Knight',
        tabs: [{ tab: 4, steps: [{ talent: 'SYMBOLS_OF_BEYOND_~G', target: 1 }] }],
      }),
      true,
    );
    expect(issues(src)).toEqual([
      'talents.build.divine-knight-fighting: talent SYMBOLS_OF_BEYOND_~G is not on tab 4 (Divine_Knight)',
    ]);
  });

  it('checks inherits, skilling variants and the master stageHint', () => {
    const src = edited(
      'talents.build.squire-fighting',
      (b) => ({
        ...b,
        id: 'talents.build.royal-guardian-fighting',
        classLine: 'Royal_Guardian',
        inherits: 'talents.build.squire-fighting',
        tabs: [{ tab: 3, steps: [{ talent: 'SHOCKWAVE_SLASH', target: 'max' }] }],
      }),
      true,
    );
    expect(issues(src)).toEqual([
      'talents.build.royal-guardian-fighting: inherits a Squire Build; Royal_Guardian promotes from Divine_Knight',
      'talents.build.royal-guardian-fighting: lists tab 3 that talents.build.squire-fighting already has',
      'talents.build.royal-guardian-fighting: a master-class Build needs a stageHint (master classes open in World 6)',
    ]);
    const variant = edited(
      'talents.build.barbarian-skilling',
      (b) => ({ ...b, id: 'talents.build.barbarian-skilling-cooking' }),
      true,
    );
    expect(issues(variant)).toEqual([
      'talents.build.barbarian-skilling-cooking: a skilling variant for COOKING serves COOKING',
    ]);
  });
});
