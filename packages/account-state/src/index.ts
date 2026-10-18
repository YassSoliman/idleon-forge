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
  AFK_HORIZON_MS,
  ANVIL_EXHAUSTIVE_MAX,
  ANVIL_PLAN_WINDOWS_MS,
  ANVIL_SCAN_RADIUS,
  anvilPlanWindow,
  bestAnvilSplit,
  MAX_FOODS_TRIED,
} from './afk-facts';
export type {
  AccountAfkFacts,
  AfkAnvilPlan,
  AfkAnvilProduct,
  AfkAnvilSplit,
  AfkAnvilWindowPlan,
  AfkFighting,
  AfkFood,
  AfkFoodKind,
  AfkInventory,
  AfkWorship,
  CharacterAfkFacts,
} from './afk-types';
export type {
  CardLoadout,
  CardSetState,
  CardState,
  CollectionsAccountFields,
  CollectionsCharacterFields,
  ObolSlot,
} from './collections-types';
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
// M7 Spend Plan (M7 TR-2)
export { LADDER_CHECKPOINTS, SPEND_VAULT_ROWS } from './spend';
export type {
  AnvilCoinPoint,
  BribeState,
  P2wUpgrade,
  RaisePrice,
  SpendInputs,
  StampRaise,
  StampState,
  StatueGoldState,
  VaultRow,
  VaultState,
  Wallet,
} from './spend-types';
export type {
  CharacterTalents,
  PresetTalents,
  ResetItems,
  TalentLevel,
} from './talent-types';
export { ATTACK_BAR_ROWS, attackBarOf, PRESET_LEVEL } from './talents';
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
export {
  ARENA_THIRD_BUBBLE_WAVE,
  BANK_CAP_DAYS,
  DARTS_UNLOCKS,
  HOOPS_UNLOCKS,
  OLA,
  OLA_INDICES,
  PET_MART_UNLOCK_VERIFIED,
} from './unspent';
export {
  countdownEnd,
  dailyResetAfter,
  eventsBetween,
  nextEventAfter,
  resetsSinceSave,
} from './unspent-time';
export type {
  AlchemyState,
  CauldronId,
  CauldronState,
  CooldownGame,
  DeathNoteBuildingState,
  KeyBank,
  KeyId,
  MeritWorld,
  MinigamesState,
  PetMartState,
  PetsState,
  PostOfficeState,
  SaltState,
  TicketBank,
  UnspentAccountFields,
  UnspentCharacterFields,
} from './unspent-types';
// M14 Walkthroughs & Parallel Slot Plans (M14 TR-2, TR-3)
export {
  computeSupplyRates,
  type MapGraphRow,
  reachableMaps,
  SUPPLY_MAPS_PER_LEAF,
  type SupplyInput,
  type SupplyLeaf,
  withSupplyRates,
} from './supply';
export { PRINTER, WALKTHROUGH_SKILLS } from './walkthrough';
export type {
  CardPresets,
  PrinterCharacter,
  PrinterSample,
  PrinterState,
  SupplyRate,
  SupplyRates,
  TalentPresets,
  WalkthroughAccountFields,
  WalkthroughCharacterFields,
} from './walkthrough-types';
