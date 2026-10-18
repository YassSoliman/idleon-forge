// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The engine root: the core and its module contract. Worker-side only (M10 TR-1): the UI thread
// imports `@idleon-forge/engine/now` (the view layer) and types from `@idleon-forge/engine/result`.
export {
  AFK_SAFETY_NOT_COVERED,
  assemble,
  createEngine,
  DEFAULT_MODULES,
  type Engine,
  runEngine,
  STAGE_NOT_COVERED,
} from './core/engine';
export { assertInvariants, InvariantError, invariantViolations } from './core/invariants';
export { activityLabel, classLabel, mapLabel, NO_ACTIVITY, UNKNOWN_ACTIVITY } from './core/labels';
export type {
  CharacterContribution,
  EngineHistory,
  EngineHistoryEntry,
  EngineInput,
  EngineModule,
  KnowledgePort,
  ModuleGoal,
  ModuleOutput,
  RankHints,
  ToolboxPort,
} from './core/module';
export { applyContestedRule, dedupe, rankGoals, type TaggedGoal } from './core/rank';
export { type VisitCandidate, visitOrder } from './core/visit-order';
export { metaPathModule } from './metapath/module';
export { compareGoals, EMPTY_PRIORITY_LIST, positionOf } from './metapath/priority';
export type { Rankable, ResolvedPriorityList, VisitHint } from './metapath/types';
export type * from './result';
