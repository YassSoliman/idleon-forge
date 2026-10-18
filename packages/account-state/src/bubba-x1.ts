// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 X1 (ADR 0010): what Bubba's next pat, Charisma level, Bubba Boon level and discount level are worth.
// Each value either runs Toolbox's own Bubba parse on an edited copy of the raw record (`toolboxCalls
// .bubbaParse`: the happiness-0 rate, the next Boon level, the next discount level) or ports one function
// of the game's `_customBlock_Bubbastuff` (N.js served 2026-10-18, Last-Modified 2026-10-17) over
// Toolbox's per-upgrade `realLV` and `bonus` (TotUpgBonus). The game's own code, run by
// scripts/oracle/bubba-oracle.cjs on two public saves, is the check (test/bubba-x1.test.ts). Every value is
// null when it can't be computed (no record, no Toolbox calls, a throw, a non-finite result).
import type { ToolboxBubba, ToolboxBubbaTables, ToolboxCalls } from '@idleon-forge/toolbox-parsers';

// game: ActorEvents_713 refills the daily pets once Bubba[0][13] reaches 3600 seconds
export const PATS_HOUR_SECONDS = 3600;
// game: Open Gift with Beeg Slice picked adds 1200 * Bubbastuff("MeatsliceRate") meat (20 minutes)
export const BEEG_SLICE_SECONDS = 1200;
// game: ActorEvents_713 levels the selected attribute only while 120 > Bubba[3][selected - 1]
export const CHARISMA_MAX_LEVEL = 120;
// game: the smoked meat tier roll floor(5 * rand ^ max(0.1, 9 - 10 t / (7200 + t))) bottoms out at
// t / (7200 + t) = 0.89, so smoking longer gains nothing. Same value as Toolbox's export (drift-tested).
export const SMOKER_MAX_QUALITY_SECONDS = (0.89 * 7200) / 0.11;

/** The banked-levels loop stops here, so a corrupt XP value can't hang the parse. */
export const CHARISMA_LEVELS_BANKED_LIMIT = 10000;
/** Bargain, Cost Saver and Perma Sale: the upgrades that make every upgrade cheaper. */
export const BUBBA_DISCOUNT_UPGRADES = [4, 18, 26] as const;
/** Toolbox's `bubba.bonuses` keys for BubbaRoG_Bonuses 1..7. */
export const BUBBA_BOON_BONUS_KEYS = [
  'buildRate',
  'critterGain',
  'soulGain',
  'totalDamage',
  'allKills',
  'expMulti',
  'atomCost',
] as const;

export interface BubbaX1 {
  /** game: "DailyPetting", the pats each refill gives. */
  patsPerHour: number | null;
  /** Toolbox's MeatsliceRate per minute with happiness Bubba[0][1] at 0. */
  meatsliceRateBase: number | null;
  /** CHARISMA_MAX_LEVEL (120 at this patch). */
  charismaMaxLevel: number | null;
  /** game: "CharismaTraitREQ", XP for the next level of any attribute. */
  charismaXpReq: number | null;
  /** game: "CharismaTraitSPD", XP per second. */
  charismaXpPerSec: number | null;
  /** Levels the banked XP (plus pending seconds) buys at the save, uncapped. */
  charismaLevelsBanked: number | null;
  /** game: "CharismaBonus" for each of the six attributes, now. */
  charismaBonus: number[] | null;
  /** The same at one more level. */
  charismaBonusNext: number[] | null;
  /** What the next Bubba Boon level adds to its bonus, (L mod 7) + 1, at the current multiplier. */
  boonNextDelta: number | null;
  /** 1 + Bubba_RoG_all / 100. */
  megafleshMultiplier: number | null;
  /** Bargain, Cost Saver, Perma Sale: the factor every cost falls by if that discount gains a level. */
  discountNextRatio: [number, number, number] | null;
}

