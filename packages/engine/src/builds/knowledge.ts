// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9's view of the Knowledge Base (TR-5, TR-10): the Build entries resolved to skill indices, the
// generated talent facts, and the class line a character's class follows (classes.fact.class-tree).
// Pure: everything comes through a FactLookup (the one `makeContext` gives Detectors).
import type { Entry, FactTable } from '@idleon-forge/knowledge';
import type { FactLookup } from '../metapath/types';

export type PresetRole = 'fighting' | 'skilling';
export const ROLES: readonly PresetRole[] = ['fighting', 'skilling'];
export const otherRole = (r: PresetRole): PresetRole => (r === 'fighting' ? 'skilling' : 'fighting');

export type BuildEntry = Extract<Entry, { type: 'build' }>;
type BuildStepT = BuildEntry['tabs'][number]['steps'][number];

export const FACT = {
  index: 'talents.fact.index',
  tab2Granting: 'talents.fact.tab2-granting',
  bubbleCapped: 'talents.fact.bubble-capped',
  classTree: 'classes.fact.class-tree',
} as const;

/** The Build entry id for a class line and role (TR-5: talents.build.<classLine>-<role>). */
export const buildId = (classLine: string, role: PresetRole) =>
  `talents.build.${classLine.toLowerCase().replace(/_/g, '-')}-${role}`;

export interface ResolvedStep {
  talent: string;
  id: number;
  target: number | 'max';
  core: boolean;
  hardCap: boolean;
  when: NonNullable<BuildStepT['when']>;
  tie: string | null;
}

export interface ResolvedBuild {
  entry: BuildEntry;
  role: PresetRole;
  /** Skill indices of `tags` (TR-6). */
  tags: ReadonlySet<number>;
  tabs: { tab: 1 | 2 | 3; steps: ResolvedStep[] }[];
  /** Every talent index the Build's steps name. */
  stepIds: ReadonlySet<number>;
  attacks: number[];
  /** Explicitly flagged Stale (D4), or Contested: never used for resets (FR-15, FR-22). */
  stale: boolean;
  contested: boolean;
}

export interface TalentIndexRows {
  skillIndex: Record<string, number>;
  attacks: string[];
  skillAttacks: Record<string, string>;
}

export interface TalentFacts {
  idOf(rawName: string): number | undefined;
  nameOf(id: number): string | undefined;
  /** Generated isAttack (TR-10: AFKactivity 0 with D and K). */
  isAttack(id: number): boolean;
  /** AFK skill a skill attack serves, by index. */
  skillAttackFor(id: number): string | null;
  /** The skill attack talent for an AFK skill, if any. */
  skillAttackOf(afkType: string): number | null;
  tab2Granting: ReadonlySet<number>;
  bubbleCapped: ReadonlySet<number>;
}

export class BuildsKnowledgeError extends Error {
  override name = 'BuildsKnowledgeError';
}

const rowsOf = (kb: FactLookup, id: string): unknown => {
  const f = kb.get(id) as FactTable | undefined;
  if (!f || !('rows' in f)) throw new BuildsKnowledgeError(`fact table ${id} is not in the Knowledge Base`);
  return f.rows;
};

const memo = new WeakMap<FactLookup, BuildsKnowledge>();

export interface BuildsKnowledge {
  talents: TalentFacts;
  /** The Build for a class line and role, or null when there is none (or it is retired). */
  build(classLine: string, role: PresetRole): ResolvedBuild | null;
  /** The class line whose Builds a class uses (subclass, else base class, else Beginner); null for the Journeyman line or an unknown class. */
  lineOf(cls: string): string | null;
  /** The class tier ('beginner', 'base', 'subclass', 'elite', 'master'); null when unknown. */
  tierOf(cls: string): string | null;
}

interface ClassRow {
  class: string;
  line: string | null;
  promotesFrom: string | null;
  tier: string;
}

