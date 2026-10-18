// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M15 Account depth (TR-1, TR-2): Toolbox output -> the Refinery, Construction and Talent Book Library
// fields. Called from adapter.ts; like it, the only place that knows these Toolbox paths. The Toolbox
// calls (getSaltsBalance, calcTimeToRankUp, getBuildCost, getBookLvRange) arrive injected from the
// parse worker (ADR 0006); without them the fields that need one are null.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type {
  BookPage,
  ConstructionBuilding,
  ConstructionState,
  DepthAccountFields,
  HeldBook,
  LibraryState,
  RefinerySalt,
  RefineryState,
} from './depth-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown, fallback = 0): number => finite(v) ?? fallback;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const parsedJson = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

/**
 * Game constants behind the build slot count (N.js `TowerBuildSlots` @7815643, game 2.3.540): 2 base
 * slots, plus the gem shop row 117 purchases, plus half the W3 merit row 0 level, rounded up. The
 * save holds at most 8 slots (`TowerInfo[54..61]`).
 */
export const BUILD_SLOTS = { base: 2, gemRow: 117, slotKey: 54, maxSlots: 8, claimedKey: 27 } as const;

/** Talent book items by page (items.json `Class`): the checkout picks a page, then a talent on it. */
export const BOOK_PAGES: Readonly<Record<string, BookPage>> = {
  TalentBook2: 'Beginner',
  TalentBook3: 'Warrior',
  TalentBook4: 'Archer',
  TalentBook5: 'Mage',
};

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface DepthInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
  withData: number[];
  calls: ToolboxCalls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

const attempt = <T>(f: () => T | null): T | null => {
  try {
    return f();
  } catch {
    return null;
  }
};

function field<T>(c: Collector, path: string, slots: number[], read: () => T | null): T | null {
  if (!c.checkRaw(path, path, null, slots)) return null;
  const v = attempt(read);
  if (v === null) c.unknown(path);
  return v;
}

function readRefinery(
  input: DepthInputs,
  calls: ToolboxCalls,
  frozen: <T>(f: () => T) => T,
): RefineryState | null {
  const { account, characters, asOf } = input;
  const ref = account.refinery;
  if (!isDict(ref) || !Array.isArray(ref.salts) || ref.salts.length === 0) return null;
  const balance = attempt(() => list(frozen(() => calls.getSaltsBalance(account, characters))));
  const salts = ref.salts.map((s, index): RefinerySalt => {
    const salt = isDict(s) ? s : {};
    const rank = num(salt.rank);
    const power = num(salt.refined);
    const powerCap = num(salt.powerCap);
    const unlocked = salt.unlocked === true;
    const b = balance?.[index];
    const safe = isDict(b) ? finite(b.saltMaxSafeRank) : null;
    let fullInSeconds: number | null = null;
    if (unlocked) {
      const t = attempt(() =>
        frozen(() =>
          calls.calcTimeToRankUp(account, characters, 0, null, false, rank, powerCap, power, index),
        ),
      );
      const at = isDict(t) ? finite(t.timeLeft) : null;
      fullInSeconds =
        power >= powerCap ? 0 : at === null ? null : Math.max(0, Math.round((at - asOf) / 1000));
    }
    return {
      rawName: typeof salt.rawName === 'string' ? salt.rawName : `Refinery${index + 1}`,
      name: typeof salt.saltName === 'string' ? salt.saltName : '',
      unlocked,
      active: num(salt.active) > 0 || salt.active === true,
      rank,
      power,
      powerCap,
      autoRefine: num(salt.autoRefinePercentage) > 0,
      saltMaxSafeRank: balance === null ? null : safe,
      fullInSeconds,
    };
  });
  return { salts };
}

