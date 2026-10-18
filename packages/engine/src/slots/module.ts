// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 as two engine modules (docs/specs/M20-skills-parallel-slots.md TR-1). `m20-slots` runs with the
// other modules: the slot Goals (so M14's step can attach the Trapping quest Walkthrough), the reset
// Goals and Active Play, the Timeline bars, the Skills tabs, the System page pictures and the Skill Grid.
// `m20-checklist` runs after every module (`after: true`, M14 TR-1) and builds the Daily & Weekly
// Checklist on their merged result, so each row links to the Goal that already carries it (FR-8).
// Neither sets a Verdict or a blocker (M20 adds no blocker of any kind).
import type { SkillId } from '@idleon-forge/account-state';
import { buildChecklist } from '../checklist/build';
import { buildResetGoals } from '../checklist/goals';
import type { EngineInput, EngineModule, ModuleOutput } from '../core/module';
import { runMetaPath } from '../metapath';
import { buildSlots } from './build';
import type { M20Knowledge } from './kb';
import { buildSkillGrid, buildSkills } from './skills';

export interface M20ModuleDeps {
  kb: M20Knowledge;
}

function meta(input: EngineInput) {
  const full = input.knowledge.kb;
  return full ? runMetaPath(input.state, full, input.now) : null;
}

export function createSlotsModule(deps: M20ModuleDeps): EngineModule {
  return {
    id: 'm20-slots',
    covers: [],
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    run(input: EngineInput): ModuleOutput {
      if (!input.knowledge.kb) return {};
      const m = meta(input);
      const erMs = input.options.expectedReturnSeconds * 1000;
      const slots = buildSlots(input.state, deps.kb, m, input.now, erMs);
      const resets = buildResetGoals(input.state, deps.kb, m, input.now, erMs);
      const shown = new Set(slots.goals.map((g) => g.goal.nextAction.key));
      const slotGoalKey = (skill: SkillId, index: number) =>
        slots.fired.find(
          (f) => shown.has(f.key) && f.targets.some((t) => t.index === index && t.skill === skill),
        )?.key ?? null;
      const skills = buildSkills({ state: input.state, kb: deps.kb, meta: m, pips: slots.pips, slotGoalKey });
      const top = slots.fired.find((f) => shown.has(f.key));
      const target = top?.targets[0] ?? null;
      return {
        account: { goals: [...resets.goals, ...slots.goals], activePlay: resets.activePlay },
        timeline: resets.timeline,
        skills,
        slotPictures: slots.pictures,
        skillGrid: buildSkillGrid(input.state, skills, target),
      };
    },
  };
}

export function createChecklistModule(deps: M20ModuleDeps): EngineModule {
  return {
    id: 'm20-checklist',
    covers: [],
    dependsOnExpectedReturn: true,
    affectsVerdict: false,
    after: true,
    run(input: EngineInput, prior): ModuleOutput {
      if (!input.knowledge.kb) return {};
      const checklist = buildChecklist({
        state: input.state,
        kb: deps.kb,
        meta: meta(input),
        now: input.now,
        expectedReturnMs: input.options.expectedReturnSeconds * 1000,
        history: input.history.entries,
        ...(prior ? { prior } : {}),
      });
      return { checklist };
    },
  };
}

/** Both M20 modules, in registration order. */
export const createM20Modules = (deps: M20ModuleDeps): EngineModule[] => [
  createSlotsModule(deps),
  createChecklistModule(deps),
];
