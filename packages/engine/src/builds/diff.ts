// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build walk (M9 FR-11, TR-5): which steps apply, which are met, the preset's next step, and the
// wrong-role points behind a reset suggestion (FR-15).
import type { PresetTalents } from '@idleon-forge/account-state';
import { type StageId, stageIndex } from '@idleon-forge/knowledge';
import { levelOf, maxOf } from './classify';
import type { ResolvedBuild, ResolvedStep, TabNo } from './knowledge';

export interface WalkContext {
  /** M2's Stage id; null when unknown (a stage condition then can't be evaluated). */
  stage: StageId | null;
  bubbleCapped: ReadonlySet<number>;
  /** M26: the account is past World 4 (M2 `coverage: 'beyond'`), so steps with a `stageHint` apply. */
  beyond?: boolean;
}

type Applies = 'yes' | 'no' | 'unknown';

/** TR-5: all conditions must hold; one that can't be evaluated makes the step "unknown". */
export function stepApplies(step: ResolvedStep, ctx: WalkContext): Applies {
  // M26: a step for World 5 or later stays silent until the account is past World 4.
  if (step.stageHint && ctx.beyond !== true) return 'no';
  let unknown = false;
  for (const c of step.when) {
    if (c.kind === 'accuracyShort')
      unknown = true; // no M5 hit chance at MVP ship (TR-5, R10)
    else if (ctx.stage === null) unknown = true;
    else if (stageIndex(ctx.stage) < stageIndex(c.stage)) return 'no';
  }
  return unknown ? 'unknown' : 'yes';
}

/** The step's target level in this save; null when it can't be reached (no such talent or max ≤ 0). */
export function targetOf(p: PresetTalents, step: ResolvedStep): number | null {
  const max = maxOf(p, step.id, step.tab);
  if (step.target === 'max') return max > 0 ? max : null;
  return step.target;
}

export interface StepState {
  tab: TabNo;
  step: ResolvedStep;
  target: number;
  current: number;
  met: boolean;
}

/** Every applicable step of the Build with its state. Unknown conditions and bubble-capped talents count as met (never nag). */
export function walk(p: PresetTalents, b: ResolvedBuild, ctx: WalkContext): StepState[] {
  const out: StepState[] = [];
  for (const t of b.tabs)
    for (const step of t.steps) {
      const applies = stepApplies(step, ctx);
      if (applies === 'no') continue;
      const target = targetOf(p, step);
      const current = levelOf(p, step.id, step.tab);
      const forcedMet = applies === 'unknown' || ctx.bubbleCapped.has(step.id) || target === null;
      out.push({
        tab: t.tab,
        step,
        target: target ?? current,
        current,
        met: forcedMet || current >= (target as number),
      });
    }
  return out;
}

/** FR-11: the first unmet core step in tab order, else the first unmet step in the lowest tab. */
export function nextStep(states: readonly StepState[]): StepState | null {
  return states.find((s) => !s.met && s.step.core) ?? states.find((s) => !s.met) ?? null;
}

export interface WrongRole {
  points: number;
  /** Talents and their points, most first. */
  talents: { id: number; talent: string; points: number }[];
}

/**
 * FR-15 condition 2: points in talents of the other role's Build that this Build does not name, plus
 * points above the target on evaluable `hardCap` steps. Bubble-capped talents and steps whose condition
 * can't be evaluated never count (TR-5).
 */
export function wrongRolePoints(
  p: PresetTalents,
  mine: ResolvedBuild,
  other: ResolvedBuild,
  ctx: WalkContext,
): WrongRole {
  const counted = new Map<number, { talent: string; points: number }>();
  for (const t of other.tabs)
    for (const s of t.steps) {
      if (mine.stepIds.has(s.id) || counted.has(s.id) || ctx.bubbleCapped.has(s.id)) continue;
      if (stepApplies(s, ctx) === 'unknown') continue;
      const points = levelOf(p, s.id, s.tab);
      if (points > 0) counted.set(s.id, { talent: s.talent, points });
    }
  for (const t of mine.tabs)
    for (const s of t.steps) {
      if (!s.hardCap || stepApplies(s, ctx) !== 'yes' || ctx.bubbleCapped.has(s.id)) continue;
      const target = targetOf(p, s);
      const over = target === null ? 0 : levelOf(p, s.id, s.tab) - target;
      if (over > 0) counted.set(s.id, { talent: s.talent, points: over + (counted.get(s.id)?.points ?? 0) });
    }
  const talents = [...counted]
    .map(([id, x]) => ({ id, ...x }))
    .sort((a, b) => b.points - a.points || a.id - b.id);
  return { points: talents.reduce((n, x) => n + x.points, 0), talents };
}
