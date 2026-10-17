// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
export {
  AccountShapeError,
  EmptyAccountError,
  humanize,
  LAST_PLAYED_TIE_MS,
  LAST_PLAYED_WITHIN_MS,
  rawPresent,
  type ToAccountStateOptions,
  toAccountState,
  UNNAMED_WARNING,
} from './adapter';
export { AFK_HORIZON_MS, MAX_FOODS_TRIED } from './afk-facts';
export type {
  AccountAfkFacts,
  AfkAnvilProduct,
  AfkFighting,
  AfkFood,
  AfkFoodKind,
  AfkInventory,
  AfkWorship,
  CharacterAfkFacts,
} from './afk-types';
export {
  ACTIVE_CHARACTER_FRESH_MS,
  type AccountReportFields,
  accountReportFields,
  activeCharacterIndex,
  DAILY_RESET_PERIOD_MS,
  nextDailyReset,
} from './derived';
export {
  declaredField,
  FIELD_RAW_KEYS,
  FIELD_SECTIONS,
  FIELD_SIDE_READS,
  FIELD_SOURCES,
  FRONTIER_SECTIONS,
  fieldTemplate,
  isKnown,
  type RawKeySpec,
  type RawKind,
} from './fields';
// M2 Stage & Meta Path (M2 TR-2, TR-3)
export {
  computeFrontier,
  type FrontierInput,
  type FrontierRates,
  killsLeftOn,
  killsLeftTable,
} from './frontier';
export type {
  AccountState,
  AccountSummary,
  CharacterState,
  FoodStack,
  Frontier,
  FrontierFight,
  GateNpc,
  GateQuestId,
  GateQuestNpc,
  GateQuestProgress,
  KnownAfkType,
  NextPortal,
  ParseDiagnostics,
  RouteDoor,
} from './types';
export { GATE_NPCS, GATE_QUEST_NPCS, KNOWN_AFK_TYPES, SCHEMA_VERSION } from './types';
