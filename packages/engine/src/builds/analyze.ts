// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// One character's talent picture (M9 §3): both presets classified, their Builds walked, the lower
// bounds of unspent points, and every rule's verdict. The Detectors in detectors.ts each read one part
// of it, so they stay independent while the walk runs once per save (TR-12). Pure.
import {
  type AccountState,
  type CharacterState,
  isKnown,
  type PresetTalents,
} from '@idleon-forge/account-state';
import type { StageId } from '@idleon-forge/knowledge';
import { detectStage } from '../metapath/stage';
import type { FactLookup } from '../metapath/types';
import { classifyPreset, levelOf, maxOf, type PresetClass, spent, tabSpent } from './classify';
import { nextStep, type StepState, type WalkContext, type WrongRole, walk, wrongRolePoints } from './diff';
import {
  type BuildsKnowledge,
  buildsKnowledge,
  otherRole,
  type PresetRole,
  type ResolvedBuild,
  type TabNo,
} from './knowledge';
import { lowerBounds, type TabPoints, tabsCounted } from './unspent';

/** Talent presets open at class Lv 15 (FR-1, FR-2). */
export const PRESET_LEVEL = 15;
/** FR-15 condition 3: 10 fragments make one potion (generated reset items, TR-10). */
export const FRAGMENTS_PER_POTION = 10;

const SKILLING_AFK = new Set(['MINING', 'CHOPPIN', 'FISHING', 'CATCHING']);

/** The role an AFK Target needs, or null (COOKING, LABORATORY, DIVINITY, SPELUNKING, Nothing, null). */
export function neededRoleOf(afkType: string | null): PresetRole | null {
  if (afkType === 'FIGHTING') return 'fighting';
  return afkType !== null && SKILLING_AFK.has(afkType) ? 'skilling' : null;
}

export interface PresetView {
  slot: 0 | 1;
  isActive: boolean;
  talents: PresetTalents;
  cls: PresetClass;
  /** The Build for the preset's role, when classified. */
  build: ResolvedBuild | null;
  /** The Build walk, when classified. */
  states: StepState[];
  next: StepState | null;
  /** Lower bounds against the other preset (null without one). */
  lb: { byTab: TabPoints; total: number } | null;
}

export type NotCoveredReason = 'beyond' | 'journeyman' | 'beginner' | 'elite';

export interface CharacterAnalysis {
  index: number;
  classLine: string;
  neededRole: PresetRole | null;
  builds: Record<PresetRole, ResolvedBuild | null>;
  active: PresetView;
  other: PresetView | null;
  /** Tab-4 or tab-5 points on either preset (FR-15 condition 5). */
  eliteSpend: boolean;
  walkCtx: WalkContext;
  /** The class tabs the Builds count points on (1–3, plus 4 or 5 when a Build names them, M26). */
  tabs: TabNo[];
}

export interface AccountAnalysis {
  stage: StageId | null;
  beyond: boolean;
  characters: Map<number, CharacterAnalysis>;
  /** Characters M9 says nothing about, and why (FR-21). */
  notCovered: Map<number, NotCoveredReason>;
  /** Characters with an elite or master tab no Build of theirs covers (FR-21, "elite talent builds"). */
  eliteTabs: number[];
  /**
   * M26: past World 4, the elite and master characters' analyses for the Build view only. M9's Goals
   * stay silent there (FR-21: the W1-W4 point rules misread a World 6 account), but the page shows the
   * character's own elite or master Build.
   */
  viewOnly: Map<number, CharacterAnalysis>;
  kb: BuildsKnowledge;
}

const presetLabelOf = (v: PresetView): string =>
  v.cls === 'fighting' || v.cls === 'skilling' ? v.cls : v.isActive ? 'current' : 'other';

/** "your fighting preset", "your skilling preset", "your other preset" (FR-24, D5): the role, or which one. */
export const presetLabel = presetLabelOf;

function view(
  p: PresetTalents,
  slot: 0 | 1,
  isActive: boolean,
  builds: Record<PresetRole, ResolvedBuild | null>,
  ctx: WalkContext,
): PresetView {
  const cls = classifyPreset(p, builds);
  const build = cls === 'fighting' || cls === 'skilling' ? builds[cls] : null;
  const states = build ? walk(p, build, ctx) : [];
  return {
    slot,
    isActive,
    talents: p,
    cls,
    build,
    states,
    next: spendableNext({ states, lb: null, talents: p }),
    lb: null,
  };
}