export const BUBBA_X1_NONE: BubbaX1 = {
  patsPerHour: null,
  meatsliceRateBase: null,
  charismaMaxLevel: null,
  charismaXpReq: null,
  charismaXpPerSec: null,
  charismaLevelsBanked: null,
  charismaBonus: null,
  charismaBonusNext: null,
  boonNextDelta: null,
  megafleshMultiplier: null,
  discountNextRatio: null,
};

type Raw = unknown[][];
type Calls = Pick<ToolboxCalls, 'bubbaParse' | 'bubbaTables'>;

const finite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const allFinite = (xs: Array<number | null>): number[] | null =>
  xs.length > 0 && xs.every((x) => x !== null) ? (xs as number[]) : null;

/** The save's Bubba record (a JSON string in the save) as rows, or null. */
export function rawBubbaOf(value: unknown): Raw | null {
  let v = value;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      return null;
    }
  }
  return Array.isArray(v) && v.every((row) => Array.isArray(row)) ? (v as Raw) : null;
}

/** A copy of the record with Bubba[row][index] replaced by `f(old)`. */
export function editRaw(raw: Raw, row: number, index: number, f: (old: number) => number): Raw {
  return raw.map((values, r) => {
    if (r !== row) return values;
    const copy = [...values];
    copy[index] = f(num(copy[index]));
    return copy;
  });
}

const upgradeBonus = (tb: ToolboxBubba, i: number): number => num(tb.upgrades?.[i]?.bonus);

/** Sum of the six attribute levels, Bubba[3][0..5], rounded like the game's DNSM.Bubba_CharismaTot. */
export function charismaTotal(raw: Raw): number {
  let total = 0;
  for (let i = 0; i < 6; i++) total = Math.round(total + num(raw[3]?.[i]));
  return total;
}

/** game: "CharismaTraitREQ" = 20 (1 + T/20) 1.03^T, T the total of all six levels. */
export const charismaTraitReq = (total: number): number => 20 * (1 + total / 20) * 1.03 ** total;

/** game: "DailyPetting" = ceil(Log2(RealLV 1) + min(RealLV 1, 3)); Log2 floors its input at 1. */
export function dailyPetting(realLV1: number): number {
  return Math.ceil(Math.log(Math.max(realLV1, 1)) / Math.log(2) + Math.min(realLV1, 3));
}

/** game: "GiftPassiveBonus"(i, 999): 0 unless gift i + 1 is picked in Bubba[0][2] or [0][3]. */
function giftPassive(raw: Raw, tb: ToolboxBubba, tables: ToolboxBubbaTables, i: number): number {
  const picked = num(raw[0]?.[2]) === i + 1 || num(raw[0]?.[3]) === i + 1;
  if (!picked) return 0;
  return num(tables.giftPassive[i]) * Math.min(5, 1 + upgradeBonus(tb, 17) / 100);
}

/** game: "CharismaTraitSPD" = (1 + TotUpgBonus(6)/100) (1 + GiftPassiveBonus(2, 999)/100); gift 2 is Numbahs. */
function charismaTraitSpd(raw: Raw, tb: ToolboxBubba, tables: ToolboxBubbaTables): number {
  return (1 + upgradeBonus(tb, 6) / 100) * (1 + giftPassive(raw, tb, tables, 2) / 100);
}

/**
 * game: "CharismaBonus" = Bubba[3][i] x Spelunky[37][i] x (1 + TotUpgBonus(13)/100), tripled for the
 * attribute picked in Bubba[0][15] (i + 1).
 */
function charismaBonus(
  raw: Raw,
  tb: ToolboxBubba,
  tables: ToolboxBubbaTables,
  i: number,
  level: number,
): number {
  const base = level * num(tables.charismaPerLevel[i]) * (1 + upgradeBonus(tb, 13) / 100);
  return Math.round(i + 1) === num(raw[0]?.[15]) ? 3 * base : base;
}

/**
 * game: ActorEvents_713 folds the pending seconds Bubba[0][7] x CharismaTraitSPD into the XP Bubba[0][8]
 * (once TotalUpgTypesAvailable > 5), then each tick spends one CharismaTraitREQ on a level while
 * XP >= REQ. REQ reads the total of all levels, so it rises by 1 per level. Uncapped: neither the picked
 * attribute nor the max level applies, since the player may pick another.
 */
