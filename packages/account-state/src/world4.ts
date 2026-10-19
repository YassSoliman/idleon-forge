// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: Toolbox output (`account.lab`, `account.cooking`, `account.breeding`) plus a few raw save
// indices -> `account.lab`, `account.cooking`, `account.breeding`. Called from adapter.ts; the only place
// that knows these Toolbox paths and raw indices. Reading a raw save value is not a formula. A field is
// null when its Toolbox section failed or returned something unreadable (then it is also listed as
// unknown), or when the save has no World 4 record at all (old saves; not unknown).
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type {
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
  World4AccountFields,
} from './world4-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const num = (v: unknown, fallback = 0): number => finite(v) ?? fallback;
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const parsedJson = (v: unknown): unknown => {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
};

/** Chip slots per character (raw `Lab[1..n]` rows hold 7). */
export const LAB_CHIP_SLOTS = 7;
/** Kitchens in the save (raw `Cooking` rows). */
export const KITCHENS = 10;
const KITCHEN_STATUS: Record<number, KitchenStatus> = { 1: 'idle', 2: 'cooking', 3: 'recipe' };
/** `accountOptions` indices: the Lab unlock stage, Mob Arena best wave, spice claims today. */
const OPT = { labUnlocks: 91, arenaWave: 89, spiceClaims: 100 } as const;

interface Collector {
  unknown(path: string): void;
}