/**
 * Talent points are per tab (R5 QA P2-1): a step can only take points its own tab has. When the
 * preset has unspent points (the lower bound, TR-7), its steps are those in tabs with points waiting;
 * a step whose talent is at its max for now never leads. With nothing known to be waiting, every tab
 * counts (the next points as they come). Core first, then tab order (FR-11). The one rule the Build
 * view's "Next points", the overview's "next" and the M9 Goals all read.
 */
export function spendableStates(v: Pick<PresetView, 'states' | 'lb' | 'talents'>): StepState[] {
  const lb = v.lb;
  const waiting = lb !== null && lb.total > 0;
  return v.states.filter(
    (s) => !s.met && s.current < maxOf(v.talents, s.step.id) && (!waiting || lb.byTab[s.tab] > 0),
  );
}

/** The preset's next step under {@link spendableStates}. */
export function spendableNext(v: Pick<PresetView, 'states' | 'lb' | 'talents'>): StepState | null {
  return nextStep(spendableStates(v));
}

function analyzeCharacter(
  c: CharacterState,
  state: AccountState,
  kb: BuildsKnowledge,
  stage: StageId | null,
  beyond: boolean,
): CharacterAnalysis | NotCoveredReason | null {
  const t = c.talents;
  if (!t || !isKnown(state, `characters[${c.index}].talents`)) return null;
  const line = kb.lineOf(c.class);
  if (line === null) return kb.tierOf(c.class) === null ? null : 'journeyman';
  if (line === 'Beginner' && c.level >= PRESET_LEVEL) return 'beginner';
  // M26: a Build for a world past the Stage model (a master class, W6) stays silent until the account is there.
  const live = (b: ResolvedBuild | null) => (b && (b.stageHint === null || beyond) ? b : null);
  const builds = {
    fighting: live(kb.build(line, 'fighting')),
    skilling: live(kb.build(line, 'skilling', c.afkType)),
  };
  if (!builds.fighting && !builds.skilling) return null;
  const walkCtx: WalkContext = { stage, bubbleCapped: kb.talents.bubbleCapped, beyond };
  const tabs = tabsCounted([builds.fighting, builds.skilling]);
  const activeSlot = t.selectedPreset;
  const active = view(t.active, activeSlot, true, builds, walkCtx);
  const other =
    t.other && c.level >= PRESET_LEVEL
      ? view(t.other, activeSlot === 0 ? 1 : 0, false, builds, walkCtx)
      : null;
  if (other) {
    active.lb = lowerBounds(active.talents, other.talents, kb.talents.tab2Granting, tabs);
    other.lb = lowerBounds(other.talents, active.talents, kb.talents.tab2Granting, tabs);
    active.next = spendableNext(active);
    other.next = spendableNext(other);
  }
  const elite = (p: PresetTalents | null) => !!p && (tabSpent(p, 4) > 0 || tabSpent(p, 5) > 0);
  return {
    index: c.index,
    classLine: line,
    // M26: an AFK Target a skilling Build serves (Cooking for a Blood Berserker) needs the skilling preset.
    neededRole:
      neededRoleOf(c.afkType) ??
      (c.afkType !== null && builds.skilling?.entry.serves.includes(c.afkType as never) ? 'skilling' : null),
    builds,
    active,
    other,
    eliteSpend: elite(t.active) || elite(t.other),
    walkCtx,
    tabs,
  };
}

/** M26: a class whose own Build is an elite or master one (the Builds that run past World 4). */
export function lateBuild(kb: BuildsKnowledge, cls: string): boolean {
  const tier = kb.tierOf(cls);
  return (tier === 'elite' || tier === 'master') && kb.lineOf(cls) === cls;
}

const memo = new WeakMap<AccountState, WeakMap<FactLookup, AccountAnalysis>>();