function readConstruction(input: DepthInputs, calls: ToolboxCalls): ConstructionState | null {
  const { account, data } = input;
  const towers = account.towers;
  const construction = account.construction;
  const rawTowers = parsedJson(data.Tower);
  if (!isDict(towers) || !Array.isArray(towers.data) || !isDict(construction) || !Array.isArray(rawTowers))
    return null;
  const totalBuildRate = finite(construction.totalBuildRate);
  if (totalBuildRate === null) return null;
  const gems = list(account.gemShopPurchases);
  const tasks = list(account.tasks);
  const meritRow = num(list(list(tasks[2])[2])[0]);
  const open = Math.min(
    BUILD_SLOTS.maxSlots,
    Math.round(BUILD_SLOTS.base + num(gems[BUILD_SLOTS.gemRow]) + Math.ceil(meritRow / 2)),
  );
  const buildSlots = Array.from({ length: open }, (_, i) => {
    const v = finite(rawTowers[BUILD_SLOTS.slotKey + i]);
    return v === null || v < 0 ? null : v;
  });
  const buildings = towers.data.flatMap((t): ConstructionBuilding[] => {
    if (!isDict(t) || typeof t.name !== 'string') return [];
    const index = finite(t.index);
    if (index === null) return [];
    const level = num(t.level);
    const salt = list(t.itemReq)[0];
    const saltRawName = isDict(salt) && typeof salt.rawName === 'string' ? salt.rawName : '';
    const buildCost = calls.getBuildCost(towers, level, num(t.bonusInc, 1), index);
    if (!Number.isFinite(buildCost)) return [];
    const progress = num(t.progress);
    return [
      {
        index,
        rawName: t.name,
        level,
        maxLevel: num(t.maxLevel),
        progress,
        buildCost,
        inSlot: t.inProgress === true,
        saltRawName,
        bodyFull: progress >= buildCost || t.nextLevel === true,
      },
    ];
  });
  return { totalBuildRate, buildSlots, buildings };
}

function booksIn(items: unknown[], place: HeldBook['place']): HeldBook[] {
  return items.flatMap((x): HeldBook[] => {
    if (!isDict(x) || typeof x.rawName !== 'string') return [];
    const page = BOOK_PAGES[x.rawName];
    const talentId = finite(x.Speed);
    const level = finite(x.Reach);
    if (!page || talentId === null || level === null || level <= 0) return [];
    const n = Math.max(1, Math.round(num(x.amount, 1)));
    return Array.from({ length: n }, () => ({ page, talentId, level, place }));
  });
}

function readLibrary(
  input: DepthInputs,
  calls: ToolboxCalls,
  frozen: <T>(f: () => T) => T,
): LibraryState | null {
  const { account, characters, data } = input;
  const times = account.libraryTimes;
  if (!isDict(times)) return null;
  const checkouts = finite(times.bookCount);
  const next = finite(times.next);
  const towers = isDict(account.towers) ? list(account.towers.data) : [];
  const lib = towers.find((t) => isDict(t) && t.name === 'Talent_Book_Library');
  if (checkouts === null || next === null || !isDict(lib)) return null;
  const range = frozen(() => calls.getBookLvRange(account));
  const min = isDict(range) ? finite(range.minBookLv) : null;
  const max = isDict(range) ? finite(range.maxBookLv) : null;
  if (min === null || max === null) return null;
  const lab = list(parsedJson(data.Lab));
  const storage = isDict(account.storage) ? list(account.storage.list) : [];
  const heldBooks = [
    ...booksIn(storage, 'storage'),
    ...characters.flatMap((ch, i) =>
      isDict(ch) && input.withData.includes(i) ? booksIn(list(ch.inventory), `inv:c${i}`) : [],
    ),
  ];
  return {
    checkouts,
    reservationOn: num(list(lab[16])[3]) === 1,
    libraryLevel: num(lib.level),
    nextInSeconds: Math.max(0, Math.round(next)),
    bookLv: { min, max },
    heldBooks,
  };
}

/** The M15 account fields (TR-2). */
export function readDepth(input: DepthInputs, c: Collector): Required<DepthAccountFields> {
  const s = input.withData;
  const { calls, withFrozenClock } = input;
  if (!calls || !withFrozenClock) return { refinery: null, construction: null, library: null };
  const frozen = <T>(f: () => T): T => withFrozenClock(input.asOf, f);
  return {
    refinery: field(c, 'account.refinery', s, () => readRefinery(input, calls, frozen)),
    construction: field(c, 'account.construction', s, () => readConstruction(input, calls)),
    library: field(c, 'account.library', s, () => readLibrary(input, calls, frozen)),
  };
}
