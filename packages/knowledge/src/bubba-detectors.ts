// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M23 Bubba (docs/specs/M23-bubba.md section 3): the shared, pure reading of `account.bubba` at `now` that
// the seven Bubba Detectors and the engine's `bubba` module both use, so a Check, its Goal and the page
// can never disagree. Arithmetic only (ADR 0005): comparisons, sums and differences of Toolbox and X1
// numbers (ADR 0010), and time from rate. Lives in src/ because Detectors import only ../../src/helpers
// (M11 TR-1), which re-exports it.
import type { AccountState, BubbaState } from '@idleon-forge/account-state';
import {
  charismaLevelsFrom,
  megafleshMultiplier,
  PATS_HOUR_SECONDS,
  SMOKER_MAX_QUALITY_SECONDS,
} from '@idleon-forge/account-state';

/** Upgrade indices M23 reads (`bubba.fact.upgrades`). */
export const UPG = {
  firstSlice: 0,
  happiBoi: 1,
  boon: 3,
  charisma: 6,
  megaflesh: 8,
  funGifts: 9,
  openGift: 10,
  smoker: 15,
} as const;
/** Gift ids (`bubba.fact.gifts`, 1-based as the save picks them). */
export const GIFT = { beegSlice: 1, slabcakes: 5 } as const;
/** Charisma attribute ids (`bubba.fact.charisma`, 1-based as Bubba[0][6] selects them). */
export const MINDFUL = 5;
/** Megaflesh rows (F-e): 6 opens emulsify and the guides' Mindful-first, 9 the Smoker's free roll. */
export const MF_EMULSIFY = 6;
export const MF_FREE_SMOKE = 9;
/** YumYum Grotto (map 50), door 0 (`bubba.fact.unlock`, N.js BubbaUnlocked). */
export const UNLOCK_MAP = 50;
export const UNLOCK_DOOR = 0;

export { PATS_HOUR_SECONDS, SMOKER_MAX_QUALITY_SECONDS };

export interface Unlock {
  state: 'yes' | 'no' | 'unknown';
  /** CharacterState.index of every character with the door open. */
  open: number[];
  /** Every readable character has it (FR-6). */
  all: boolean;
}

/** FR-2: per character, then any character opens it for the account. */
export function unlockOf(state: AccountState): Unlock {
  const open: number[] = [];
  let unknown = false;
  for (const c of state.characters) {
    const left = c.doorKillsLeft?.[UNLOCK_MAP]?.[UNLOCK_DOOR];
    if (typeof left !== 'number') unknown = true;
    else if (left <= 0) open.push(c.index);
  }
  const s: Unlock['state'] =
    open.length > 0 ? 'yes' : unknown || state.characters.length === 0 ? 'unknown' : 'no';
  return { state: s, open, all: open.length === state.characters.length && !unknown };
}

export interface BubbaNow {
  b: BubbaState;
  unlock: Unlock;
  save: number;
  now: number;
  /** Seconds from the save to `now`, at least 0. */
  elapsed: number;
  /** Meat per minute away time earns: X1's happiness-0 rate, or Toolbox's at happiness 0 (F-b). */
  rate: number | null;
  /** Meat at `now`, a lower bound (F-b); null when the rate is. */
  projected: number | null;
  /** FR-4: no progress ever. */
  notStarted: boolean;
  /** FR-5: a Megaflesh reset 1st Slice to 0. */
  restart: boolean;
}

/** null: no output (locked, FR-26); 'unknown': can't tell (FR-21). */
export function bubbaNow(state: AccountState, now: number): BubbaNow | 'unknown' | null {
  const unlock = unlockOf(state);
  if (unlock.state === 'no') return null;
  if (unlock.state === 'unknown') return 'unknown';
  const b = state.account.bubba;
  const save = state.account.lastCloudSave;
  if (!b || save === null || save === undefined) return 'unknown';
  const elapsed = Math.max(0, now - save) / 1000;
  const rate = b.rateBase ?? (b.happiness === 0 ? b.ratePerMin : null);
  const projected = rate === null ? null : b.meat + (rate / 60) * elapsed;
  const first = b.levels[UPG.firstSlice] ?? 0;
  return {
    b,
    unlock,
    save,
    now,
    elapsed,
    rate,
    projected,
    notStarted: first === 0 && b.megaflesh === 0 && (b.levels[UPG.boon] ?? 0) === 0 && b.meat <= 1,
    restart: b.megaflesh >= 1 && first === 0,
  };
}

