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

/**
 * The windows the anvil plan is made for (#70 A2, A3): the "Back in about" chips (M10
 * EXPECTED_RETURN_CHIPS, 2/4/8/12/24 h), so the plan follows the player's Expected Return with no
 * re-parse. The default Expected Return is 8 h.
 */
export const ANVIL_PLAN_WINDOWS_MS: readonly number[] = [2, 4, 8, 12, 24].map((h) => h * 3_600_000);

/**
 * The plan for an Expected Return: the window closest to it, the shorter one on a tie (a learned
 * 10 h plans for 8 h). Null without a plan.
 */
export function anvilPlanWindow(
  plan: AfkAnvilPlan | null | undefined,
  expectedReturnMs: number,
): AfkAnvilWindowPlan | null {
  let best: AfkAnvilWindowPlan | null = null;
  for (const w of plan?.windows ?? [])
    if (best === null || Math.abs(w.windowMs - expectedReturnMs) < Math.abs(best.windowMs - expectedReturnMs))
      best = w;
  return best;
}

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

/** HP one bite of a health food heals: its `Amount` times Toolbox's health-food multiplier. */
const healOf = (item: Dict, bonus: number | null): number | null => {
  const amount = num(item.Amount);
  if (item.Effect !== 'Health' || amount === null || bonus === null) return null;
  const heal = amount * bonus;
  return heal > 0 ? heal : null;
};

function foodOf(c: Dict, bonus: number | null): { food: AfkFood[]; blankFoodSlot: boolean } {
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
    const kind = foodKind(f.Type);
    food.push({ slot, item: raw, kind, amount, healPerBite: kind === 'health' ? healOf(f, bonus) : null });
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
  bonus: number | null,
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
        fixingFoods.push({
          item: candidate.item,
          name: candidate.name,
          amount: candidate.amount,
          healPerBite: healOf(candidate.data, bonus),
        });
    }
  }
  const hp = num(full?.maxHp);
  const maxHp = hp !== null && hp > 0 ? hp : null;
  const foodCap = attempt(
    () => num((calls.getItemCapacity('cFood', c, account) as Dict | undefined)?.value),
    (v) => v !== null && v > 0,
  );
  return {
    survivability,
    finalKillsPerHour,
    survivabilityNoFood,
    fixingFoods,
    spareHealthFood,
    maxHp,
    foodCap,
  };
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

/** Budgets up to this many points are scored at every integer split (#70 A2); larger ones are narrowed first. */
export const ANVIL_EXHAUSTIVE_MAX = 300;
/** Around the narrowed optimum, every split this far either side is still scored (rounding, ties). */
export const ANVIL_SCAN_RADIUS = 8;

const tolOf = (v: number) => 1e-9 * Math.max(1, Math.abs(v));

/**
 * The best split of `budget` points added on top of `base` (Speed, Capacity), by brute force over the
 * integer splits (#70 A2, ADR 0005: no closed form). `score(speed, capacity)` is the window output.
 * Ties go to Speed: spare Capacity does nothing inside the window.
 *
 * Up to `ANVIL_EXHAUSTIVE_MAX` points every split is scored. Above that (late game, over a thousand
 * points, where each score is a Toolbox call of about 0.15 ms), the output is concave in the split
 * (each product's min(rate x T, capacity) is a min of a rising and a falling line, and a sum of concave
 * terms is concave), so a binary search finds where it stops rising and where its plateau ends, and
 * every split within `ANVIL_SCAN_RADIUS` of either end is then scored exhaustively.
 */
export function bestAnvilSplit(
  base: { speed: number; capacity: number },
  budget: number,
  score: (speed: number, capacity: number) => number,
): AfkAnvilSplit {
  const f = (x: number) => score(base.speed + x, base.capacity + (budget - x));
  let xs: number[] = Array.from({ length: budget + 1 }, (_, x) => x);
  if (budget > ANVIL_EXHAUSTIVE_MAX) {
    // The first x where f stops rising strictly.
    let lo = 0;
    let hi = budget;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (f(m + 1) > f(m) + tolOf(f(m))) lo = m + 1;
      else hi = m;
    }
    const peak = lo;
    const top = f(peak);
    // The last x still level with the peak: the plateau's Speed end.
    let a = peak;
    let b = budget;
    while (a < b) {
      const m = (a + b + 1) >> 1;
      if (f(m) >= top - tolOf(top)) a = m;
      else b = m - 1;
    }
    // Both ends of the plateau, each with its neighbourhood; inside a plateau every split scores the
    // same (concavity), so its middle needs no scoring.
    xs = [];
    for (let x = Math.max(0, peak - ANVIL_SCAN_RADIUS); x <= Math.min(budget, peak + ANVIL_SCAN_RADIUS); x++)
      xs.push(x);
    for (
      let x = Math.max(peak + ANVIL_SCAN_RADIUS + 1, a - ANVIL_SCAN_RADIUS);
      x <= Math.min(budget, a + ANVIL_SCAN_RADIUS);
      x++
    )
      xs.push(x);
  }
  let best: AfkAnvilSplit | null = null;
  for (const x of xs) {
    const output = f(x);
    // Later x has more Speed, so a tie (within float noise) moves to it.
    if (best === null || output >= best.output - tolOf(best.output))
      best = { speed: base.speed + x, capacity: base.capacity + (budget - x), output };
  }
  return best ?? { ...base, output: f(0) };
}

