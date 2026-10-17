// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 as an engine-core module (M10 §2): it hands the core the Stage, the resolved Priority List that
// `compareGoals` ranks every module's Goals against, and the Visit Order hints from Roles.
import type { EngineModule, ModuleOutput } from '../core/module';
import { runMetaPath } from './index';
import type { MetaPathResult } from './types';

/** "Not covered yet" for accounts past W4-entry (M2 FR-5, D2). */
export const WORLDS_5_7_NOT_COVERED = { systemId: 'worlds-5-7', label: 'Worlds 5–7' } as const;

/** EngineResult.stage: `unknown` when the Stage can't be told (M10's "Can't tell" banner). */
export const engineStage = (r: MetaPathResult) => ({
  id: r.stage.id ?? 'unknown',
  label: r.stage.label,
  needs: r.stage.next?.needs ?? [],
});

export const metaPathModule: EngineModule = {
  id: 'meta-path',
  covers: ['stage'],
  dependsOnExpectedReturn: false,
  affectsVerdict: false,
  run(input): ModuleOutput {
    // No Knowledge Base (it didn't load, or a test runs without one): no Stage, the core says so.
    const kb = input.knowledge.kb;
    if (!kb) return {};
    const r = runMetaPath(input.state, kb, input.now);
    return {
      stage: engineStage(r),
      priorityList: r.list,
      visitHints: r.visitHints,
      notCovered: r.stage.coverage === 'beyond' ? [WORLDS_5_7_NOT_COVERED] : [],
    };
  },
};
