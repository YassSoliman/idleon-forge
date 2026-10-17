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
  fieldTemplate,
  isKnown,
  type RawKeySpec,
  type RawKind,
} from './fields';
export type {
  AccountState,
  AccountSummary,
  CharacterState,
  FoodStack,
  KnownAfkType,
  ParseDiagnostics,
} from './types';
export { KNOWN_AFK_TYPES, SCHEMA_VERSION } from './types';
