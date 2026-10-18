// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 as an engine-core module (M10 §2): it hands the core the Stage, the resolved Priority List that
// `compareGoals` ranks every module's Goals against, the Visit Order hints from Roles, and the Meta
// Path Goals (push, subclass, W3 tutorial, elite, next character, swap token).
import type {
  CharacterContribution,
  EngineHistory,
  EngineInput,
  EngineModule,
  ModuleOutput,
} from '../core/module';
import type { NextAction } from '../result';
import { type FamilyPoint, familyUnlock } from './family';
import { familyUnlockGoal, metaPathGoals } from './goals';
import { runMetaPath } from './index';
import { lookupOf } from './knowledge';
import type { MetaPathResult } from './types';

/** "Not covered yet" for accounts past W4-entry (M2 FR-5, D2). */
export const WORLDS_5_7_NOT_COVERED = { systemId: 'worlds-5-7', label: 'Worlds 5–7' } as const;

/** M15 TR-8: each saved history entry as a family-level pace point. */
export const familyPoints = (history: EngineHistory): FamilyPoint[] =>
  history.entries.map((e) => ({
    at: e.lastCloudSave,
    familyLevel: e.state.account.accountLevel ?? null,
    characters: e.state.characters.length + e.state.diagnostics.unreadableCharacters.length,
  }));

/** EngineResult.stage: `unknown` when the Stage can't be told (M10's "Can't tell" banner). */
export const engineStage = (r: MetaPathResult) => ({
  id: r.stage.id ?? 'unknown',
  label: r.stage.label,
  needs: r.stage.next?.needs ?? [],
});

export interface MetaPathModuleOptions {
  /**
   * M15 FR-15: the account's top Class XP Next Action (M4's `classes.goal.level`), which becomes the
   * next family unlock's Next Action; without it the unlock stays an Account info line.
   */
  classXpAction?: (input: EngineInput) => NextAction | null;
}

export const createMetaPathModule = (opts: MetaPathModuleOptions = {}): EngineModule => ({
  id: 'meta-path',
  covers: ['stage'],
  dependsOnExpectedReturn: false,
  affectsVerdict: false,
  run(input): ModuleOutput {
    // No Knowledge Base (it didn't load, or a test runs without one): no Stage, the core says so.
    const kb = input.knowledge.kb;
    if (!kb) return {};
    const r = runMetaPath(input.state, kb, input.now);
    const goals = metaPathGoals(kb, lookupOf(kb), r);
    // M15 F3: the next family unlock replaces M2 FR-9's closed-slot note (FR-17, D-4).
    const unlock =
      r.stage.coverage === 'beyond'
        ? null
        : familyUnlock(input.state, lookupOf(kb), r.stage, r.roster, familyPoints(input.history), input.now);
    const unlockGoal = unlock ? familyUnlockGoal(kb, unlock, opts.classXpAction?.(input) ?? null) : null;
    const characters: CharacterContribution[] = [];
    for (const { subject, goal } of goals) {
      if (subject === 'account') continue;
      const index = Number(subject.slice(1));
      let c = characters.find((x) => x.index === index);
      if (!c) {
        c = { index, goals: [] };
        characters.push(c);
      }
      c.goals?.push({ goal });
    }
    return {
      characters,
      account: {
        goals: [
          ...goals.filter((g) => g.subject === 'account').map(({ goal }) => ({ goal })),
          ...(unlockGoal ? [{ goal: unlockGoal, rank: { urgency: 'banked' as const } }] : []),
        ],
      },
      stage: engineStage(r),
      priorityList: r.list,
      visitHints: r.visitHints,
      notCovered: r.stage.coverage === 'beyond' ? [WORLDS_5_7_NOT_COVERED] : [],
    };
  },
});

/** M2 without M4's Class XP hook (tests, and the core's DEFAULT_MODULES). */
export const metaPathModule: EngineModule = createMetaPathModule();