/** The whole account's analysis, cached per state and lookup (Detectors share it within one run). */
export function analyzeAccount(state: AccountState, facts: FactLookup): AccountAnalysis {
  let byFacts = memo.get(state);
  const hit = byFacts?.get(facts);
  if (hit) return hit;
  const kb = buildsKnowledge(facts);
  const s = detectStage(state, facts);
  const out: AccountAnalysis = {
    stage: s.id,
    beyond: s.coverage === 'beyond',
    characters: new Map(),
    notCovered: new Map(),
    eliteTabs: [],
    viewOnly: new Map(),
    kb,
  };
  for (const c of state.characters) {
    // Past World 4 no M9 Goal fires (FR-21); the Build view shows a character's own elite or master
    // Build (M26: those run into World 5 and later), never the W1-W4 Builds, which stop at World 4.
    if (out.beyond) {
      if (kb.tierOf(c.class) !== null) out.notCovered.set(c.index, 'beyond');
      const a = lateBuild(kb, c.class) ? analyzeCharacter(c, state, kb, s.id, true) : null;
      if (a !== null && typeof a !== 'string') out.viewOnly.set(c.index, a);
      continue;
    }
    const a = analyzeCharacter(c, state, kb, s.id, false);
    if (a === null) continue;
    if (typeof a === 'string') out.notCovered.set(c.index, a);
    else {
      out.characters.set(c.index, a);
      // An elite or master tab is covered once one of the character's Builds names it (M26).
      const own = (kb.talentTabsOf(c.class) ?? []).length;
      if (own >= 4 && !a.tabs.includes(own as TabNo)) out.eliteTabs.push(c.index);
    }
  }
  if (!byFacts) {
    byFacts = new WeakMap();
    memo.set(state, byFacts);
  }
  byFacts.set(facts, out);
  return out;
}

// ---------- the rules ----------

/** FR-3: the role to swap to, when the other preset has the role the AFK Target needs and the active one doesn't. */
export function wrongPreset(a: CharacterAnalysis): { toRole: PresetRole; fromClass: PresetClass } | null {
  const need = a.neededRole;
  if (!need || !a.other) return null;
  const from = a.active.cls;
  if (from === need || from === 'unclassified') return null; // FR-5
  if (a.other.cls !== need) return null; // FR-4
  return { toRole: need, fromClass: from };
}

export interface AttackBar {
  onBar: number[];
  levelled: number[];
  missing: number[];
}

/** FR-13: an AFK fighter on its fighting preset; null when the rule doesn't apply or the bar is unreadable. */
export function attackBar(a: CharacterAnalysis, kb: BuildsKnowledge): AttackBar | null {
  if (a.neededRole !== 'fighting' || a.active.cls !== 'fighting') return null;
  const bar = a.active.talents.attackBar;
  if (bar === null) return null;
  const onBar = bar.filter((id) => kb.talents.isAttack(id));
  const levelled: number[] = [];
  for (const t of a.active.talents.tabs)
    if (a.tabs.includes(t.tab))
      for (const x of t.talents)
        if (x.base >= 1 && kb.talents.isAttack(x.id) && !levelled.includes(x.id)) levelled.push(x.id);
  return { onBar, levelled, missing: levelled.filter((id) => !bar.includes(id)) };
}

/** FR-14: the skill attack of the AFK skill, levelled on the skilling preset and not on its bar. */
export function missingSkillAttack(
  a: CharacterAnalysis,
  kb: BuildsKnowledge,
  afkType: string | null,
): number | null {
  if (a.neededRole !== 'skilling' || a.active.cls !== 'skilling' || afkType === null) return null;
  const id = kb.talents.skillAttackOf(afkType);
  const bar = a.active.talents.attackBar;
  if (id === null || bar === null || bar.includes(id)) return null;
  return levelOf(a.active.talents, id) >= 1 ? id : null;
}

export interface SetupFinding {
  mode: 'empty' | 'incomplete';
  target: PresetView;
  role: PresetRole;
  build: ResolvedBuild;
  points: number;
  firstSteps: StepState[];
  swapBack: boolean;
}

/** FR-7, FR-8 (and FR-4's empty/incomplete case): the preset to set up, its role and first steps. */
export function presetSetup(a: CharacterAnalysis): SetupFinding | null {
  const { active, other } = a;
  if (!other) return null;
  const unset = (v: PresetView) => v.cls === 'empty' || v.cls === 'incomplete';
  const target =
    unset(active) && unset(other) ? active : unset(other) ? other : unset(active) ? active : null;
  if (!target) return null;
  const base = target === active ? other : active;
  const role =
    base.cls === 'fighting' || base.cls === 'skilling' ? otherRole(base.cls) : (a.neededRole ?? 'skilling');
  const build = a.builds[role];
  if (!build) return null;
  const states = walk(target.talents, build, a.walkCtx).filter((s) => !s.met);
  return {
    mode: target.cls === 'empty' ? 'empty' : 'incomplete',
    target,
    role,
    build,
    points: target.lb?.total ?? 0,
    firstSteps: states.slice(0, 2),
    swapBack: target === other && a.neededRole !== null && active.cls === a.neededRole,
  };
}