/** An upgrade is open once `types` (TotalUpgTypesAvailable) passes its index (F-c). */
export const isOpen = (b: BubbaState, index: number) => b.types > index;
const realLevel = (b: BubbaState, i: number) => (b.levels[i] ?? 0) + (b.prestige[i] ?? 0);

export interface Buy {
  /** The level it reaches. */
  level: number;
  cost: number;
}

export interface MegafleshPlan {
  /** The Megaflesh it buys (megaflesh + 1). */
  next: number;
  cost: number;
  leftover: number;
  /** FR-7 detail 1: Boon levels the leftover covers, then Fun Gifts (they survive the reset, F-d). */
  boonBuys: Buy[];
  funGiftBuys: Buy[];
  /** FR-7 detail 3: Charisma has levels to lose. */
  charismaReset: boolean;
  /** FR-9: the next Megaflesh raises the account-bonus multiplier. */
  multiplierAfter: number | null;
}

/** FR-7: a Megaflesh is affordable at the projected meat. */
export function megafleshPlan(n: BubbaNow): MegafleshPlan | 'unknown' | null {
  const { b } = n;
  if (!isOpen(b, UPG.megaflesh) || n.restart || n.notStarted) return null;
  const cost = b.costs[UPG.megaflesh] ?? null;
  if (cost === null || n.projected === null) return 'unknown';
  if (n.projected < cost) return null;
  let left = n.projected - cost;
  const ladder = (costs: readonly (number | null)[], from: number): Buy[] => {
    const out: Buy[] = [];
    for (let k = 0; k < costs.length; k++) {
      const c = costs[k];
      if (c === null || c === undefined || c > left) break;
      left -= c;
      out.push({ level: from + k + 1, cost: c });
    }
    return out;
  };
  const boonLevel = b.levels[UPG.boon] ?? 0;
  const funLevel = b.levels[UPG.funGifts] ?? 0;
  const boonCosts = b.ahead?.boonCosts ?? [b.costs[UPG.boon] ?? null];
  const funCosts = b.ahead?.funGiftsCosts ?? (funLevel < 6 ? [b.costs[UPG.funGifts] ?? null] : []);
  const leftover = left;
  const boonBuys = isOpen(b, UPG.boon) ? ladder(boonCosts, boonLevel) : [];
  const funGiftBuys = isOpen(b, UPG.funGifts) ? ladder(funCosts, funLevel) : [];
  const now = megafleshMultiplier(b.megaflesh);
  const after = megafleshMultiplier(b.megaflesh + 1);
  return {
    next: b.megaflesh + 1,
    cost,
    leftover,
    boonBuys,
    funGiftBuys,
    charismaReset: b.charisma.levels.some((l) => l > 0),
    multiplierAfter: after > now ? after : null,
  };
}

export interface BoonBuy {
  mode: 'below7' | 'cheap';
  level: number;
  cost: number;
}

/** FR-8 and FR-9's 10% case (Final rulings R-3). Silent while a Megaflesh fires (FR-7 folds it in). */
export function boonBuy(n: BubbaNow, share: number): BoonBuy | 'unknown' | null {
  const { b } = n;
  if (!isOpen(b, UPG.boon) || n.restart || n.notStarted) return null;
  const mf = megafleshPlan(n);
  if (mf !== null && mf !== 'unknown') return null;
  const cost = b.costs[UPG.boon] ?? null;
  if (cost === null || n.projected === null) return 'unknown';
  const level = (b.levels[UPG.boon] ?? 0) + 1;
  if (n.projected < cost) return null;
  if (level <= 7) return { mode: 'below7', level, cost };
  const mfCost = b.costs[UPG.megaflesh] ?? null;
  if (mfCost === null) return 'unknown';
  return cost <= share * mfCost ? { mode: 'cheap', level, cost } : null;
}

