// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M3 AFK Safety's Account State facts (M3 TR-2), built from Toolbox's parse plus Toolbox's own
// functions (ADR 0005: Toolbox numbers and plain arithmetic, never our formulas). The functions arrive
// injected (`ToolboxCalls`, from the parser bundle's `toolboxCalls`) because only the parse worker may
// load the bundle; without them every fact here is null and M3's Checks say Unknown.
//
// Every sub-fact is computed on its own: a throw or a non-finite number makes that one fact null
// (TR-2 "finite or null", RT-3), never a default.
import type { ParsedSave, ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type {
  AccountAfkFacts,
  AfkAnvilProduct,
  AfkFighting,
  AfkFood,
  AfkFoodKind,
  AfkInventory,
  AfkWorship,
  CharacterAfkFacts,
} from './afk-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** Times further than this from the parse are not sane (TR-2): the fact becomes null. */
export const AFK_HORIZON_MS = 30 * 24 * 3_600_000;
/** At most this many distinct owned health foods are tried in the survivability clone (TR-2, TR-8). */
export const MAX_FOODS_TRIED = 4;

const FOOD_KINDS: Record<string, AfkFoodKind> = {
  HEALTH_FOOD: 'health',
  BOOST_FOOD: 'boost',
  GOLDEN_FOOD: 'golden',
};
const foodKind = (type: unknown): AfkFoodKind => (typeof type === 'string' && FOOD_KINDS[type]) || 'other';

/** Runs `f`; a throw or a value `ok` rejects is null. */
function attempt<T>(f: () => T, ok: (v: T) => boolean = () => true): T | null {
  try {
    const v = f();
    return v !== null && v !== undefined && ok(v) ? v : null;
  } catch {
    return null;
  }
}

const sane = (asOf: number) => (t: number) => Number.isFinite(t) && Math.abs(t - asOf) <= AFK_HORIZON_MS;

function foodOf(c: Dict): { food: AfkFood[]; blankFoodSlot: boolean } {
  const food: AfkFood[] = [];
  let blankFoodSlot = false;
  arr(c.food).forEach((f, slot) => {
    if (!isDict(f)) return;
    const raw = typeof f.rawName === 'string' ? f.rawName : '';
    const amount = num(f.amount) ?? 0;
    if (raw === '' || raw === 'Blank' || amount <= 0) {
      if (raw === 'Blank' || raw === '') blankFoodSlot = true;
      return;
    }
    food.push({ slot, item: raw, kind: foodKind(f.Type), amount });
  });
  return { food, blankFoodSlot };
}

/** Owned health-food stacks this character could equip: its own bag plus storage, summed per item. */
function ownedHealthFoods(
  c: Dict,
  account: Dict,
): Array<{ item: string; name: string; amount: number; data: Dict }> {
  const storage = isDict(account.storage) ? arr(account.storage.list) : [];
  const byItem = new Map<string, { item: string; name: string; amount: number; data: Dict }>();
  for (const x of [...arr(c.inventory), ...storage]) {
    if (!isDict(x) || x.Type !== 'HEALTH_FOOD' || typeof x.rawName !== 'string') continue;
    const amount = num(x.amount) ?? 0;
    if (amount <= 0) continue;
    const prev = byItem.get(x.rawName);
    if (prev) prev.amount += amount;
    else {
      const name = typeof x.displayName === 'string' ? x.displayName : x.rawName;
      byItem.set(x.rawName, { item: x.rawName, name, amount, data: x });
    }
  }
  return [...byItem.values()].sort((a, b) => a.amount - b.amount || a.item.localeCompare(b.item));
}

const pct = (v: unknown): number | null => {
  const n = num(v);
  return n !== null && n >= 0 && n <= 100 ? n : null;
};

function fightingOf(
  c: Dict,
  characters: unknown[],
  account: Dict,
  calls: ToolboxCalls,
  blankFoodSlot: boolean,
): AfkFighting | null {
  if (c.afkType !== 'FIGHTING') return null;
  const full = attempt(() => calls.getMaxDamage(c, characters, account) as Dict);
  const noFood = attempt(() => calls.getMaxDamage({ ...c, food: [] }, characters, account) as Dict);
  const survivability = pct(full?.survivability);
  const survivabilityNoFood = pct(noFood?.survivability);
  const finalKillsPerHour = num(full?.finalKillsPerHour);
  if (survivability === null || survivabilityNoFood === null || finalKillsPerHour === null) return null;
  if (finalKillsPerHour < 0) return null;

  const fixingFoods: AfkFighting['fixingFoods'] = [];
  const owned = ownedHealthFoods(c, account);
  const spareHealthFood = owned.reduce((n, f) => n + f.amount, 0);
  if (survivability < 100 && blankFoodSlot) {
    const buffer = arr(c.food);
    const blank = buffer.findIndex((f) => isDict(f) && (f.rawName === 'Blank' || !f.rawName));
    for (const candidate of owned.slice(-MAX_FOODS_TRIED)) {
      const food = buffer.map((f, i) => (i === blank ? { ...candidate.data, amount: candidate.amount } : f));
      const r = attempt(() => calls.getMaxDamage({ ...c, food }, characters, account) as Dict);
      if (pct(r?.survivability) === 100)
        fixingFoods.push({ item: candidate.item, name: candidate.name, amount: candidate.amount });
    }
  }
  return { survivability, finalKillsPerHour, survivabilityNoFood, fixingFoods, spareHealthFood };
}

function inventoryOf(c: Dict, account: Dict, calls: ToolboxCalls): AfkInventory | null {
  const totalSlots = num(c.inventorySlots);
  if (totalSlots === null || totalSlots <= 0) return null;
  const stacks: AfkInventory['stacks'] = [];
  for (const x of arr(c.inventory)) {
    if (!isDict(x) || typeof x.rawName !== 'string' || x.rawName === 'Blank') continue;
    const amount = num(x.amount) ?? 0;
    const capValue = attempt(
      () => num((calls.getItemCapacity(x.typeGen, c, account) as Dict | undefined)?.value),
      (v) => v !== null && v > 0,
    );
    stacks.push({ item: x.rawName, amount, cap: capValue });
  }
  return { usedSlots: stacks.length, totalSlots, stacks };
}

function anvilOf(c: Dict, characters: unknown[], account: Dict, calls: ToolboxCalls, asOf: number) {
  return attempt((): AfkAnvilProduct[] | null => {
    const anvil = calls.getPlayerAnvil(c, characters, account) as Dict;
    const stats = isDict(anvil.stats) ? anvil.stats : {};
    const capacity = num(stats.anvilCapacity);
    if (capacity === null || capacity <= 0) return null;
    const out: AfkAnvilProduct[] = [];
    for (const p of arr(anvil.production)) {
      if (!isDict(p) || !((num(p.hammers) ?? 0) > 0)) continue;
      const args = { ...p, afkTime: c.afkTime, stats };
      const tillCap = num(calls.getTimeTillCap(args));
      const fromZero = num(calls.getTimeTillCap({ ...args, fromZero: true }));
      if (tillCap === null || fromZero === null || fromZero <= 0) return null;
      const capAt = Math.round(asOf + Math.max(0, tillCap) * 1000);
      if (!sane(asOf)(capAt) || fromZero * 1000 > AFK_HORIZON_MS) return null;
      out.push({
        item: String(p.rawName),
        name: typeof p.displayName === 'string' ? p.displayName : String(p.rawName),
        hammers: num(p.hammers) ?? 0,
        amount: num(p.currentAmount) ?? 0,
        capacity,
        capAt,
        fromEmptyMs: Math.round(fromZero * 1000),
      });
    }
    return out;
  });
}

function worshipOf(c: Dict): AfkWorship | null {
  const w = isDict(c.worship) ? c.worship : null;
  const charge = num(w?.currentCharge);
  const max = num(w?.maxCharge);
  const ratePerHour = num(w?.chargeRate);
  if (charge === null || max === null || ratePerHour === null || max <= 0 || ratePerHour <= 0) return null;
  const hasSkull = arr(c.tools).some((t) => isDict(t) && t.Type === 'WORSHIP_SKULL');
  return { charge, max, ratePerHour, hasSkull };
}

function prayersOf(c: Dict, account: Dict, calls: ToolboxCalls) {
  return attempt(() =>
    arr(c.activePrayers).flatMap((p) => {
      if (!isDict(p) || typeof p.name !== 'string') return [];
      const bonus = num((calls.getPrayerBonusAndCurse(c.activePrayers, p.name, account) as Dict)?.bonus);
      if (bonus === null) throw new Error('prayer bonus is not a number');
      return [{ name: p.name, bonus }];
    }),
  );
}

function trapsOf(account: Dict, index: number, lastCloudSave: number, asOf: number) {
  const traps = arr(account.traps)[index];
  if (!Array.isArray(traps)) return null;
  return attempt(() => ({
    placed: traps.flatMap((t) => {
      if (!isDict(t)) return [];
      const timeLeft = num(t.timeLeft);
      if (timeLeft === null) throw new Error('trap time is not a number');
      // Toolbox adds the remaining time to its parse clock; anchor it to the cloud save instead (TR-2).
      const endsAt = Math.round(lastCloudSave + (timeLeft - asOf));
      if (!sane(asOf)(endsAt)) throw new Error('trap time out of range');
      return [{ critter: String(t.rawName), endsAt }];
    }),
  }));
}

function cauldronOf(account: Dict, index: number): boolean | null {
  const alchemy = isDict(account.alchemy) ? account.alchemy : null;
  const row = arr(alchemy?.activities).find((a) => isDict(a) && num(a.index) === index);
  if (!isDict(row)) return null;
  const activity = num(row.activity);
  return activity === null ? null : activity !== -1;
}

export interface AfkFactsInput {
  parsed: ParsedSave;
  calls: ToolboxCalls;
  /** The parse clock (`AccountState.asOf`). */
  asOf: number;
  /** `AccountSummary.lastCloudSave`, or null when unknown. */
  lastCloudSave: number | null;
  withFrozenClock: <T>(now: number, f: () => T) => T;
}

/** One character's facts, or null when its AFK start time is unknown. */
export function characterAfkFacts(input: AfkFactsInput, index: number): CharacterAfkFacts | null {
  const { parsed, calls, asOf, lastCloudSave } = input;
  const c = parsed.characters[index];
  if (!isDict(c)) return null;
  const afkSince = num(c.afkTime);
  if (afkSince === null || !sane(asOf)(afkSince)) return null;
  const account = parsed.account;
  const characters = parsed.characters;
  return input.withFrozenClock(asOf, () => {
    const { food, blankFoodSlot } = foodOf(c);
    return {
      afkSince,
      food,
      blankFoodSlot,
      freeFoodSlots: null,
      fighting: attempt(() => fightingOf(c, characters, account, calls, blankFoodSlot)),
      inventory: attempt(() => inventoryOf(c, account, calls)),
      anvil: anvilOf(c, characters, account, calls, asOf),
      worship: attempt(() => worshipOf(c)),
      prayers: prayersOf(c, account, calls),
      traps: lastCloudSave === null ? null : trapsOf(account, index, lastCloudSave, asOf),
      cauldronAssigned: cauldronOf(account, index),
    };
  });
}

export function accountAfkFacts(input: AfkFactsInput): AccountAfkFacts {
  const { parsed, calls, asOf } = input;
  const account = parsed.account;
  const timeAway = isDict(account.timeAway) ? account.timeAway : {};
  return input.withFrozenClock(asOf, () => {
    const arcade = attempt(() => {
      const claimed = num(timeAway.Arcade);
      const maxClaimS = num(calls.getMaxClaimTime(account));
      if (claimed === null || maxClaimS === null || maxClaimS <= 0) return null;
      const lastClaimAt = Math.round(claimed * 1000);
      if (lastClaimAt > asOf + 60_000 || asOf - lastClaimAt > AFK_HORIZON_MS * 12) return null;
      return { lastClaimAt, maxClaimMs: maxClaimS * 1000 };
    });

    const liquids = attempt(() => {
      const alchemy = isDict(account.alchemy) ? account.alchemy : null;
      const current = arr(alchemy?.liquids);
      const cauldrons = arr(alchemy?.liquidCauldrons);
      if (cauldrons.length === 0) return null;
      return cauldrons.map((lc, index) => {
        const max = num(isDict(lc) ? lc.maxLiquid : null);
        const cur = num(current[index]);
        if (max === null || cur === null || max <= 0 || cur < 0) throw new Error('liquid not a number');
        return { index, current: cur, max };
      });
    });

    const salts = attempt(() =>
      arr(calls.getSaltMatsTimeLeft(account, parsed.characters)).flatMap((s) => {
        if (!isDict(s)) return [];
        const hours = num(s.hoursLeft);
        if (hours === null || hours < 0) throw new Error('salt time not a number');
        const dryAt = Math.round(asOf + hours * 3_600_000);
        return dryAt - asOf > AFK_HORIZON_MS ? [] : [{ salt: String(s.rawName), dryAt }];
      }),
    );

    const storageFreeSlots = attempt(() => {
      const storage = isDict(account.storage) ? account.storage : null;
      const slots = num(isDict(storage?.slots) ? storage.slots.value : storage?.slots);
      const used = arr(storage?.list).filter((x) => isDict(x) && x.rawName !== 'Blank').length;
      return slots === null ? null : Math.max(0, slots - used);
    });

    return { projectedAt: asOf, arcade, liquids, salts, storageFreeSlots };
  });
}