/** M9's resolved view of the Knowledge Base, cached per lookup. */
export function buildsKnowledge(kb: FactLookup): BuildsKnowledge {
  const cached = memo.get(kb);
  if (cached) return cached;
  const index = rowsOf(kb, FACT.index) as TalentIndexRows;
  const names = new Map<number, string>();
  for (const [n, i] of Object.entries(index.skillIndex)) if (!names.has(i)) names.set(i, n);
  const ids = (list: unknown): Set<number> =>
    new Set(
      (Array.isArray(list) ? list : [])
        .map((n) => index.skillIndex[String(n)])
        .filter((x): x is number => x !== undefined),
    );
  const attacks = ids(index.attacks);
  const skillAttacks = new Map<number, string>();
  for (const [n, skill] of Object.entries(index.skillAttacks)) {
    const i = index.skillIndex[n];
    if (i !== undefined) skillAttacks.set(i, skill);
  }
  const talents: TalentFacts = {
    idOf: (n) => index.skillIndex[n],
    nameOf: (i) => names.get(i),
    isAttack: (i) => attacks.has(i),
    skillAttackFor: (i) => skillAttacks.get(i) ?? null,
    skillAttackOf: (afk) => [...skillAttacks].find(([, s]) => s === afk)?.[0] ?? null,
    tab2Granting: ids(rowsOf(kb, FACT.tab2Granting)),
    bubbleCapped: ids(rowsOf(kb, FACT.bubbleCapped)),
  };
  const classes = new Map(
    ((rowsOf(kb, FACT.classTree) as ClassRow[]) ?? []).map((r) => [r.class, r] as const),
  );
  const lineOf = (cls: string): string | null => {
    let row = classes.get(cls);
    if (!row) return null;
    if (row.line === 'Journeyman') return null;
    for (let guard = 0; row && guard < 8; guard++) {
      if (row.tier === 'subclass' || row.tier === 'base' || row.tier === 'beginner') return row.class;
      row = row.promotesFrom ? classes.get(row.promotesFrom) : undefined;
    }
    return null;
  };
  const builds = new Map<string, ResolvedBuild | null>();
  const build = (classLine: string, role: PresetRole): ResolvedBuild | null => {
    const id = buildId(classLine, role);
    if (builds.has(id)) return builds.get(id) ?? null;
    const e = kb.get(id) as Entry | undefined;
    let out: ResolvedBuild | null = null;
    if (e && 'type' in e && e.type === 'build' && e.status !== 'retired') {
      const tabs = e.tabs.map((t) => ({
        tab: t.tab,
        // A step whose talent is missing from generated data is skipped (section 6, "Stale patch").
        steps: t.steps.flatMap((s): ResolvedStep[] => {
          const i = talents.idOf(s.talent);
          return i === undefined
            ? []
            : [
                {
                  talent: s.talent,
                  id: i,
                  target: s.target,
                  core: s.core === true,
                  hardCap: s.hardCap === true,
                  when: s.when ?? [],
                  tie: s.tie ?? null,
                },
              ];
        }),
      }));
      out = {
        entry: e,
        role,
        tags: ids(e.tags),
        tabs,
        stepIds: new Set(tabs.flatMap((t) => t.steps.map((s) => s.id))),
        attacks: [...ids(e.attacks)],
        stale: e.stale !== undefined,
        contested: e.status === 'contested',
      };
    }
    builds.set(id, out);
    return out;
  };
  const out: BuildsKnowledge = {
    talents,
    build,
    lineOf,
    tierOf: (cls) => classes.get(cls)?.tier ?? null,
  };
  memo.set(kb, out);
  return out;
}

const SMALL_WORDS = new Set(['OF', 'THE', 'AND', 'FOR']);

/** "IDLE_BRAWLING" -> "Idle Brawling", "BOOK_OF_THE_WISE" -> "Book of the Wise", "ACTIVE_AFK'ER" -> "Active AFK'er" (display only). */
export function talentLabel(rawName: string): string {
  return rawName
    .split('_')
    .filter(Boolean)
    .map((w, i) => {
      if (i > 0 && SMALL_WORDS.has(w)) return w.toLowerCase();
      if (/^AFK/.test(w)) return `AFK${w.slice(3).toLowerCase()}`;
      return w.charAt(0) + w.slice(1).toLowerCase();
    })
    .join(' ');
}