export interface World4Inputs {
  /** Toolbox's parsed account. */
  account: Dict;
  /** Toolbox's parsed characters (slot order). */
  characters: unknown[];
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

const charIndex = (ch: unknown, i: number): number => (isDict(ch) ? (finite(ch.playerId) ?? i) : i);
const skillLevel = (ch: unknown, skill: string): number | null => {
  if (!isDict(ch) || !isDict(ch.skillsInfo)) return null;
  const s = ch.skillsInfo[skill];
  return isDict(s) ? finite(s.level) : null;
};

function nodeOf(x: unknown): LabNode | null {
  if (!isDict(x)) return null;
  const index = finite(x.index);
  const name = str(x.name);
  const px = finite(x.x);
  const py = finite(x.y);
  if (index === null || name === null || px === null || py === null) return null;
  return { index, name, x: px, y: py, lit: x.active === true };
}

function shopWeek(input: World4Inputs): LabShopWeek | null {
  const { calls, account } = input;
  if (!calls) return null;
  try {
    const week = list(calls.getChipsAndJewels(account, 1))[0];
    if (!isDict(week) || !(week.date instanceof Date)) return null;
    const at = week.date.getTime();
    if (!Number.isFinite(at)) return null;
    const items = list(week.items).map((v, i): LabShopItem | null => {
      const name = isDict(v) ? str(v.name) : null;
      if (!isDict(v) || name === null) return null;
      const cost = list(v.requirements).flatMap((r) => {
        const n = isDict(r) ? str(r.name) : null;
        const amount = isDict(r) ? finite(r.amount) : null;
        return n !== null && amount !== null ? [{ name: n, amount }] : [];
      });
      return { name, kind: i < 2 ? 'chip' : 'jewel', cost };
    });
    if (items.length !== 3 || items.some((x) => x === null)) return null;
    return { weekStart: at, items: items as LabShopItem[] };
  } catch {
    return null;
  }
}

function readLab(input: World4Inputs): LabState {
  const lab = input.account.lab;
  if (!isDict(lab) || !Array.isArray(lab.labBonuses) || !Array.isArray(lab.jewels)) throw new Unreadable();
  const cords = list(lab.playersCords).filter(isDict);
  const connected = new Set(
    list(lab.connectedPlayers).flatMap((p) => (isDict(p) && finite(p.playerId) !== null ? [p.playerId] : [])),
  );
  const chipRows = list(lab.playersChips);
  const characters = input.characters.flatMap((ch, i): LabCharacter[] => {
    if (!isDict(ch)) return [];
    const index = charIndex(ch, i);
    const cord = cords.find((c) => finite(c.playerId) === index);
    const chips = Array.from({ length: LAB_CHIP_SLOTS }, (_, k) => {
      const c = list(chipRows[index])[k];
      return isDict(c) ? str(c.name) : null;
    });
    return [
      {
        index,
        labLevel: skillLevel(ch, 'laboratory') ?? 0,
        uploaded: ch.afkTarget === 'Laboratory' || connected.has(index),
        connected: connected.has(index),
        x: cord ? num(cord.x) : 0,
        y: cord ? num(cord.y) : 0,
        lineWidth: cord ? num(cord.lineWidth) : 0,
        chips,
      },
    ];
  });
  const bonuses = lab.labBonuses.flatMap((b) => {
    const n = nodeOf(b);
    return n ? [n] : [];
  });
  const jewels = lab.jewels.flatMap((j): LabJewel[] => {
    const n = nodeOf(j);
    return n && isDict(j) ? [{ ...n, owned: j.acquired === true }] : [];
  });
  const unlocks = num(list(input.account.accountOptions)[OPT.labUnlocks]);
  return {
    characters,
    bonuses,
    jewels,
    repositoryOpen: unlocks >= 1,
    spinnerOpen: unlocks >= 2,
    chipsOwned: num(lab.totalRawChips),
    shop: shopWeek(input),
  };
}

function readCooking(input: World4Inputs): CookingState {
  const { account, data } = input;
  const cooking = account.cooking;
  if (!isDict(cooking) || !Array.isArray(cooking.meals)) throw new Unreadable();
  const raw = list(parsedJson(data.Cooking));
  const mealsRaw = list(parsedJson(data.Meals));
  const territoryRaw = list(parsedJson(data.Territory));
  const tbKitchens = list(cooking.kitchens).filter(isDict);
  const kitchensFailed = input.failedSections.includes('cooking.kitchens');
  let owned = 0;
  const kitchens = Array.from({ length: KITCHENS }, (_, index): Kitchen => {
    const row = list(raw[index]);
    const code = num(row[0]);
    const status = KITCHEN_STATUS[code] ?? 'locked';
    // Toolbox drops the kitchens not bought; the bought ones are the first ones, in order.
    const tb = status === 'locked' ? undefined : tbKitchens[owned++];
    const meal = tb && isDict(tb.meal) && status === 'cooking' ? str(tb.meal.name) : null;
    return {
      index,
      status,
      meal,
      speedLv: num(row[6]),
      fireLv: num(row[7]),
      luckLv: num(row[8]),
      mealSpeed: tb && !kitchensFailed ? finite(tb.mealSpeed) : null,
    };
  });
  const meals = cooking.meals.flatMap((m): Meal[] => {
    if (!isDict(m)) return [];
    const name = str(m.name);
    const index = finite(m.index);
    if (name === null || index === null) return [];
    return [
      {
        index,
        name,
        level: num(m.level),
        amount: num(m.amount),
        levelCost: num(m.levelCost),
        cookReq: num(m.cookReq),
        perLevel: num(m.baseStat),
        effect: str(m.effect) ?? '',
      },
    ];
  });
  const spiceRows = isDict(cooking.spices) ? list(cooking.spices.toClaim) : [];
  const held = list(mealsRaw[3]);
  const spices = spiceRows.flatMap((s, index): Spice[] => {
    const name = isDict(s) ? str(s.name) : null;
    if (name === null) return [];
    const h = finite(held[index]);
    return [
      {
        index,
        name,
        held: h === null || h < 0 ? null : h,
        toClaim: Math.max(0, num(list(territoryRaw[index])[4])),
      },
    ];
  });
  const claims = finite(list(account.accountOptions)[OPT.spiceClaims]);
  return {
    kitchens,
    meals,
    mealMaxLevel: need(finite(cooking.mealMaxLevel)),
    spices,
    claimsToday: claims,
  };
}

function readBreeding(input: World4Inputs): BreedingState {
  const { account, data, characters } = input;
  const b = account.breeding;
  if (!isDict(b) || !Array.isArray(b.eggs) || !Array.isArray(b.territories)) throw new Unreadable();
  const eggCapacity = need(finite(b.eggCapacity));
  const eggs = b.eggs.slice(0, eggCapacity).filter((e) => num(e) > 0).length;
  const territoryRaw = list(parsedJson(data.Territory));
  const spicesHeld = list(list(parsedJson(data.Meals))[3]);
  const territories = b.territories.flatMap((t, index): Territory[] => {
    if (!isDict(t)) return [];
    const name = str(t.territoryName);
    if (name === null) return [];
    const foraging = str(list(territoryRaw[index])[3]);
    const found = num(spicesHeld[index], -1) >= 0;
    return [
      {
        index,
        name,
        battle: str(t.battleName) ?? '',
        enemyHp: list(t.enemies).reduce<number>((s, e) => s + (isDict(e) ? num(e.health) : 0), 0),
        status: foraging !== null && foraging !== 'Blank' ? 'foraging' : found ? 'won' : 'not-won',
      },
    ];
  });
  const upgrades = list(b.petUpgrades).flatMap((u, index): BreedingUpgrade[] => {
    if (index === 0 || !isDict(u)) return [];
    const name = str(u.name);
    if (name === null || name.startsWith('No_Upgrade')) return [];
    return [{ index, name, level: num(u.level), maxLevel: num(u.maxLevel) }];
  });
  const levels = characters.map((ch) => skillLevel(ch, 'breeding') ?? 0);
  const speciesBred = list(b.pets)
    .flatMap((row) => list(row))
    .filter((p) => isDict(p) && p.unlocked === true).length;
  const full = eggs >= eggCapacity;
  return {
    level: Math.max(0, ...levels),
    eggs,
    eggCapacity,
    nextEggInSeconds: full ? 0 : Math.max(0, Math.round(num(b.timeToNextEgg) / 1000)),
    deadDna: num(b.deadCells),
    arenaBestWave: num(list(account.accountOptions)[OPT.arenaWave]),
    speciesBred,
    territories,
    upgrades,
  };
}

/** Reads one field; null and unknown when its section failed or Toolbox gave something unreadable. */
function field<T>(
  c: Collector,
  path: string,
  input: World4Inputs,
  sections: string[],
  rawKey: string,
  read: () => T,
): T | null {
  if (input.data[rawKey] === undefined || input.data[rawKey] === null) return null;
  if (sections.some((s) => input.failedSections.includes(s))) {
    c.unknown(path);
    return null;
  }
  try {
    return read();
  } catch {
    c.unknown(path);
    return null;
  }
}

/** The M24 World 4 account fields. */
export function readWorld4(input: World4Inputs, c: Collector): Required<World4AccountFields> {
  return {
    lab: field(c, 'account.lab', input, ['lab'], 'Lab', () => readLab(input)),
    cooking: field(c, 'account.cooking', input, ['cooking'], 'Cooking', () => readCooking(input)),
    breeding: field(c, 'account.breeding', input, ['breeding'], 'Breeding', () => readBreeding(input)),
  };
}
