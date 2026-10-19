// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M9's view of the Knowledge Base (TR-5, TR-10): the Build entries resolved to skill indices, the
// generated talent facts, and the class line a character's class follows (classes.fact.class-tree).
// Pure: everything comes through a FactLookup (the one `makeContext` gives Detectors).
import type { Entry, FactTable } from '@idleon-forge/knowledge';
import type { FactLookup } from '../metapath/types';

export type PresetRole = 'fighting' | 'skilling';
/** A class talent tab: 1-3 up to the subclass, 4 for the elite class, 5 for the master class. */
export type TabNo = 1 | 2 | 3 | 4 | 5;
/** Every class tab, in order. */
export const CLASS_TABS: readonly TabNo[] = [1, 2, 3, 4, 5];
export const ROLES: readonly PresetRole[] = ['fighting', 'skilling'];
export const otherRole = (r: PresetRole): PresetRole => (r === 'fighting' ? 'skilling' : 'fighting');

export type BuildEntry = Extract<Entry, { type: 'build'; variant: 'afk' }>;
export type StarBuildEntry = Extract<Entry, { type: 'build'; variant: 'star' }>;
type BuildStepT = BuildEntry['tabs'][number]['steps'][number];

export const FACT = {
  index: 'talents.fact.index',
  tab2Granting: 'talents.fact.tab2-granting',
  bubbleCapped: 'talents.fact.bubble-capped',
  classTree: 'classes.fact.class-tree',
  starBooks: 'talents.fact.star-books',
} as const;

/** The Build entry id for a class line and role (TR-5: talents.build.<classLine>-<role>). */
export const buildId = (classLine: string, role: PresetRole) =>
  `talents.build.${classLine.toLowerCase().replace(/_/g, '-')}-${role}`;

/**
 * M26 (owner ruling 2026-10-19): a class may have more than one skilling Build, one per AFK Target
 * skill. `talents.build.<classLine>-skilling-<afk>` (e.g. `blood-berserker-skilling-cooking`) is the
 * Build for a character AFK on that skill; without one, the class's default skilling Build applies.
 */
export const skillingVariantId = (classLine: string, afkType: string) =>
  `${buildId(classLine, 'skilling')}-${afkType.toLowerCase()}`;

export interface ResolvedStep {
  talent: string;
  id: number;
  /** The class tab the step sits on: its level is read from this tab only (shared rawNames, M26). */
  tab: TabNo;
  target: number | 'max';
  core: boolean;
  hardCap: boolean;
  when: NonNullable<BuildStepT['when']>;
  tie: string | null;
  /** M26: the world past the Stage model this step applies from ("W5"); null when the Stages cover it. */
  stageHint: string | null;
}

/** How sure a Build is, for its label (M26 owner ruling 2026-10-19: one source is fine, never hidden). */
export interface BuildConfidence {
  level: 'H' | 'M' | 'L';
  /** Independent dated authors behind the order (tiers 2-3; `sourceCount` when the entry states it). */
  sourceCount: number;
  /** "sources agree on tab 4", "one source"; null when the entry gives none. */
  label: string | null;
}

