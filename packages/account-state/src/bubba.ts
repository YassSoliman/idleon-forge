// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba (docs/specs/M23-bubba.md TR-2): Toolbox output plus a few raw indices of the save's `Bubba`
// record -> `account.bubba`, with ADR 0010's derived values (bubba-x1.ts). Called from adapter.ts; the only
// place that knows these Toolbox paths and raw indices. Reading a raw save value is not a formula. Null
// when the save has no Bubba record (old saves; not unknown) or when Toolbox's `bubba` section failed or
// returned something unreadable (unknown, M23 FR-21).
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type { BubbaAccountFields, BubbaBonuses, BubbaState, CharismaLevels } from './bubba-types';
import {
  BUBBA_BOON_BONUS_KEYS,
  BUBBA_X1_NONE,
  type BubbaX1,
  bubbaX1,
  CHARISMA_LEVELS_BANKED_LIMIT,
  charismaTraitReq,
  editRaw,
  rawBubbaOf,
} from './bubba-x1';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
/** A raw save number (the record holds plain numbers; a missing index reads 0, as the game's does). */
const rawNum = (v: unknown): number | null => {
  if (v === undefined || v === null) return 0;
  return finite(typeof v === 'string' && v.trim() !== '' ? Number(v) : v);
};

export const BUBBA_UPGRADES = 28;
/** How many Bubba Boon prices ahead the record carries (M23 TR-8: FR-9's loop buys at most 10). */
export const BUBBA_BOON_AHEAD = 10;
/** Fun Gifts, the one upgrade besides Boon and Megaflesh that survives a Megaflesh (M23 F-d). */
const FUN_GIFTS = 9;
const BOON = 3;

/**
 * The levels `xp` buys from a Charisma total of `total`, one `CharismaTraitREQ` a level as the game's
 * ActorEvents_713 tick spends them (X1's loop, ADR 0010), uncapped, stopping at the X1 limit.
 */
export function charismaLevelsFrom(total: number, xp: number): number {
  let left = xp;
  let t = total;
  let levels = 0;
  while (levels < CHARISMA_LEVELS_BANKED_LIMIT && left >= charismaTraitReq(t)) {
    left -= charismaTraitReq(t);
    t += 1;
    levels += 1;
  }
  return levels;
}

interface Collector {
  unknown(path: string): void;
}

export interface BubbaInputs {
  /** Toolbox's parsed account. */
  account: Dict;
  /** The raw save. */
  data: Dict;
  failedSections: readonly string[];
  calls: ToolboxCalls | null;
}

class Unreadable extends Error {}
const need = (v: number | null): number => {
  if (v === null) throw new Unreadable();
  return v;
};