export function charismaLevelsBanked(raw: Raw, typesAvailable: number, xpPerSec: number): number {
  const pending = typesAvailable > 5 ? num(raw[0]?.[7]) : 0;
  let xp = num(raw[0]?.[8]) + pending * xpPerSec;
  let total = charismaTotal(raw);
  let levels = 0;
  while (levels < CHARISMA_LEVELS_BANKED_LIMIT && xp >= charismaTraitReq(total)) {
    xp -= charismaTraitReq(total);
    total += 1;
    levels += 1;
  }
  return levels;
}

/**
 * game: DNSM.Bubba_RoG_all, set in "BubbaRoG_Bonuses" = 20 x the sum of MegafleshOwned(1, 3, 6, 9, 11).
 * MegafleshOwned(i) is 1 when Bubba[1][8] > i, except i = 11, which counts Bubba[1][8] − 11.
 */
export function megafleshMultiplier(megaflesh: number): number {
  const owned = (i: number) => (megaflesh > i ? (i === 11 ? megaflesh - 11 : 1) : 0);
  return 1 + (20 * (owned(1) + owned(3) + owned(6) + owned(9) + owned(11))) / 100;
}

/** M23 X1 for one save: `rawBubba` is the save's `Bubba` (string or rows), `account` Toolbox's parsed account. */
export function bubbaX1(rawBubba: unknown, account: unknown, calls: Calls | null): BubbaX1 {
  const raw = rawBubbaOf(rawBubba);
  if (!raw || !calls) return BUBBA_X1_NONE;
  try {
    const tb = calls.bubbaParse(raw, account);
    if (!tb || !Array.isArray(tb.upgrades)) return BUBBA_X1_NONE;
    const tables = calls.bubbaTables();
    const rerun = (row: number, index: number, f: (old: number) => number) =>
      calls.bubbaParse(editRaw(raw, row, index, f), account);

    const xpPerSec = finite(charismaTraitSpd(raw, tb, tables));
    const traits = tables.charismaNames.map((_, i) => i);

    const boon = num(raw[1]?.[3]);
    const boonKey = BUBBA_BOON_BONUS_KEYS[boon % 7] ?? BUBBA_BOON_BONUS_KEYS[0];
    const boonNext = rerun(1, 3, (l) => l + 1);
    const boonNextDelta = finite(
      num(boonNext?.bonuses?.[boonKey]?.bonus) - num(tb.bonuses?.[boonKey]?.bonus),
    );

    const cost0 = finite(tb.upgrades[0]?.cost);
    const ratios = BUBBA_DISCOUNT_UPGRADES.map((i) => {
      const next = finite(rerun(1, i, (l) => l + 1)?.upgrades?.[0]?.cost);
      return cost0 && next !== null ? finite(next / cost0) : null;
    });

    return {
      patsPerHour: finite(dailyPetting(num(tb.upgrades[1]?.realLV))),
      meatsliceRateBase: finite(rerun(0, 1, () => 0)?.meatsliceRate),
      charismaMaxLevel: CHARISMA_MAX_LEVEL,
      charismaXpReq: finite(charismaTraitReq(charismaTotal(raw))),
      charismaXpPerSec: xpPerSec,
      charismaLevelsBanked:
        xpPerSec === null ? null : charismaLevelsBanked(raw, num(tb.totalUpgTypesAvailable), xpPerSec),
      charismaBonus: allFinite(
        traits.map((i) => finite(charismaBonus(raw, tb, tables, i, num(raw[3]?.[i])))),
      ),
      charismaBonusNext: allFinite(
        traits.map((i) => finite(charismaBonus(raw, tb, tables, i, num(raw[3]?.[i]) + 1))),
      ),
      boonNextDelta,
      megafleshMultiplier: finite(megafleshMultiplier(num(raw[1]?.[8]))),
      discountNextRatio: allFinite(ratios) as [number, number, number] | null,
    };
  } catch {
    return BUBBA_X1_NONE;
  }
}
