// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build path (M21 FR-C1, FR-C2, FR-C11 to FR-C13; TR-8): every Build step of one tab in spend order,
// banded by what the tab's known points pay for, with the running total from now through each step.
// One `spendOrder` feeds both the path and "Next points", so they never disagree. Steps that share a
// `tie` key are one row whose need is the members' sum, split evenly. The star tab (one pool across its
// four pages) uses the same banding, with exact known points (FR-C10). Pure; arithmetic on save data
// and Toolbox's own totals (ADR 0005).
import type { PresetTalents } from '@idleon-forge/account-state';
import { STAGE_DEFINITIONS, type StageId, stageIndex } from '@idleon-forge/knowledge';
import type { BuildKnownPoints, BuildPathStepView, BuildTabView } from '../result';
import { levelOf, maxOf } from './classify';
import { stepApplies, targetOf, type WalkContext } from './diff';
import {
  type BuildsKnowledge,
  type ResolvedBuild,
  type ResolvedStarBuild,
  type ResolvedStarStep,
  talentLabel,
} from './knowledge';

const stageLabel = (id: string) => STAGE_DEFINITIONS[id as StageId]?.label ?? id;
const n = (x: number) => x.toLocaleString('en-US');

/** A step's note when only an accuracy shortfall makes it apply (M9 can't tell). */
export const ACCURACY_NOTE = 'if your accuracy is short';
/** A step's note when the save's max is below the Build's target. */
export const MAX_NOTE = 'its max for now';
/** The star tab's `BuildTabView.tab` number (tabs 1–5 are the class tabs). */
export const STAR_TAB = 0;
/** Stonks! (id 622): its levels add star points (Toolbox `calcTotalStarTalent`). */
export const STONKS_ID = 622;
/** FR-C10: unspent star points within this band read "all spent" (a patch may add an unmodelled source). */
export const STAR_TOLERANCE = { low: -2, high: 1 } as const;

/**
 * M9 FR-11 and M21 FR-C11: core steps first, then the Build's order. Steps sharing a `tie` key form one
 * group, placed where its first member falls. Feeds the path and Next points alike.
 */
export function spendOrder<T extends { core: boolean; tie: string | null }>(steps: readonly T[]): T[][] {
  const ordered = [...steps.filter((s) => s.core), ...steps.filter((s) => !s.core)];
  const out: T[][] = [];
  const byTie = new Map<string, T[]>();
  for (const s of ordered) {
    if (s.tie === null) {
      out.push([s]);
      continue;
    }
    const g = byTie.get(s.tie);
    if (g) g.push(s);
    else {
      const fresh = [s];
      byTie.set(s.tie, fresh);
      out.push(fresh);
    }
  }
  return out;
}

/** One talent of a path row, resolved against the save. */
export interface PathMember {
  id: number;
  label: string;
  page: number | null;
  current: number;
  goal: number;
  core: boolean;
  /** Not applicable yet: shown in the later band with these words, outside the totals. */
  later: string | null;
  /** Needs no points (a bubble sets it, or the useful cap is 0): a done-style row with these words. */
  fixed: string | null;
  note: string | null;
}

/**
 * Bands the groups (FR-C1): done, can add now (`now`), part now, next after these, later. `known` is
 * the points the tab can spend now; null or 0 means none are known, so every unmet step is "next".
 */
