// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M2 Stage & Meta Path (docs/specs/M2-stage-meta-path.md): where the account is on the route, who on the
// team does what, who pushes, and the one ranking every module's Goals go through. Everything here is a
// pure function of (state, kb, now): no toolbox-parsers import, no clock, no storage, no network (TR-1).
import type { AccountState } from '@idleon-forge/account-state';
import { elitePending, pushGoal, rosterGoals, subclassPending, worldTutorial } from './gate-chain';
import { lookupOf } from './knowledge';
import { selectPriorityList } from './priority';
import { selectPusher } from './pusher';
import { assignRoles, visitHints } from './roles';
import { analyzeRoster } from './roster';
import { detectStage } from './stage';
import type { FactLookup, MetaPathKnowledge, MetaPathResult } from './types';

export {
  BEHIND_ID,
  type BehindInput,
  type BehindResult,
  behindRows,
  behindStep,
  DEFAULT_MIN_CHARACTER_LEVEL,
  EXPECTATIONS_ID,
  type StageExpectationRow,
  stageExpectations,
} from './behind';
export { METAPATH_DETECTORS } from './detectors';
export {
  FAMILY_UNLOCK_ID,
  type FamilyEta,
  type FamilyGate,
  type FamilyPoint,
  type FamilyUnlock,
  familyEta,
  familyGates,
  familyPace,
  familyUnlock,
  obolAltarDone,
} from './family';
export {
  ELITE_ORDER,
  elitePending,
  frontierRoute,
  pushGoal,
  rosterGoals,
  subclassPending,
  worldTutorial,
} from './gate-chain';
export { familyUnlockGoal } from './goals';
export { lookupOf, MetaPathKnowledgeError } from './knowledge';
export { createMetaPathModule, type MetaPathModuleOptions, metaPathModule } from './module';
export {
  type PlannedPath,
  type PlannedStep,
  type PromotionVia,
  plannedLine,
  plannedPaths,
} from './planned';
export {
  compareGoals,
  effortCost,
  FRAME,
  framePositionOf,
  PUSH_GOAL_ID,
  positionOf,
  rankGoals,
  rankPosition,
  selectPriorityList,
} from './priority';
export { choosePusher, type PusherSelection, selectPusher, type Wall } from './pusher';
export { assignRoles, PUSHER_ROLE, roleOwnersOf, visitHints } from './roles';
export { analyzeRoster, CLASS_PICK_LEVEL } from './roster';
export { DIALOGUE_MET, detectStage, isSubclassed, stageOf } from './stage';
export type * from './types';

/**
 * M2's whole output (TR-4a). `now` is accepted for the TR-1 signature; no M2 rule depends on time yet
 * (the frontier's kill rates were computed at the parse's frozen clock).
 */
export function runMetaPath(state: AccountState, kb: MetaPathKnowledge, _now: number): MetaPathResult {
  const facts: FactLookup = lookupOf(kb);
  const stage = detectStage(state, facts);
  const list = selectPriorityList(stage, kb);
  const roster = analyzeRoster(state, facts, stage.id);
  const selection = selectPusher(state, facts);
  const push = pushGoal(state, facts, stage, selection);
  const pusherIndex = selection.kind === 'pusher' ? selection.pusher.index : null;
  const roles = assignRoles(state, facts, stage.id, roster, pusherIndex);
  return {
    stage,
    list,
    pusher:
      selection.kind === 'pusher' && stage.coverage !== 'beyond'
        ? { index: selection.pusher.index, frontierMap: selection.pusher.frontierMap }
        : null,
    pushGoal: push.goal,
    pushUnavailable: push.unavailable,
    roles,
    roster,
    visitHints: visitHints(state, facts, roles),
    goals: [
      ...subclassPending(state, facts, stage, roster),
      ...worldTutorial(state, facts, stage, pusherIndex),
      ...elitePending(state, facts, stage),
      ...rosterGoals(roster, stage),
    ],
  };
}