/** Projected smoke time at `now` (F-i: the timer keeps running while away). */
export const smokeAt = (n: BubbaNow) => n.b.smoker.seconds + n.elapsed;
export const hasGift = (b: BubbaState, id: number) => b.gifts[0] === id || b.gifts[1] === id;

export interface SmokerClaim {
  freeRoll: boolean;
  cost: number;
}

/** FR-10. */
export function smokerClaim(n: BubbaNow): SmokerClaim | 'unknown' | null {
  const { b } = n;
  if (!b.smoker.unlocked || hasGift(b, GIFT.slabcakes)) return null;
  if (smokeAt(n) < SMOKER_MAX_QUALITY_SECONDS) return null;
  const mf = megafleshPlan(n);
  if (mf !== null && mf !== 'unknown') return null;
  const cost = b.costs[UPG.smoker] ?? null;
  if (cost === null || n.projected === null) return 'unknown';
  if (cost > n.projected) return null;
  return { freeRoll: b.megaflesh >= MF_FREE_SMOKE, cost };
}

/** Epoch ms of the next pat refill, from the save (F-h). */
export const refillAt = (n: BubbaNow) => n.save + Math.max(0, PATS_HOUR_SECONDS - n.b.pats.timer) * 1000;

/** F-h: pats left at `now`; null without X1's pats per refill. */
export function patsLeft(n: BubbaNow): number | null {
  const { pats } = n.b;
  if (pats.perHour === null) return null;
  const due = refillAt(n) <= n.now;
  return Math.max(0, pats.perHour - (due ? Math.min(pats.used, 0) : pats.used));
}

export interface PatGift {
  /** null: "until he stops" (X1 missing, a refill due). */
  pats: number | null;
}

/** FR-11 (Final rulings R-1): only with Beeg Slice picked. */
export function patGift(n: BubbaNow): PatGift | 'unknown' | null {
  const { b } = n;
  if (realLevel(b, UPG.happiBoi) < 1 || !hasGift(b, GIFT.beegSlice) || !isOpen(b, UPG.openGift)) return null;
  const cost = b.costs[UPG.openGift] ?? null;
  if (cost === null || n.projected === null) return 'unknown';
  if (cost > n.projected) return null;
  const left = patsLeft(n);
  if (left !== null) return left >= 1 ? { pats: left } : null;
  return refillAt(n) <= n.now && b.pats.used <= 0 ? { pats: null } : 'unknown';
}

export interface CharismaIdle {
  /** 1..6, or 0 when nothing is training. */
  selected: number;
  max: number;
  /** FR-14a (R-2): from Megaflesh 6 with Mindful below its max. */
  mindful: boolean;
  /** FR-12 detail: levels the banked XP buys at `now`, capped at what the lowest attribute can take. */
  banked: number | null;
}

/** FR-13: Charisma XP at `now`, from the folded XP at the save. */
export function charismaXpAt(n: BubbaNow): number | null {
  const c = n.b.charisma;
  if (c.xpFolded === null || c.xpPerSec === null) return null;
  return c.xpFolded + c.xpPerSec * n.elapsed;
}

/** F-g: the Charisma Chart opens with the Charisma upgrade (T_FeatureUnlocked(1): TotUpgBonus(6) ≥ 0.1). */
export const charismaOpen = (b: BubbaState) => realLevel(b, UPG.charisma) > 0;

