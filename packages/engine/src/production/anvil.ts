// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C FR-C7 and section 7: the anvil producer. A character's hammers (raw `AnvilPAselect_i`, save
// order) each work on one product; a hammer makes `anvilSpeed / requiredAmount` items an hour until the
// product reaches the anvil's capacity (Toolbox getPlayerAnvil, getTimeTillCap; every hammer on one product
// shares its room). Demand first (7.3): a product some Walkthrough, the next tab or a craft-next piece
// still misses takes hammers in save order until it is covered by the return. The remaining hammers take
// the multiset of products with the most Smithing EXP by the return (7.4), by brute force (at most 286
// multisets for 3 hammers over 11 products), cap-aware. A producer keeps its multiset unless the best is
// Demand-backed and the current isn't, or the best makes at least `keepRatio` times the EXP (7.5).
// Pure arithmetic on Toolbox numbers (ADR 0005); the comparison is on multisets, never slot positions.

/** One anvil product (production-plan.fact.anvil-exp). */
export interface AnvilProduct {
  index: number;
  rawName: string;
  requiredAmount: number;
  levelReq: number;
  exp: number;
}

export interface AnvilInput {
  hammers: readonly number[];
  stock: readonly number[];
  capacity: number;
  /** Anvil work per hour (Toolbox `stats.anvilSpeed`). */
  speed: number;
  smithingLevel: number;
  /** Hours to the player's return. */
  hours: number;
  products: readonly AnvilProduct[];
  /** Still missing of each product rawName, shared by every anvil filled before this one; updated in place. */
  demand: Map<string, number>;
  /** The order of a Demand product's source (lower first) and its name. */
  sourceOf: (rawName: string) => { rank: number; target: string } | null;
  keepRatio: number;
}

export interface AnvilAssignment {
  /** One product index per hammer, in save order, aligned with the current hammers where possible. */
  to: number[];
  /** Hammers the Demand phase placed, by product. */
  demandHammers: Map<number, number>;
  /** EXP by the return of the plan and of what the anvil makes now (base EXP, before multipliers). */
  bestExp: number;
  currentExp: number;
  /** Items each hammer adds by the return. */
  made: number[];
  room: number[];
  kind: 'switch' | 'keep' | 'demand';
  /** The Demand product the plan serves first, and how much of it was missing. */
  demand: { product: number; missing: number; hammers: number; target: string } | null;
  /** The product with the most EXP per work among the options, and whether it would cap. */
  topCaps: { product: number } | null;
}

const options = (input: AnvilInput) =>
  input.products.filter((p) => p.levelReq <= input.smithingLevel && p.index < input.stock.length);

/** Items one hammer on `p` makes in `hours`. */
const perHammer = (input: AnvilInput, p: AnvilProduct) => (input.speed / p.requiredAmount) * input.hours;

/** Output (items) of a multiset by product, each product capped by its room. */
function output(
  input: AnvilInput,
  counts: Map<number, number>,
  room: (i: number) => number,
): Map<number, number> {
  const out = new Map<number, number>();
  for (const [i, k] of counts) {
    const p = input.products[i];
    if (!p || k <= 0) continue;
    out.set(i, Math.max(0, Math.min(k * perHammer(input, p), room(i))));
  }
  return out;
}

const expOf = (input: AnvilInput, out: Map<number, number>) => {
  let n = 0;
  for (const [i, items] of out) n += items * (input.products[i]?.exp ?? 0);
  return n;
};

const countsOf = (xs: readonly number[]) => {
  const m = new Map<number, number>();
  for (const x of xs) if (x >= 0) m.set(x, (m.get(x) ?? 0) + 1);
  return m;
};

/** Every multiset of size k over `opts` (non-decreasing index lists). */
function* multisets(opts: readonly number[], k: number, start = 0, acc: number[] = []): Generator<number[]> {
  if (k === 0) {
    yield acc.slice();
    return;
  }
  for (let i = start; i < opts.length; i++) {
    acc.push(opts[i] as number);
    yield* multisets(opts, k - 1, i, acc);
    acc.pop();
  }
}

/** Aligns a plan's multiset with the current hammers: a hammer already on a planned product stays there. */
export function align(current: readonly number[], plan: readonly number[]): number[] {
  const left = [...plan];
  const out: Array<number | null> = current.map((h) => {
    const at = left.indexOf(h);
    if (h >= 0 && at >= 0) {
      left.splice(at, 1);
      return h;
    }
    return null;
  });
  left.sort((a, b) => a - b);
  return out.map((x) => (x === null ? (left.shift() as number) : x));
}