export function bandPath(
  groups: readonly PathMember[][],
  known: number | null,
  keyBase: string,
): BuildPathStepView[] {
  const budget = known ?? 0;
  const sim = new Map<number, number>();
  const out: BuildPathStepView[] = [];
  let total = 0;
  const base = (m: PathMember, key: string) => ({
    key,
    talentId: m.id,
    label: m.label,
    page: m.page,
    core: m.core,
    condition: null,
    partNow: null,
  });
  for (const [i, group] of groups.entries()) {
    const key = `${keyBase}-${i}`;
    const sub = (j: number) => (group.length > 1 ? `${key}-${j}` : key);
    const members = group.map((m, j) => ({ m: { ...m, current: sim.get(m.id) ?? m.current }, k: sub(j) }));
    // In place: members at their goal first, then the members that take points (one row; a tie when
    // more than one), then the ones that wait (later) or need no points (set by a bubble).
    const active = members.filter(({ m }) => m.later === null && m.fixed === null && m.current < m.goal);
    for (const { m, k } of members)
      if (m.later === null && m.fixed === null && m.current >= m.goal)
        out.push({
          ...base(m, k),
          current: m.current,
          goal: m.goal,
          need: 0,
          cumulative: null,
          band: 'done',
          note: m.note,
        });
    if (active.length > 0) {
      const list = active.map((x) => x.m);
      const first = list[0] as PathMember;
      const need = list.reduce((s, m) => s + (m.goal - m.current), 0);
      const tie = list.length > 1;
      const parts = tie
        ? `split evenly: ${list.map((m) => `${m.label} ${n(m.current)} → ${n(m.goal)}`).join(', ')}`
        : null;
      const note = [parts, ...list.map((m) => m.note)].filter((x): x is string => !!x).join(' · ');
      const before = total;
      total += need;
      for (const m of list) sim.set(m.id, m.goal);
      const band = total <= budget ? 'now' : before < budget ? 'part' : 'next';
      out.push({
        ...base(first, (active[0] as { k: string }).k),
        label: tie ? list.map((m) => m.label).join(' = ') : first.label,
        core: list.some((m) => m.core),
        // A tie row carries its first member's levels (its `talentId`), so every surface names one talent's
        // level the same way (M22 same-fact-everywhere); the members' levels are in the note.
        current: first.current,
        goal: first.goal,
        need,
        cumulative: total,
        band,
        partNow: band === 'part' ? budget - before : null,
        note: note || null,
      });
    }
    for (const { m, k } of members) {
      if (m.later !== null)
        out.push({
          ...base(m, k),
          current: m.current,
          goal: m.goal,
          need: Math.max(0, m.goal - m.current),
          cumulative: null,
          band: 'later',
          condition: m.later,
          note: m.note,
        });
      else if (m.fixed !== null)
        out.push({
          ...base(m, k),
          current: m.current,
          goal: m.goal,
          need: 0,
          cumulative: null,
          band: 'done',
          note: m.fixed,
        });
    }
  }
  return out;
}

// ---------- tabs 1–3 ----------

/** The class Build's members for one tab, in spend order (M9 TR-5 targets and conditions). */
export function classGroups(
  p: PresetTalents,
  b: ResolvedBuild,
  tab: number,
  ctx: WalkContext,
  kb: BuildsKnowledge,
): PathMember[][] {
  const t = b.tabs.find((x) => x.tab === tab);
  if (!t) return [];
  const out: PathMember[][] = [];
  for (const group of spendOrder(t.steps)) {
    const members: PathMember[] = [];
    for (const step of group) {
      const target = targetOf(p, step);
      const max = maxOf(p, step.id);
      // Not on this preset's tabs, or locked (max ≤ 0): no step to show.
      if (target === null || max <= 0) continue;
      const goal = Math.min(target, max);
      const stage = step.when.find((c) => c.kind === 'stageAtLeast');
      const accuracy = step.when.some((c) => c.kind === 'accuracyShort');
      const gated = stage && stage.kind === 'stageAtLeast' && stepApplies(step, ctx) !== 'yes' && !accuracy;
      members.push({
        id: step.id,
        label: talentLabel(step.talent),
        page: null,
        current: levelOf(p, step.id),
        goal,
        core: step.core,
        later: gated && stage.kind === 'stageAtLeast' ? `from ${stageLabel(stage.stage)}` : null,
        fixed: kb.talents.bubbleCapped.has(step.id) ? 'set by a bubble' : null,
        note: accuracy ? ACCURACY_NOTE : goal < target ? MAX_NOTE : null,
      });
    }
    if (members.length) out.push(members);
  }
  return out;
}

// ---------- the star tab ----------

/** FR-C12: what the useful caps read from the account. */
export interface StarContext {
  /** The highest class level on the account. */
  bestLevel: number;
  /** The highest Beginner-line level (Beginner, Journeyman, Maestro, Voidwalker); 0 with none. */
  bestBeginner: number;
  stage: WalkContext;
}

const AFK_WORDS: Record<string, string> = {
  MINING: 'Mining',
  CHOPPIN: 'Choppin',
  FISHING: 'Fishing',
  CATCHING: 'Catching',
};
const listWords = (xs: readonly string[]) =>
  xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;

/** The star Build's members (FR-C11 to FR-C13). `serves` is null when what the preset serves is unknown. */
export function starGroups(
  p: PresetTalents,
  b: ResolvedStarBuild,
  serves: readonly string[] | null,
  ctx: StarContext,
  kb: BuildsKnowledge,
): PathMember[][] {
  const out: PathMember[][] = [];
  for (const group of spendOrder(b.steps)) {
    const members: PathMember[] = [];
    for (const step of group) {
      const m = starMember(p, step, serves, ctx, kb);
      if (m) members.push(m);
    }
    if (members.length) out.push(members);
  }
  return out;
}