/** FR-12. */
export function charismaIdle(n: BubbaNow): CharismaIdle | 'unknown' | null {
  const { b } = n;
  if (!charismaOpen(b) || n.restart || n.notStarted) return null;
  const mf = megafleshPlan(n);
  if (mf !== null && mf !== 'unknown') return null;
  const max = b.charisma.maxLevel;
  if (max === null) return 'unknown';
  const levels = b.charisma.levels;
  if (levels.every((l) => l >= max)) return null;
  const sel = b.charisma.selected;
  const idle = sel === 0 || (levels[sel - 1] ?? 0) >= max;
  if (!idle) return null;
  const xp = charismaXpAt(n);
  const total = levels.reduce((a, l) => a + l, 0);
  const room = max - Math.min(...levels);
  return {
    selected: sel,
    max,
    mindful: b.megaflesh >= MF_EMULSIFY && (levels[MINDFUL - 1] ?? 0) < max,
    banked: xp === null ? null : Math.min(charismaLevelsFrom(total, xp), room),
  };
}

/** FR-4, FR-5. */
export function startOf(n: BubbaNow): 'start' | 'restart' | null {
  if (n.notStarted) return 'start';
  if (n.restart) return 'restart';
  return null;
}

/** The fields every Bubba Detector reads. */
export const BUBBA_READS = [
  'account.bubba',
  'account.lastCloudSave',
  'characters[*].doorKillsLeft',
  'characters[*].index',
  'diagnostics',
] as const;

/** FR-21: a Bubba Check that can't tell (an unreadable record, a cost past the float range, no X1 value). */
export const UNKNOWN = {
  subject: { kind: 'account' as const },
  slots: {},
  result: 'unknown' as const,
  reason: 'field-missing' as const,
};

const withAccount = (s: AccountState, patch: Partial<AccountState['account']>): AccountState => ({
  ...s,
  account: { ...s.account, ...patch },
});
const withUnknown = (s: AccountState, path: string): AccountState => ({
  ...s,
  diagnostics: {
    ...s.diagnostics,
    unknownFields: [...new Set([...s.diagnostics.unknownFields, path])].sort(),
  },
});

// ---- M23 TR-4: the mutations the Bubba Detectors' examples and the engine's stories use (spec section 4) ----

type Patch = Partial<BubbaState> & { charismaPatch?: Partial<BubbaState['charisma']> };

/** `account.bubba` changed by `patch` (no-op on a save without one). */
export function withBubba(s: AccountState, patch: Patch): AccountState {
  const b = s.account.bubba;
  if (!b) return s;
  const { charismaPatch, ...rest } = patch;
  return withAccount(s, { bubba: { ...b, ...rest, charisma: { ...b.charisma, ...charismaPatch } } });
}

/** Upgrade `index` at `level`, with its next price `cost` when given. */
export function withUpgrade(
  s: AccountState,
  index: number,
  level: number,
  cost?: number | null,
): AccountState {
  const b = s.account.bubba;
  if (!b) return s;
  const levels = [...b.levels];
  levels[index] = level;
  const costs = [...b.costs];
  if (cost !== undefined) costs[index] = cost;
  const ahead = b.ahead && index === 3 && cost !== undefined ? { ...b.ahead, boonCosts: [cost] } : b.ahead;
  return withBubba(s, { levels, costs, ahead });
}

/** Meat held at the save. Projections add the rate from the save to `now`. */
export const withMeat = (s: AccountState, meat: number) => withBubba(s, { meat });

/** The picked gifts (1 Beeg Slice, 5 Slabcakes, 6 Surprise Box). */
export const withGifts = (s: AccountState, a: number, b: number) => withBubba(s, { gifts: [a, b] });

/** US-1: the W3-early account mutated to "never started". */
export const neverStarted = (s: AccountState) =>
  withMeat(withUpgrade(withUpgrade(withBubba(s, { megaflesh: 0 }), 0, 0), 3, 0), 0);

/** US-1: the W3-early account just after Megaflesh 4. */
export const justReset = (s: AccountState) => withUpgrade(withBubba(s, { megaflesh: 4 }), 0, 0);

/** No readable Bubba record: unknown. */
export const unreadable = (s: AccountState) => withUnknown(withAccount(s, { bubba: null }), 'account.bubba');

/** Every character's door kills unknown. */
export const doorsUnknown = (s: AccountState): AccountState => ({
  ...s,
  characters: s.characters.map((c) => ({ ...c, doorKillsLeft: null })),
});