export function planAnvil(input: AnvilInput): AnvilAssignment {
  const n = input.hammers.length;
  const opts = options(input);
  const room0 = (i: number) => Math.max(0, input.capacity - (input.stock[i] ?? 0));
  const currentCounts = countsOf(input.hammers);
  const currentExp = expOf(input, output(input, currentCounts, room0));

  // 7.3 Demand first: hammers in save order, each to the best Demand-backed product still missing.
  const roomLeft = new Map<number, number>();
  const roomOf = (i: number) => roomLeft.get(i) ?? room0(i);
  const demandHammers = new Map<number, number>();
  let first: AnvilAssignment['demand'] = null;
  for (let h = 0; h < n; h++) {
    const wanted = opts
      .filter((p) => (input.demand.get(p.rawName) ?? 0) > 0 && roomOf(p.index) > 0)
      .map((p) => {
        const src = input.sourceOf(p.rawName);
        const d = input.demand.get(p.rawName) ?? 0;
        const u = Math.min(perHammer(input, p), roomOf(p.index));
        return { p, src, d, u };
      })
      .filter((x) => x.src !== null && x.u > 0)
      .sort(
        (a, b) => (a.src?.rank ?? 0) - (b.src?.rank ?? 0) || b.d / b.u - a.d / a.u || a.p.index - b.p.index,
      );
    const pick = wanted[0];
    if (!pick) break;
    demandHammers.set(pick.p.index, (demandHammers.get(pick.p.index) ?? 0) + 1);
    input.demand.set(pick.p.rawName, pick.d - pick.u);
    roomLeft.set(pick.p.index, roomOf(pick.p.index) - pick.u);
    if (!first)
      first = { product: pick.p.index, missing: pick.d, hammers: 1, target: pick.src?.target ?? '' };
    else if (first.product === pick.p.index) first.hammers += 1;
  }
  const placed = [...demandHammers.values()].reduce((a, b) => a + b, 0);

  // 7.4 The EXP fallback over the remaining hammers, with the room the Demand hammers leave.
  let best: number[] = [];
  let bestScore = -1;
  const rest = n - placed;
  const ids = opts.map((p) => p.index);
  if (rest > 0 && ids.length > 0) {
    for (const m of multisets(ids, rest)) {
      const score = expOf(input, output(input, countsOf(m), roomOf));
      // Ties keep what the anvil already makes (fewer switches), then the lower product indices.
      const overlap = (xs: number[]) => {
        const c = new Map(currentCounts);
        let k = 0;
        for (const x of xs) {
          const v = c.get(x) ?? 0;
          if (v > 0) {
            k++;
            c.set(x, v - 1);
          }
        }
        return k;
      };
      if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && overlap(m) > overlap(best))) {
        best = m;
        bestScore = score;
      }
    }
  }
  const planList = [...[...demandHammers].flatMap(([i, k]) => Array<number>(k).fill(i)), ...best];
  const planCounts = countsOf(planList);
  const planOut = output(input, planCounts, room0);
  const bestExp = expOf(input, planOut);

  // 7.5 Keep or switch, on multisets.
  const same =
    planList.length === input.hammers.filter((h) => h >= 0).length &&
    [...planCounts].every(([i, k]) => currentCounts.get(i) === k);
  const servesDemand = placed > 0 && [...demandHammers].every(([i, k]) => (currentCounts.get(i) ?? 0) >= k);
  const freeHammer = input.hammers.includes(-1);
  let kind: AnvilAssignment['kind'];
  if (placed > 0 && !servesDemand) kind = 'demand';
  else if (same || servesDemand) kind = 'keep';
  else if (freeHammer) kind = 'switch';
  else if (currentExp <= 0) kind = bestExp > 0 ? 'switch' : 'keep';
  else kind = bestExp >= input.keepRatio * currentExp ? 'switch' : 'keep';

  const to = kind === 'keep' ? [...input.hammers] : align(input.hammers, planList);
  const counts = countsOf(to);
  const outBy = output(input, counts, room0);
  const made = to.map((p) => (p < 0 ? 0 : (outBy.get(p) ?? 0) / (counts.get(p) ?? 1)));
  const room = to.map((p) => (p < 0 ? 0 : room0(p)));

  const top = [...opts].sort((a, b) => b.exp / b.requiredAmount - a.exp / a.requiredAmount)[0];
  const topCaps =
    top &&
    (counts.get(top.index) ?? 0) < n &&
    perHammer(input, top) * ((counts.get(top.index) ?? 0) + 1) > room0(top.index)
      ? { product: top.index }
      : null;

  return {
    to,
    demandHammers,
    bestExp,
    currentExp,
    made,
    room,
    kind,
    demand: kind === 'demand' ? first : null,
    topCaps,
  };
}

/** "1.6": a ratio to one decimal, half up (spec Fixture rule). */
export const ratioText = (r: number) => (Math.round(r * 10 + 1e-9) / 10).toFixed(1);
