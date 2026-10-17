// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan (docs/specs/M7-spend-plan.md): where coins go, in what order, on which character. Pure
// (TR-1): no Toolbox import, no clock, no storage, no network.
export { type Allocation, allocate, chooseWallet, RESERVE_SHORTFALL_SHARE, Wallets } from './allocate';
export {
  type Candidate,
  CHECKPOINTS,
  DEFAULT_SHARE_CAP,
  DUPLICATE_ENTRIES_ROW,
  HOLD_DAYS,
  raiseReady,
  SINKS_OPEN_AT_LEVEL,
  stampRef,
  unlockFuel,
  vaultRef,
  waitingToFit,
} from './candidates';
export {
  combatGate,
  duplicateEntriesGuard,
  SPEND_DETECTORS,
  stampHydrogen,
  stampNotReady,
} from './detectors';
export { type ResolvedSpendItem, resolveSpendList, type SpendKnowledge, spendListId } from './knowledge';
export { createSpendModule, notCoveredOf, type SpendModuleDeps } from './module';
export { buildSpendPlan, CHECK, MAX_LINES, type SpendPlanInput, twoSf, VISIBLE_LINES } from './plan';
export type * from './types';