export interface ResolvedBuild {
  entry: BuildEntry;
  role: PresetRole;
  /** Skill indices of `tags` (TR-6). */
  tags: ReadonlySet<number>;
  tabs: { tab: TabNo; steps: ResolvedStep[] }[];
  /** Every talent index the Build's steps name. */
  stepIds: ReadonlySet<number>;
  attacks: number[];
  /** Explicitly flagged Stale (D4), or Contested: never used for resets (FR-15, FR-22). */
  stale: boolean;
  contested: boolean;
  /** M26: the Build whose tabs this one takes (a master Build takes tabs 1-4 from its elite Build); null otherwise. */
  inherited: BuildEntry | null;
  /** M26: the world past the Stage model the whole Build applies from ("W6"); null otherwise. */
  stageHint: string | null;
  confidence: BuildConfidence;
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

/** M21 TR-8: one star Build step, resolved to its talent index. */
export interface ResolvedStarStep {
  talent: string;
  id: number;
  page: number;
  target: number | 'max' | { cap: 'best-level-tenth' | 'best-beginner-tenth' };
  core: boolean;
  tie: string | null;
  /** Stage gates (`stageAtLeast`) as for class Builds. */
  when: NonNullable<BuildStepT['when']>;
  /** `servesAny`: only when the preset serves one of these AFK skills; null without the condition. */
  servesAny: string[] | null;
}

export interface ResolvedStarBuild {
  entry: StarBuildEntry;
  role: PresetRole;
  steps: ResolvedStarStep[];
  stepIds: ReadonlySet<number>;
  stale: boolean;
  contested: boolean;
}

/** The star Build entry id for a role (M21 TR-8: talents.build.star-<role>). */
export const starBuildId = (role: PresetRole) => `talents.build.star-${role}`;

export interface BuildsKnowledge {
  talents: TalentFacts;
  /**
   * The Build for a class line and role, or null when there is none (or it is retired). With an AFK
   * Target, a skilling Build for that skill wins over the class's default skilling Build (M26).
   */
  build(classLine: string, role: PresetRole, afkType?: string | null): ResolvedBuild | null;
  /** Whether a class has a Build of its own (either role). */
  hasBuild(cls: string): boolean;
  /** M21 TR-8: the class-agnostic star Build for a role, or null (never part of `build`). */
  starBuild(role: PresetRole): ResolvedStarBuild | null;
  /** The talent tabs of a class (`classes.fact.class-tree`), e.g. ["Beginner", "Journeyman"]; [] when unknown. */
  talentTabsOf(cls: string): readonly string[];
  /** M21 FR-C13: where a star talent's book comes from (`talents.fact.star-books`); null when not listed. */
  starBookOf(rawName: string): string | null;
  /**
   * The class whose Builds a class uses: the class itself when it has a Build (so a Divine Knight gets
   * the Divine Knight Build, a Voidwalker the Voidwalker one), else the nearest class it promoted from
   * that has one. Without any, the old rule: subclass, else base class, else Beginner (never a
   * Journeyman-line class). Null for an unknown class or a Journeyman line with no Build.
   */
  lineOf(cls: string): string | null;
  /** The class tier ('beginner', 'base', 'subclass', 'elite', 'master'); null when unknown. */
  tierOf(cls: string): string | null;
}

interface ClassRow {
  class: string;
  line: string | null;
  promotesFrom: string | null;
  tier: string;
  talentTabs?: string[];
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
  const afkEntry = (id: string): BuildEntry | null => {
    const e = kb.get(id) as Entry | undefined;
    return e && 'type' in e && e.type === 'build' && e.variant === 'afk' && e.status !== 'retired' ? e : null;
  };
  const hasBuild = (cls: string) =>
    afkEntry(buildId(cls, 'fighting')) !== null || afkEntry(buildId(cls, 'skilling')) !== null;
  const lineOf = (cls: string): string | null => {
    const start = classes.get(cls);
    if (!start) return null;
    for (let row: ClassRow | undefined = start, guard = 0; row && guard < 8; guard++) {
      if (hasBuild(row.class)) return row.class;
      row = row.promotesFrom ? classes.get(row.promotesFrom) : undefined;
    }
    if (start.line === 'Journeyman') return null;
    for (let row: ClassRow | undefined = start, guard = 0; row && guard < 8; guard++) {
      if (row.tier === 'subclass' || row.tier === 'base' || row.tier === 'beginner') return row.class;
      row = row.promotesFrom ? classes.get(row.promotesFrom) : undefined;
    }
    return null;
  };
  const resolveTabs = (e: BuildEntry) =>
    e.tabs.map((t) => ({
      tab: t.tab as TabNo,
      // A step whose talent is missing from generated data is skipped (section 6, "Stale patch").
      steps: t.steps.flatMap((s): ResolvedStep[] => {
        const i = talents.idOf(s.talent);
        return i === undefined
          ? []
          : [
              {
                talent: s.talent,
                id: i,
                tab: t.tab as TabNo,
                target: s.target,
                core: s.core === true,
                hardCap: s.hardCap === true,
                when: s.when ?? [],
                tie: s.tie ?? null,
                stageHint: s.stageHint ?? null,
              },
            ];
      }),
    }));
  const builds = new Map<string, ResolvedBuild | null>();
  const resolve = (id: string, role: PresetRole): ResolvedBuild | null => {
    if (builds.has(id)) return builds.get(id) ?? null;
    const e = afkEntry(id);
    let out: ResolvedBuild | null = null;
    if (e) {
      // M26: a master Build holds its own tab only and takes the earlier tabs from the Build it names.
      const base = e.inherits ? afkEntry(e.inherits) : null;
      const own = resolveTabs(e);
      const ownTabs = new Set(own.map((t) => t.tab));
      const tabs = [...(base ? resolveTabs(base).filter((t) => !ownTabs.has(t.tab)) : []), ...own].sort(
        (x, y) => x.tab - y.tab,
      );
      const attacks = e.attacks.length > 0 || !base ? e.attacks : base.attacks;
      out = {
        entry: e,
        role,
        tags: ids([...e.tags, ...(base?.tags ?? [])]),
        tabs,
        stepIds: new Set(tabs.flatMap((t) => t.steps.map((s) => s.id))),
        attacks: [...ids(attacks)],
        stale: e.stale !== undefined || base?.stale !== undefined,
        contested: e.status === 'contested',
        inherited: base,
        stageHint: e.stageHint ?? null,
        confidence: confidenceOf(e),
      };
    }
    builds.set(id, out);
    return out;
  };
  const build = (classLine: string, role: PresetRole, afkType?: string | null): ResolvedBuild | null => {
    if (role === 'skilling' && afkType) {
      const v = resolve(skillingVariantId(classLine, afkType), role);
      if (v?.entry.serves.includes(afkType as never)) return v;
    }
    return resolve(buildId(classLine, role), role);
  };
  // Authored and optional: a missing table only drops the book's words from the later band.
  const bookTable = kb.get(FACT.starBooks) as FactTable | undefined;
  const books = new Map<string, string>(
    (bookTable && 'rows' in bookTable && Array.isArray(bookTable.rows)
      ? (bookTable.rows as { rawName?: unknown; book?: unknown }[])
      : []
    ).flatMap((r) =>
      typeof r.rawName === 'string' && typeof r.book === 'string' ? [[r.rawName, r.book]] : [],
    ),
  );
  const stars = new Map<PresetRole, ResolvedStarBuild | null>();
  const starBuild = (role: PresetRole): ResolvedStarBuild | null => {
    if (stars.has(role)) return stars.get(role) ?? null;
    const e = kb.get(starBuildId(role)) as Entry | undefined;
    let res: ResolvedStarBuild | null = null;
    if (e && 'type' in e && e.type === 'build' && e.variant === 'star' && e.status !== 'retired') {
      const steps = e.steps.flatMap((s): ResolvedStarStep[] => {
        const i = talents.idOf(s.talent);
        if (i === undefined) return [];
        const when = s.when ?? [];
        const serves = when.find((w) => w.kind === 'servesAny');
        return [
          {
            talent: s.talent,
            id: i,
            page: s.page,
            target: s.target,
            core: s.core === true,
            tie: s.tie ?? null,
            when: when.flatMap((w) => (w.kind === 'servesAny' ? [] : [w])),
            servesAny: serves && serves.kind === 'servesAny' ? [...serves.afk] : null,
          },
        ];
      });
      res = {
        entry: e,
        role,
        steps,
        stepIds: new Set(steps.map((s) => s.id)),
        stale: e.stale !== undefined,
        contested: e.status === 'contested',
      };
    }
    stars.set(role, res);
    return res;
  };
  const out: BuildsKnowledge = {
    talents,
    build,
    hasBuild,
    starBuild,
    talentTabsOf: (cls) => classes.get(cls)?.talentTabs ?? [],
    starBookOf: (rawName) => books.get(rawName) ?? null,
    lineOf,
    tierOf: (cls) => classes.get(cls)?.tier ?? null,
  };
  memo.set(kb, out);
  return out;
}

/**
 * A Build's confidence label (M26): the entry's own `sourceCount` when it states one, else its distinct
 * dated community and wiki Sources (tiers 2-3; game data backs every Build and is not counted).
 */
export function confidenceOf(e: BuildEntry): BuildConfidence {
  const counted = new Set(e.sources.filter((s) => s.tier === 2 || s.tier === 3).map((s) => s.url));
  return {
    level: e.confidence,
    sourceCount: Math.max(1, e.sourceCount ?? counted.size),
    label: e.confidenceLabel ?? null,
  };
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