/** FR-4: both presets hold the role the AFK Target doesn't need. */
export function sameRole(a: CharacterAnalysis): { role: PresetRole; build: ResolvedBuild } | null {
  const need = a.neededRole;
  if (!need || !a.other) return null;
  const have = otherRole(need);
  if (a.active.cls !== have || a.other.cls !== have) return null;
  const build = a.builds[need];
  return build ? { role: need, build } : null;
}

/** FR-9: the preset with the largest lower bound, when at least `minPoints`. */
export function presetBehind(
  a: CharacterAnalysis,
  minPoints: number,
): { preset: PresetView; tabs: TabNo[]; firstSteps: StepState[] } | null {
  const candidates = [a.active, a.other].filter(
    (v): v is PresetView =>
      !!v && v.cls !== 'empty' && v.cls !== 'incomplete' && (v.lb?.total ?? 0) >= minPoints,
  );
  candidates.sort(
    (x, y) => (y.lb?.total ?? 0) - (x.lb?.total ?? 0) || Number(y.isActive) - Number(x.isActive),
  );
  const p = candidates[0];
  if (!p?.lb) return null;
  const lb = p.lb;
  const tabs = a.tabs.filter((t) => lb.byTab[t] > 0);
  // One step per tab with points waiting, the preset's next step first (the same rule as the Build view).
  const open = spendableStates(p);
  const lead = p.next?.tab;
  const order = [...tabs].sort((x, y) => Number(y === lead) - Number(x === lead) || x - y);
  const firstSteps = order.flatMap((t) => {
    const s = nextStep(open.filter((x) => x.tab === t));
    return s ? [s] : [];
  });
  return { preset: p, tabs, firstSteps };
}

export interface NextStepFinding {
  preset: PresetView;
  state: StepState;
  /** The lower bound on that tab of that preset (0 without another preset). */
  tabPoints: number;
}

/** FR-11 precedence over both presets: core before non-core, then the preset the AFK Target needs (else the active one). */
export function bestNextStep(a: CharacterAnalysis): NextStepFinding | null {
  const views = [a.active, a.other].filter((v): v is PresetView => !!v && v.next !== null);
  const preferred = (v: PresetView) => (a.neededRole ? v.cls === a.neededRole : v.isActive);
  views.sort(
    (x, y) =>
      Number(y.next?.step.core) - Number(x.next?.step.core) ||
      Number(preferred(y)) - Number(preferred(x)) ||
      Number(y.isActive) - Number(x.isActive),
  );
  const v = views[0];
  if (!v?.next) return null;
  return { preset: v, state: v.next, tabPoints: v.lb?.byTab[v.next.tab] ?? 0 };
}

export interface ResetFinding {
  preset: PresetView;
  wrong: WrongRole;
  potions: number;
  fragments: number;
  /** The talent to look for in game: the one this preset has most above the other preset. */
  check: { id: number; level: number } | null;
}

/** FR-15 (conditions 1, 2, 4, 5; condition 3 is the owned items). `fresh` filters Builds the bundle marks Stale. */
export function resetCandidate(
  a: CharacterAnalysis,
  minWrongRolePoints: number,
  items: { potions: number; fragments: number } | null,
  fresh: (b: ResolvedBuild) => boolean = () => true,
): ResetFinding | null {
  if (a.eliteSpend || !items) return null;
  if (items.potions < 1 && items.fragments < FRAGMENTS_PER_POTION) return null;
  let best: ResetFinding | null = null;
  for (const v of [a.active, a.other]) {
    if (!v || (v.cls !== 'fighting' && v.cls !== 'skilling') || !v.build) continue;
    const otherBuild = a.builds[otherRole(v.cls)];
    if (!otherBuild || v.build.stale || v.build.contested || !fresh(v.build)) continue;
    const wrong = wrongRolePoints(v.talents, v.build, otherBuild, a.walkCtx);
    if (wrong.points < minWrongRolePoints) continue;
    if (best && best.wrong.points >= wrong.points) continue;
    const q = v === a.active ? a.other?.talents : a.active.talents;
    let check: ResetFinding['check'] = null;
    for (const t of v.talents.tabs)
      if (t.tab <= 3)
        for (const x of t.talents) {
          const lead = x.base - (q ? levelOf(q, x.id) : 0);
          if (lead > 0 && (!check || lead > check.level - (q ? levelOf(q, check.id) : 0)))
            check = { id: x.id, level: x.base };
        }
    best = { preset: v, wrong, potions: items.potions, fragments: items.fragments, check };
  }
  return best;
}

export { spent };