function readState(input: BubbaInputs, raw: unknown[][]): BubbaState {
  const tb = input.account.bubba;
  if (!isDict(tb) || !Array.isArray(tb.upgrades) || tb.upgrades.length < BUBBA_UPGRADES)
    throw new Unreadable();
  const ups = tb.upgrades.slice(0, BUBBA_UPGRADES) as unknown[];
  const levels = ups.map((u) => need(isDict(u) ? finite(u.level) : null));
  const prestige = ups.map((u) => need(isDict(u) ? finite(u.prestige) : null));
  // A cost past the float range (late Boon levels) is null: unknown, never affordable (TR-2, RT-11).
  const costs = ups.map((u) => (isDict(u) ? finite(u.cost) : null));
  const bonusOf = (key: string) => {
    const b = isDict(tb.bonuses) ? tb.bonuses[key] : undefined;
    return need(isDict(b) ? finite(b.bonus) : null);
  };
  const bonuses = BUBBA_BOON_BONUS_KEYS.map(bonusOf) as BubbaBonuses;
  const r0 = Array.isArray(raw[0]) ? raw[0] : [];
  const at = (i: number) => need(rawNum(r0[i]));
  const charismaLevels = Array.from({ length: 6 }, (_, i) => need(rawNum(raw[3]?.[i]))) as CharismaLevels;
  const dice = Array.from({ length: 8 }, (_, i) => need(rawNum(raw[4]?.[i])));
  const x1: BubbaX1 = input.calls ? bubbaX1(raw, input.account, input.calls) : BUBBA_X1_NONE;
  const pending = need(rawNum(r0[7]));
  const types = need(finite(tb.totalUpgTypesAvailable));
  return {
    meat: need(finite(tb.meatSlices)),
    ratePerMin: need(finite(tb.meatsliceRate)),
    rateBase: x1.meatsliceRateBase,
    happiness: at(1),
    produced: need(finite(tb.progress)),
    nextTypeAt: need(finite(tb.progressReq)),
    types,
    levels,
    prestige,
    costs,
    megaflesh: need(finite(tb.megafleshOwned)),
    bonuses,
    smoker: {
      unlocked: tb.smokerUnlocked === true,
      seconds: need(finite(tb.smokerSeconds)),
    },
    pats: { used: at(5), timer: at(13), perHour: x1.patsPerHour },
    charisma: {
      levels: charismaLevels,
      selected: at(6),
      emulsified: at(15),
      xp: at(8),
      // X1 folds the pending seconds in only once more than 5 upgrade types are open (bubba-x1.ts).
      xpFolded: x1.charismaXpPerSec === null ? null : at(8) + (types > 5 ? pending * x1.charismaXpPerSec : 0),
      levelsBanked: x1.charismaLevelsBanked,
      xpReq: x1.charismaXpReq,
      xpPerSec: x1.charismaXpPerSec,
      maxLevel: x1.charismaMaxLevel,
      bonus: x1.charismaBonus,
      bonusNext: x1.charismaBonusNext,
    },
    boonNextDelta: x1.boonNextDelta,
    megafleshMultiplier: x1.megafleshMultiplier,
    discountNextRatio: x1.discountNextRatio,
    gifts: [at(2), at(3)],
    dice,
    ahead: input.calls ? aheadCosts(raw, input.account, input.calls, levels, costs) : null,
  };
}

/**
 * Toolbox's own price of each next level of Bubba Boon (BUBBA_BOON_AHEAD of them) and of Fun Gifts (up to
 * its cap, `bubbaUpgrades[9].x4`, 6): its `getBubba` on a copy of the record with that upgrade k levels
 * higher (the X1 approach, ADR 0010). A price past the float range, or a throw, is null.
 */
function aheadCosts(
  raw: unknown[][],
  account: Dict,
  calls: ToolboxCalls,
  levels: number[],
  costs: (number | null)[],
): NonNullable<BubbaState['ahead']> {
  const priceAt = (index: number, extra: number): number | null => {
    try {
      const tb = calls.bubbaParse(
        editRaw(raw, 1, index, (l) => l + extra),
        account,
      );
      return finite(tb?.upgrades?.[index]?.cost);
    } catch {
      return null;
    }
  };
  const ladder = (index: number, n: number) =>
    Array.from({ length: Math.max(0, n) }, (_, k) => (k === 0 ? (costs[index] ?? null) : priceAt(index, k)));
  return {
    boonCosts: ladder(BOON, BUBBA_BOON_AHEAD),
    funGiftsCosts: ladder(FUN_GIFTS, FUN_GIFTS_CAP - (levels[FUN_GIFTS] ?? 0)),
  };
}

/** Fun Gifts' level cap (`bubbaUpgrades[9].x4`), cross-checked by the bubba generator. */
export const FUN_GIFTS_CAP = 6;

export function readBubba(input: BubbaInputs, c: Collector): BubbaAccountFields {
  const raw = rawBubbaOf(input.data.Bubba);
  // No record at all: a save from before Bubba (v1.02), or an account the game never gave one. Not unknown.
  if (input.data.Bubba === undefined || input.data.Bubba === null) return { bubba: null };
  if (input.failedSections.includes('bubba') || raw === null) {
    c.unknown('account.bubba');
    return { bubba: null };
  }
  try {
    return { bubba: readState(input, raw) };
  } catch {
    c.unknown('account.bubba');
    return { bubba: null };
  }
}