/**
 * The anvil point plan (#70 A2, A3), scored with Toolbox's `getPlayerAnvil` on a clone whose
 * `anvil.anvilStats` carries counterfactual Speed and Capacity points. `anvilSpeed` reads only
 * `speedPoints` and `anvilCapacity` only `capPoints` (vendor/parsers/world-1/anvil.ts getPlayerAnvil),
 * so one call at (k, k) gives both numbers for k points; calls are made on demand and kept. Output over T from empty is the sum over producing
 * products of min(anvilSpeed x hammers x T / requiredAmount, anvilCapacity).
 */
function anvilPlanOf(
  c: Dict,
  characters: unknown[],
  account: Dict,
  calls: ToolboxCalls,
): AfkAnvilPlan | null {
  return attempt((): AfkAnvilPlan | null => {
    const anvil = isDict(c.anvil) ? c.anvil : null;
    const st = anvil && isDict(anvil.anvilStats) ? anvil.anvilStats : null;
    const skills = isDict(c.skillsInfo) ? c.skillsInfo : {};
    const smithingLevel = num(isDict(skills.smithing) ? skills.smithing.level : null);
    if (!anvil || !st || smithingLevel === null) return null;
    const [xp, speed, cap, coins, mats, acme] = [
      st.xpPoints,
      st.speedPoints,
      st.capPoints,
      st.pointsFromCoins,
      st.pointsFromMats,
      st.pointsFromAcme ?? 0,
    ].map(num);
    if (xp == null || speed == null || cap == null || coins == null || mats == null || acme == null)
      return null;
    if ([xp, speed, cap].some((v) => v < 0 || !Number.isInteger(v))) return null;
    const unspent = smithingLevel + acme + coins + mats - (xp + speed + cap);
    const pool = speed + cap + Math.max(0, unspent);
    if (!Number.isInteger(pool) || pool > 100_000) return null;

    // One call at (k, k) gives anvilSpeed for k Speed points and anvilCapacity for k Capacity points.
    const memo = new Map<number, { speed: number; capacity: number; pa: Dict }>();
    const at = (k: number) => {
      const hit = memo.get(k);
      if (hit) return hit;
      const clone = { ...c, anvil: { ...anvil, anvilStats: { ...st, speedPoints: k, capPoints: k } } };
      const pa = calls.getPlayerAnvil(clone, characters, account) as Dict;
      const stats = isDict(pa.stats) ? pa.stats : {};
      const v = num(stats.anvilSpeed);
      const cp = num(stats.anvilCapacity);
      if (v === null || cp === null || v <= 0 || cp <= 0) throw new Error('anvil numbers are not finite');
      const row = { speed: v, capacity: cp, pa };
      memo.set(k, row);
      return row;
    };
    const products: Array<{ item: string; name: string; hammers: number; required: number }> = [];
    for (const p of arr(at(speed).pa.production)) {
      const hammers = isDict(p) ? (num(p.hammers) ?? 0) : 0;
      if (!isDict(p) || hammers <= 0) continue;
      const required = num(p.requiredAmount);
      if (required === null || required <= 0) return null;
      const item = String(p.rawName);
      products.push({
        item,
        name: typeof p.displayName === 'string' ? p.displayName : item,
        hammers,
        required,
      });
    }
    products.sort((a, b) => a.item.localeCompare(b.item));
    const windows: AfkAnvilWindowPlan[] = [];
    for (const windowMs of ANVIL_PLAN_WINDOWS_MS) {
      const hours = windowMs / 3_600_000;
      const score = (s: number, k: number): number => {
        const v = at(s).speed;
        const cp = at(k).capacity;
        return products.reduce((sum, p) => sum + Math.min((v * p.hammers * hours) / p.required, cp), 0);
      };
      const current = { speed, capacity: cap, output: score(speed, cap) };
      const spend = unspent > 0 ? bestAnvilSplit({ speed, capacity: cap }, unspent, score) : null;
      const respec = bestAnvilSplit({ speed: 0, capacity: 0 }, pool, score);
      const splits = [current, respec, ...(spend ? [spend] : [])];
      if (splits.some((x) => !Number.isFinite(x.output))) return null;
      windows.push({ windowMs, current, spend, respec });
    }
    return {
      smithingLevel,
      xpPoints: xp,
      speedPoints: speed,
      capPoints: cap,
      unspent,
      products: products.map(({ item, name }) => ({ item, name })),
      windows,
    };
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
    const bonus = attempt(
      () => num(calls.getPlayerFoodBonus(c, account, true)),
      (v) => v !== null && v > 0,
    );
    const { food, blankFoodSlot } = foodOf(c, bonus);
    return {
      afkSince,
      food,
      blankFoodSlot,
      freeFoodSlots: null,
      fighting: attempt(() => fightingOf(c, characters, account, calls, blankFoodSlot, bonus)),
      inventory: attempt(() => inventoryOf(c, account, calls)),
      anvil: anvilOf(c, characters, account, calls, asOf),
      anvilPlan: anvilPlanOf(c, characters, account, calls),
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

    const currencies = isDict(account.currencies) ? account.currencies : null;
    const coins = attempt(
      () => num(currencies?.rawMoney),
      (v) => v !== null && v >= 0,
    );

    return { projectedAt: asOf, arcade, liquids, salts, storageFreeSlots, coins };
  });
}
