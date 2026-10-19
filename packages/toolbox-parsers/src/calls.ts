// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Toolbox runtime functions the Account State needs beyond `parseData()`, gathered in one object so the
// parse worker can inject them (account-state never imports this package's runtime, ADR 0006). Each
// module appends its entries here; nothing in vendor/ is edited.
import { getCardSets } from '../vendor/parsers/cards';
import { getAfkGain, getDropRate, getPlayerFoodBonus } from '../vendor/parsers/character';
import { getMaxDamage } from '../vendor/parsers/damage';
import { getMaxClaimTime } from '../vendor/parsers/dungeons';
import { getSkillEfficiency } from '../vendor/parsers/efficiency';
import { getBookLvRange, getItemCapacity } from '../vendor/parsers/misc';
import { calcTotalStarTalent } from '../vendor/parsers/talents';
import { getPlayerAnvil, getTimeTillCap } from '../vendor/parsers/world-1/anvil';
import { getBubbleUpgradeCost } from '../vendor/parsers/world-2/alchemy';
import { getBuildCost } from '../vendor/parsers/world-3/construction';
import { getPrayerBonusAndCurse } from '../vendor/parsers/world-3/prayers';
import { getPrinterMulti } from '../vendor/parsers/world-3/printer';
import { calcTimeToRankUp, getSaltMatsTimeLeft, getSaltsBalance } from '../vendor/parsers/world-3/refinery';
import { getChipsAndJewels } from '../vendor/parsers/world-4/cooking';
import {
  agilityMultiplier,
  anvilExpBonus,
  anvilSpeedOf,
  anvilSpeedTerms,
  hammerHammerByCompanion,
} from './anvil-parts';
import { bubbaParse, bubbaTables } from './bubba';
import { classExpMulti, monsterExpGiven } from './class-exp';
import { frontierRates, onMap } from './frontier-rates';
import { itemDisplayName } from './item-names';
import { killroyWeeks, randomEventSchedule } from './resets';
import { shopStockAll } from './shop-stock';
import { stampEvaluations, vaultLadders } from './spend';
import { presetSubject, talentPointTerms } from './talent-points';
import { shrineBonuses } from './w23';

export const toolboxCalls = {
  /** Toolbox damage, hit chance, survivability and kill rates for one character (vendor/parsers/damage.ts). */
  getMaxDamage,
  /** M2 TR-2: every character's kill rate on one map, through the clone. */
  frontierRates,
  /** M2 TR-2: the clone itself, for the identity contract test. */
  onMap,
  // M3 AFK Safety (TR-2). They read the clock: call them inside withFrozenClock(now, ...).
  getAfkGain,
  getDropRate,
  getPlayerAnvil,
  getTimeTillCap,
  getMaxClaimTime,
  getSaltMatsTimeLeft,
  getPrayerBonusAndCurse,
  getItemCapacity,
  /** Food effect multiplier; with isHealth, a health food heals `Amount` x this per bite (M3 R-FOOD-1). */
  getPlayerFoodBonus,
  // M8 Collections (TR-15).
  /** Per card set: Toolbox's set (name, rawName, effect, bonus) with `totalStars` (Σ card levels) and `stars` (tier − 1). */
  getCardSets,
  /** Every town shop's stock from raw `ShopStock`, item by item (Toolbox's `getShops` keeps only a whitelist). */
  shopStockAll,
  // M7 Spend Plan (TR-4): Vault cost ladders and the stamp re-evaluation. Anvil coin points use getPlayerAnvil.
  vaultLadders,
  stampEvaluations,
  // M14 Walkthroughs & Parallel Slot Plans (TR-2).
  /** A skill's efficiency as the character is equipped (`playerInfo`: getMaxDamage's result). */
  getSkillEfficiency,
  /** The printer multi (Gold Relic days, Skill Mastery, ...); M14 calls it twice, live and with the day counters at 0 (FR-27a). */
  getPrinterMulti,
  /** An item's Toolbox display name ("Forest_Fibres"), or null. */
  itemDisplayName,
  // M15 Account depth (TR-1): salt safe ranks and bar times, building costs, the book level range.
  getSaltsBalance,
  calcTimeToRankUp,
  getBuildCost,
  getBookLvRange,
  // M20 TR-1: the seeded Killroy room classes and the Random Event schedule (read the clock: frozen).
  killroyWeeks,
  randomEventSchedule,
  // M4 Purpose & Milestones (TR-2): the class EXP a kill gives on the current map.
  /** Toolbox `getClassExpMulti(character, account, characters).value`, or null. */
  classExpMulti,
  /** A monster's base `ExpGiven` (monsters.json), or null. */
  monsterExpGiven,
  // M19 Alchemy (TR-1): one bubble level's cost of one material, with no discounts (an upper bound, F-b).
  /** Toolbox `getBubbleUpgradeCost` at `level` (the bubble's current level prices the next one, N.js CauldronCosts). */
  bubbleCost: (rawName: string, bubbleIndex: number, level: number, baseCost: number): number =>
    getBubbleUpgradeCost({ rawName, bubbleIndex, level, baseCost }),
  // M21 TR-3 (FR-C9): a preset's star talent point total.
  /**
   * Toolbox `calcTotalStarTalent` on this character alone. `'other'` calls it on a copy carrying the
   * other preset's talents (`talentPreset.flatTalents` + `.flatStarTalents`), because Star Player,
   * Supernova Player and Stonks! add points per preset. null when the character has no other preset or
   * the result isn't a finite number. Throws what Toolbox throws; the adapter catches it.
   */
  starTotal: (character: unknown, account: unknown, preset: 'active' | 'other'): number | null => {
    const subject = presetSubject(character, preset);
    if (!subject) return null;
    const n = calcTotalStarTalent([subject], account);
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  },
  // Exact talent points (ADR 0010): the Toolbox-computed terms of the game's TotalTalentPoints.
  /** Per term id, for one preset (`talent-points.ts`); null without that preset. Throws what Toolbox throws. */
  talentPointTerms,
  // M23 X1 (ADR 0010): Toolbox's Bubba parse on an edited raw record, and the Charisma/gift tables.
  bubbaParse,
  bubbaTables,
  // M24 World 4: the Lab shop's weekly chips and jewel, seeded by the save's week (read-only pages).
  /** Toolbox `getChipsAndJewels(account, weeks)`: `{ items: [chip, chip, jewel], date }` per week from the save's. */
  getChipsAndJewels: (account: unknown, weeks: number): unknown => getChipsAndJewels(account, weeks),
  // M24 the World 3 System pages: the shrine bonus table.
  shrineBonuses,
  // M26 F-C: the anvil speed terms (anvil-parts.ts), for the Production Plan's speed-up steps.
  anvilSpeedTerms,
  anvilSpeedOf,
  hammerHammerByCompanion,
  agilityMultiplier,
  anvilExpBonus,
};
