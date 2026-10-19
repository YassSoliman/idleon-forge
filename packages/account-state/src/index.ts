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
export { W13_VIALS } from './alchemy';
export type { AlchemyAccountFields, AlchemyPlanState } from './alchemy-types';
export { BUBBA_BOON_AHEAD, BUBBA_UPGRADES, charismaLevelsFrom, FUN_GIFTS_CAP } from './bubba';
export type {
  BubbaAccountFields,
  BubbaBonuses,
  BubbaCharisma,
  BubbaState,
  CharismaLevels,
} from './bubba-types';
export {
  BEEG_SLICE_SECONDS,
  BUBBA_BOON_BONUS_KEYS,
  BUBBA_DISCOUNT_UPGRADES,
  BUBBA_X1_NONE,
  type BubbaX1,
  bubbaX1,
  CHARISMA_LEVELS_BANKED_LIMIT,
  CHARISMA_MAX_LEVEL,
  charismaTraitReq,
  megafleshMultiplier,
  PATS_HOUR_SECONDS,
  SMOKER_MAX_QUALITY_SECONDS,
} from './bubba-x1';
export type {
  CardLoadout,
  CardSetState,
  CardState,
  CollectionsAccountFields,
  CollectionsCharacterFields,
  ObolSlot,
} from './collections-types';
export { BOOK_PAGES, BUILD_SLOTS } from './depth';
export type {
  BookPage,
  ConstructionBuilding,
  ConstructionState,
  DepthAccountFields,
  HeldBook,
  LibraryState,
  RefinerySalt,
  RefineryState,
} from './depth-types';
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
// M18 Gear & Tools (M18 TR-2)
export { GEAR_TYPES, gearItem, type HeldGear, heldGear, type WornSlot, wornGear } from './gear';
export {
  type ArmorSmithyState,
  GEAR_SLOTS,
  type GearAccountFields,
  type GearCharacterFields,
  type GearClass,
  type GearItem,
  type GearPlace,
  type GearSlotId,
  type GearStats,
  type GearWorn,
} from './gear-types';
// M24 the World 3 System pages (prayers, shrines)
export { ANVIL_PRODUCTS, hammersOf, stockOf } from './production';
export type { AnvilProduction, AnvilSpeedParts, ProductionCharacterFields } from './production-types';
export { PURPOSE_SKILLS } from './purpose';
export type {
  ClassExp,
  FightingRate,
  PurposeAccountFields,
  PurposeCharacterFields,
  VaultKills,
} from './purpose-types';
// M21 Redesign (M21 TR-3)
export { doorKillsOf } from './redesign';
export { STAR_TOTAL_SECTIONS } from './redesign-fields';
export type { RedesignAccountFields, RedesignCharacterFields, StatueState } from './redesign-types';
// M20 Skills, Parallel Slots and the Daily & Weekly Checklist (M20 TR-2)
export {
  ballotText,
  COG_BOARD_SIZE,
  COG_INVENTORY_START,
  COG_SHELF_START,
  LIQUID_UNLOCK_LEVELS,
  OLA as M20_OLA,
  RANDOM_EVENT_WINDOW_MS,
} from './slots';
export {
  type CharacterSlots,
  type CogBoardState,
  type CogPlace,
  type CogSquare,
  type GuildTasksState,
  type KillroyClass,
  type KillroyState,
  type LiquidState,
  type PetTournamentState,
  type RandomEventsState,
  SKILL_IDS,
  type SkillId,
  type SkillState,
  type SlotsAccountFields,
  type SlotsCharacterFields,
  type TaskBoardDaily,
  type WorshipTotem,
} from './slots-types';
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
export { decodeLetters, STAR_POINTS_KEY, TELESCOPE_MAP, TELESCOPE_ROUTE } from './starsigns';
export type {
  ConstellationProgress,
  StarSignsAccountFields,
  StarSignsCharacterFields,
  StarSignsState,
} from './starsigns-types';
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
// Exact talent points (ADR 0010)
export { checkTab, rawAccountTerms, spentOn } from './talent-points';
export { TALENT_POINT_SECTIONS } from './talent-points-fields';
export {
  clampsAtZero,
  type RawPointTerms,
  ROYAL_TAB_CLASSES,
  skillTerms,
  starRawFloor,
  TALENT_POINT_TERMS,
  type TermSource,
  type ToolboxPointTerms,
  tabTotal,
  termsOfTab,
  VOID_TAB_CLASS,
} from './talent-points-formula';
export type {
  CharacterTalents,
  PointsConfidence,
  PresetTalents,
  ResetItems,
  TabKey,
  TabPoints,
  TalentLevel,
  TalentPoints,
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
// M24 the World 3 System pages (prayers, shrines)
export { EQUINOX_MIRROR, equinoxUnlockedOf, prayersOf, shrinesOf } from './w23';
export type { PrayerInfo, ShrineInfo, W23AccountFields } from './w23-types';
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
export { BREEDING_MULTIPLIER_UPGRADES, EGG_BASE_SECONDS, KITCHENS, LAB_CHIP_SLOTS } from './world4';
export type {
  BreedingState,
  BreedingUpgrade,
  CookingState,
  Kitchen,
  KitchenStatus,
  LabCharacter,
  LabJewel,
  LabNode,
  LabShopItem,
  LabShopWeek,
  LabState,
  Meal,
  Spice,
  Territory,
  TerritoryStatus,
  World4AccountFields,
} from './world4-types';