function starMember(
  p: PresetTalents,
  step: ResolvedStarStep,
  serves: readonly string[] | null,
  ctx: StarContext,
  kb: BuildsKnowledge,
): PathMember | null {
  let note: string | null = null;
  if (step.servesAny) {
    if (serves !== null && !serves.some((s) => step.servesAny?.includes(s))) return null;
    if (serves === null) note = `only helps ${listWords(step.servesAny.map((a) => AFK_WORDS[a] ?? a))}`;
  }
  const t = p.star.find((x) => x.id === step.id);
  const current = t?.base ?? 0;
  const max = t?.max ?? 0;
  const label = talentLabel(step.talent);
  const stage = step.when.find((c) => c.kind === 'stageAtLeast');
  let target: number;
  let fixed: string | null = null;
  if (typeof step.target === 'number') target = step.target;
  else if (step.target === 'max') target = max;
  else if (step.target.cap === 'best-level-tenth') {
    target = Math.floor(ctx.bestLevel / 10);
    note = `useful up to ${n(target)} (best level ${n(ctx.bestLevel)})`;
  } else {
    target = Math.floor(ctx.bestBeginner / 10);
    if (target <= 0) fixed = 'no Beginner-line character yet';
    else note = `useful up to ${n(target)} (best Beginner-line level ${n(ctx.bestBeginner)})`;
  }
  if (max <= 0) {
    const book = kb.starBookOf(step.talent);
    return {
      id: step.id,
      label,
      page: step.page,
      current,
      goal: Math.max(0, target),
      core: step.core,
      later: book ? `find its book (${book})` : 'find its book',
      fixed: null,
      note,
    };
  }
  const goal = Math.min(target, max);
  if (goal < target && step.target !== 'max') note = note ? `${note}; its max for now` : 'its max for now';
  if (step.id === STONKS_ID && current < goal) note = 'pays for itself: it returns star points as it levels';
  const now = ctx.stage.stage;
  const gated =
    stage && stage.kind === 'stageAtLeast' && now !== null && stageIndex(now) < stageIndex(stage.stage);
  return {
    id: step.id,
    label,
    page: step.page,
    current,
    goal,
    core: step.core,
    later: gated && stage.kind === 'stageAtLeast' ? `from ${stageLabel(stage.stage)}` : null,
    fixed: fixed ?? (goal <= 0 && current <= 0 ? 'nothing to add yet' : null),
    note,
  };
}

const starSpent = (p: PresetTalents) => p.star.reduce((s, x) => s + x.base, 0);

/**
 * FR-C10: exact star known points from Toolbox's total. Over budget at −3 or less, "all spent" from −2
 * to 1, else the count. Without a total, M9 TR-7's lower bound against the other preset.
 */
export function starKnown(
  total: number | null,
  p: PresetTalents,
  other: PresetTalents | null,
): BuildKnownPoints {
  const spent = starSpent(p);
  if (total !== null) {
    const un = total - spent;
    if (un < STAR_TOLERANCE.low) return { kind: 'exact', points: 0, overBy: -un };
    if (un <= STAR_TOLERANCE.high) return { kind: 'exact', points: 0, overBy: null };
    return { kind: 'exact', points: un, overBy: null };
  }
  if (other) return { kind: 'lower-bound', points: Math.max(0, starSpent(other) - spent), overBy: null };
  return { kind: 'none', points: null, overBy: null };
}

/** The star tab as one more tab (FR-C13): its known points, path over the whole pool, and other talents. */
export function starTab(
  p: PresetTalents,
  b: ResolvedStarBuild | null,
  known: BuildKnownPoints,
  serves: readonly string[] | null,
  ctx: StarContext,
  kb: BuildsKnowledge,
  slot: number,
): BuildTabView {
  const path = b ? bandPath(starGroups(p, b, serves, ctx, kb), known.points, `p-s${slot}-star`) : [];
  const named = new Set(b?.stepIds ?? []);
  return {
    tab: STAR_TAB,
    name: 'Star talents',
    spent: starSpent(p),
    unspent: known.points,
    rows: [],
    others: p.star
      .filter((x) => x.base > 0 && !named.has(x.id))
      .sort((a, c) => c.base - a.base || a.id - c.id)
      .map((x) => ({ label: talentLabel(kb.talents.nameOf(x.id) ?? String(x.id)), level: x.base })),
    known,
    path,
  };
}
