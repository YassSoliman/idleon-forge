// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 TR-5's typed facts, one pure function per sink: which purchases a Spend item can stand for on this
// account, with their Toolbox costs. No words here (the entries hold them) and no allocation (allocate.ts).
// Every coin figure is a Toolbox number or a sum of Toolbox numbers (ADR 0005).
import {
  type AccountState,
  humanize,
  type SpendInputs,
  type StampRaise,
  type StampState,
  type VaultRow,
} from '@idleon-forge/account-state';
import type { Entry } from '@idleon-forge/knowledge';
import { p2wOrder } from '../alchemy/p2w';
import type { ResolvedSpendItem } from './knowledge';
import type { SpendHandoff, SpendSink, SpendStep } from './types';

/** D6: an open-ended item's default share of its paying wallet. */
export const DEFAULT_SHARE_CAP = 1 / 3;
/** D4: hold cap raises only for a stamp that fits within this many days. */
export const HOLD_DAYS = 7;
/** TR-4 partial-fill checkpoints. */
export const CHECKPOINTS = [1, 2, 3, 5, 10, 15, 20, 25] as const;
/** The game's discount cap (Toolbox MAX_STAMP_REDUCTION). */
export const MAX_REDUCTION = 90;
/** FR-17 / AC-9.2: stamps, bribes and their kin open at Mr Pigibank; below this the Vault alone. */
export const SINKS_OPEN_AT_LEVEL = 14;
/** Book bribes (sets 1-4) are indices 0-25 (TR-4); the rest are sold elsewhere. */
export const LAST_BOOK_BRIBE = 25;
export const DUPLICATE_ENTRIES_ROW = 52;
const MAJOR_DISCOUNT_ROW = 13;

/** One way to fill a candidate partway (TR-4 partial fill): the first `steps`, or the row to `toLevel`. */
export interface Fill {
  coins: number;
  steps: SpendStep[];
}

export interface Candidate {
  item: ResolvedSpendItem;
  sink: SpendSink;
  /** What it buys, for claims: an earlier item claims a purchase before a sweep can. */
  claim: string;
  /** Display name of the thing ("Sleepy Time", "Target Stamp"). */
  name: string;
  /** The full target. */
  full: Fill;
  /** Smaller fills, largest first (vault checkpoints; a stamp batch without its last raises). */
  partial: Fill[];
  /** Unpriced (D3, FR-14): never deducted, never affordable. */
  unpriced: boolean;
  /** Each step is paid by its own `payer` (Anvil coin points). */
  perStepPayer: boolean;
  /** FR-6 (2): for stamps, the character who carries the material. */
  preferPayer: number | null;
  /** Stamp material steps re-pick their doer once the payer is known. */
  raises: StampRaise[] | null;
  reserve: boolean;
  /** D6: share of the paying wallet's starting coins (bank excluded); null when not open-ended. */
  shareCap: number | null;
  hold: { discountPct: number; neededPct: number; days: number; stamp: string } | null;
  fields: string[];
  /** Template slots beyond payer and coins. */
  slots: Record<string, string | number>;
}

export interface CandidateContext {
  state: AccountState;
  spend: SpendInputs;
  entries: Readonly<Record<string, Entry>>;
  /** M2's frontier gate (FR-21): Bullseye on hit chance, the defence rows on survivability. */
  gate: { bullseye: boolean; defence: boolean };
  world: number;
  handoffs: SpendHandoff[];
  notCovered: Set<string>;
  /** FR-11: the Hydrogen batch has been built; later items add no raise. */
  batched?: boolean;
}

const valuesOf = (ctx: CandidateContext, ref: string): Record<string, unknown> =>
  (ctx.entries[ref]?.values ?? {}) as Record<string, unknown>;
const dataOf = (ctx: CandidateContext, ref: string): Record<string, unknown> =>
  ((ctx.entries[ref] as { data?: Record<string, unknown> } | undefined)?.data ?? {}) as Record<
    string,
    unknown
  >;
const isSweep = (item: ResolvedSpendItem) => item.slug.startsWith('every-');
const finite = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

function base(item: ResolvedSpendItem, sink: SpendSink, claim: string, name: string, full: Fill): Candidate {
  return {
    item,
    sink,
    claim,
    name,
    full,
    partial: [],
    unpriced: false,
    perStepPayer: false,
    preferPayer: null,
    raises: null,
    reserve: item.spend.reserve,
    shareCap: item.spend.openEnded ? (item.spend.shareCap ?? DEFAULT_SHARE_CAP) : null,
    hold: null,
    fields: [],
    slots: {},
  };
}

// ---------- spend/vault-candidates ----------

const vaultRef = (i: number) => `upgrade-vault.acquisition.row-${i}`;
export const rowOf = (ref: string): number | null => {
  const m = /^upgrade-vault\.acquisition\.row-(\d+)$/.exec(ref);
  return m ? Number(m[1]) : null;
};

/** The target level a Spend item asks of a row; null when already met. */
export function vaultTarget(
  item: ResolvedSpendItem,
  row: Pick<VaultRow, 'level' | 'maxLevel'>,
): number | null {
  const t = item.spend.target;
  const max = row.maxLevel;
  let to: number;
  switch (t.kind) {
    case 'once':
      to = Math.min(max, Math.max(1, row.level + (row.level === 0 ? 1 : 0)));
      break;
    case 'to-level':
      to = Math.min(max, t.level ?? max);
      break;
    case 'to-max':
      to = max;
      break;
    case 'levels':
      to = Math.min(max, row.level + (t.levels ?? 1));
      break;
    case 'next':
      to = Math.min(max, row.level + 1);
      break;
    default:
      return null;
  }
  return to > row.level ? to : null;
}

/** Coins for +k levels: the ladder when it reaches, costToMax for the whole way, else null (beyond the ladder). */
function vaultCost(row: VaultRow, k: number): number | null {
  const step = row.ladder.find((x) => x.k === k);
  if (step) return step.coins;
  if (row.level + k === row.maxLevel && finite(row.costToMax) && row.costToMax > 0) return row.costToMax;
  return null;
}

export function vaultCandidates(item: ResolvedSpendItem, ctx: CandidateContext): Candidate[] {
  const vault = ctx.spend.vault;
  const index = rowOf(item.ref);
  if (!vault || index === null) return [];
  const row = vault.rows.find((r) => r.index === index);
  // FR-8: drop a row that is maxed or not yet buyable, whatever cost Toolbox still reports.
  if (!row?.buyable || row.level >= row.maxLevel) return [];
  // FR-21: gated combat rows enter their position only when the gate fires.
  const gate = item.spend.gate;
  if (gate === 'spend/combat-row-gate') {
    const open = index === 4 ? ctx.gate.bullseye : ctx.gate.defence;
    if (!open) return [];
  }
  let to = vaultTarget(item, row);
  if (to === null) return [];
  // A target past the ladder's reach is cut to it (the rest stays a later line), unless it is the max.
  let k = to - row.level;
  if (vaultCost(row, k) === null) {
    // Cut to the largest ladder checkpoint below the target; the rest stays a later line.
    k = row.ladder.filter((x) => x.k < k).at(-1)?.k ?? 0;
    to = row.level + k;
  }
  const coins = vaultCost(row, k);
  if (k <= 0 || !finite(coins)) return [];
  const ref = vaultRef(index);
  const step = (toLevel: number, c: number): SpendStep => ({
    sink: 'vault',
    ref,
    fromLevel: row.level,
    toLevel,
    coins: c,
  });
  const c = base(item, 'vault', ref, humanize(row.name), {
    coins,
    steps: [step(to, coins)],
  });
  c.partial = row.ladder
    .filter((x) => x.k < k && (CHECKPOINTS as readonly number[]).includes(x.k))
    .map((p) => ({ coins: p.coins, steps: [step(row.level + p.k, p.coins)] }))
    .reverse();
  c.fields = [
    `account.spend.vault.rows[${index}].level`,
    `account.spend.vault.rows[${index}].ladder`,
    'account.spend.wallets',
  ];
  if (index === MAJOR_DISCOUNT_ROW) c.fields.push('account.spend.vault.rows[13].costToMax');
  c.slots = { from: row.level, to, levels: to - row.level };
  return [c];
}

// ---------- spend/vault-unlock-fuel ----------

/** FR-13: levels to the next unlock, and the cheapest-first coin estimate over every row's ladder marginals. */
export function unlockFuel(spend: SpendInputs): { levels: number; coinsAbout: number; index: number } | null {
  const vault = spend.vault;
  if (!vault?.nextUnlock) return null;
  const levels = vault.nextUnlock.at - vault.totalLevels;
  if (levels <= 0) return null;
  const marginals: number[] = [];
  for (const row of vault.rows) {
    if (!row.buyable) continue;
    // Between two checkpoints each level counts as the interval's average: an estimate ("about").
    row.ladder.forEach((s, i) => {
      const prev = i === 0 ? { k: 0, coins: 0 } : (row.ladder[i - 1] as { k: number; coins: number });
      const n = s.k - prev.k;
      for (let j = 0; j < n; j++) marginals.push((s.coins - prev.coins) / n);
    });
  }
  marginals.sort((a, b) => a - b);
  const coinsAbout = marginals.slice(0, levels).reduce((s, x) => s + x, 0);
  return { levels, coinsAbout, index: vault.nextUnlock.index };
}

// ---------- spend/stamp-coin-levels, spend/stamp-raise-ready, spend/stamp-hydrogen ----------

const stampRef = (id: string) => `stamps.acquisition.${id.replace(/^Stamp/, 'stamp-').toLowerCase()}`;

/** FR-10's readiness of one at-cap stamp's raise at a price variant. */
export function raiseReady(
  s: StampState,
  price: StampRaise['atDiscount'],
  discountPct: number,
): 'ready' | 'stamp-material' | 'stamp-carry' | 'not-next-tier' {
  const r = s.raise;
  if (!r) return 'not-next-tier';
  const counted = r.materialType !== 'Equip' || r.ownedAnywhere >= price.cost;
  if (!price.hasMaterials || !counted) return 'stamp-material';
  if (!price.carryOk) return 'stamp-carry';
  if (r.afterRaise.level !== s.level + s.capStep || r.afterRaise.reduction !== discountPct)
    return 'not-next-tier';
  if (!finite(r.coinsAfterRaise)) return 'not-next-tier';
  return 'ready';
}

/** D4: a stamp whose material is owned but too big to carry today, and the days until it fits. */
export function waitingToFit(s: StampState, hydrogen: NonNullable<SpendInputs['hydrogen']>) {
  const r = s.raise;
  if (!r || hydrogen.dailyRate <= 0 || r.minReduction === null || r.minReduction > MAX_REDUCTION) return null;
  const owned = r.materialType === 'Equip' ? r.ownedAnywhere : r.ownedInStorage;
  if (owned < r.atDiscount.cost || r.atDiscount.carryOk) return null;
  const days = Math.ceil(Math.max(0, r.minReduction - hydrogen.discountPct) / hydrogen.dailyRate);
  return { neededPct: r.minReduction, days };
}

function stampStep(s: StampState, price: number, doer: number): SpendStep {
  const r = s.raise as StampRaise;
  return {
    sink: 'stamp',
    ref: stampRef(s.id),
    fromLevel: s.level,
    toLevel: r.afterRaise.level,
    coins: r.coinsAfterRaise,
    material: { item: r.material, amount: price, doer },
  };
}

/** Coin levels below the cap (FR-10's coin-only lines, M8 FR-2). */
function stampCoinCandidate(item: ResolvedSpendItem, s: StampState): Candidate | null {
  if (s.level >= s.cap || !finite(s.coinsToCap) || s.coinsToCap <= 0) return null;
  const ref = stampRef(s.id);
  const c = base(item, 'stamp', `${ref}|coins`, humanize(s.name), {
    coins: s.coinsToCap,
    steps: [{ sink: 'stamp', ref, fromLevel: s.level, toLevel: s.cap, coins: s.coinsToCap }],
  });
  c.fields = [`account.spend.stamps[${s.id}].coinsToCap`, 'account.spend.wallets'];
  c.slots = { from: s.level, to: s.cap, levels: s.cap - s.level };
  return c;
}

export function stampCandidates(
  item: ResolvedSpendItem,
  ctx: CandidateContext,
  claimed: Set<string>,
): Candidate[] {
  const list = ctx.spend.stamps;
  if (!list || ctx.spend.highestClassLevel < SINKS_OPEN_AT_LEVEL) return [];
  // FR-11: with Hydrogen above Lv 0 every ready raise is one batch, so the first raise item takes them all.
  const batching = (ctx.spend.hydrogen?.level ?? 0) > 0 && item.spend.target.kind !== 'to-max';
  const pick = isSweep(item) || batching ? list : list.filter((s) => stampRef(s.id) === item.ref);
  // A stamp item's target says what it buys: `to-max` coin levels up to the cap, `next` the cap raise
  // to the next tier (then its new levels), anything else both.
  const kind = item.spend.target.kind;
  const out: Candidate[] = [];
  const raises: StampState[] = [];
  for (const s of pick) {
    const ref = stampRef(s.id);
    if (s.level < s.cap) {
      if (kind === 'next' || (batching && !isSweep(item) && stampRef(s.id) !== item.ref)) continue;
      if (claimed.has(`${ref}|coins`)) continue;
      const c = stampCoinCandidate(item, s);
      if (c) out.push(c);
    } else if (s.raise && kind !== 'to-max' && !claimed.has(`${ref}|raise`)) raises.push(s);
  }
  if (batching) {
    if (ctx.batched) return out;
    ctx.batched = true;
  }
  out.push(...raiseCandidates(item, ctx, raises));
  return out;
}

/** FR-10, FR-11: ready cap raises, one line each, or one Hydrogen batch (held or not). */
function raiseCandidates(item: ResolvedSpendItem, ctx: CandidateContext, stamps: StampState[]): Candidate[] {
  const hydrogen = ctx.spend.hydrogen;
  const batching = (hydrogen?.level ?? 0) > 0;
  const discount = hydrogen?.discountPct ?? 0;
  const gildedHeld = ctx.spend.gildedStamps > 0;
  const ready: { s: StampState; price: number }[] = [];
  const waiting: { s: StampState; neededPct: number; days: number }[] = [];
  // The first raise takes the discount (and the Gilded Stamp); it goes to the costliest material.
  const byCost = [...stamps].sort(
    (a, b) => (b.raise?.atDiscount.cost ?? 0) - (a.raise?.atDiscount.cost ?? 0) || (a.id < b.id ? -1 : 1),
  );
  let firstTaken = false;
  for (const s of byCost) {
    const r = s.raise as StampRaise;
    const first = !firstTaken;
    const variant =
      gildedHeld && first && r.gilded
        ? r.gilded
        : batching && !first
          ? (r.atZero ?? r.atDiscount)
          : r.atDiscount;
    const verdict = raiseReady(s, variant, discount);
    if (verdict === 'ready') {
      ready.push({ s, price: variant.cost });
      firstTaken = true;
      continue;
    }
    if (batching && hydrogen) {
      const w = waitingToFit(s, hydrogen);
      if (w && w.days <= HOLD_DAYS) {
        waiting.push({ s, ...w });
        continue;
      }
    }
    if (verdict === 'stamp-material' || verdict === 'stamp-carry') {
      const ref = stampRef(s.id);
      const shortfall =
        verdict === 'stamp-material'
          ? Math.max(0, variant.cost - (r.materialType === 'Equip' ? r.ownedAnywhere : r.ownedInStorage))
          : Math.max(0, variant.cost - (r.carriers[0]?.capacity ?? 0));
      ctx.handoffs.push({ kind: verdict, ref, shortfall });
      ctx.notCovered.add(verdict === 'stamp-material' ? 'stamps.raise-material' : 'stamps.raise-carry');
    }
  }
  if (!ready.length) return [];
  const doer = (s: StampState, amount: number, payer: number | null) => {
    const carriers = (s.raise as StampRaise).carriers;
    const own = payer === null ? undefined : carriers.find((c) => c.characterIndex === payer);
    const best = carriers[0]?.characterIndex ?? payer ?? 0;
    return own && own.capacity >= amount && payer !== null ? payer : best;
  };
  const make = (group: { s: StampState; price: number }[]): Candidate => {
    const steps = group.map(({ s, price }) => stampStep(s, price, doer(s, price, null)));
    const coins = steps.reduce((t, x) => t + (x.coins ?? 0), 0);
    const first = group[0]?.s as StampState;
    const c = base(
      item,
      'stamp',
      group.map(({ s }) => `${stampRef(s.id)}|raise`).join(','),
      humanize(first.name),
      {
        coins,
        steps,
      },
    );
    c.raises = group.map(({ s }) => s.raise as StampRaise);
    c.preferPayer = (first.raise as StampRaise).carriers[0]?.characterIndex ?? null;
    c.fields = [
      ...group.map(({ s }) => `account.spend.stamps[${s.id}].raise`),
      'account.spend.hydrogen',
      'account.spend.wallets',
    ];
    c.slots = { from: first.level, to: (first.raise as StampRaise).afterRaise.level, count: group.length };
    return c;
  };
  if (!batching) return ready.map((r) => make([r]));
  // One batch line; prefixes are its partial fills (the costliest raise first keeps the discount).
  const batch = make(ready);
  batch.partial = ready
    .slice(0, -1)
    .map((_, i) => {
      const part = ready.slice(0, i + 1);
      const steps = batch.full.steps.slice(0, i + 1);
      return { coins: steps.reduce((t, x) => t + (x.coins ?? 0), 0), steps, n: part.length };
    })
    .reverse()
    .map(({ coins, steps }) => ({ coins, steps }));
  const needed = waiting.reduce<(typeof waiting)[number] | null>(
    (best, w) => (best === null || w.neededPct > best.neededPct ? w : best),
    null,
  );
  if (needed && hydrogen)
    batch.hold = {
      discountPct: hydrogen.discountPct,
      neededPct: needed.neededPct,
      days: needed.days,
      stamp: humanize(needed.s.name),
    };
  return [batch];
}

// ---------- spend/bribe-available ----------

const bribeRef = (i: number) => `bribes.acquisition.bribe-${i}`;

export function bribeCandidates(
  item: ResolvedSpendItem,
  ctx: CandidateContext,
  claimed: Set<string>,
): Candidate[] {
  const list = ctx.spend.bribes;
  if (!list || ctx.spend.highestClassLevel < SINKS_OPEN_AT_LEVEL) return [];
  // A sweep covers the sets up to the Stage's world (`next`), or that many sets further (`levels: N`).
  const t = item.spend.target;
  const maxSet = isSweep(item) ? Math.min(4, ctx.world + (t.kind === 'levels' ? (t.levels ?? 1) : 0)) : 4;
  const pick = isSweep(item) ? list : list.filter((b) => bribeRef(b.index) === item.ref);
  const out: Candidate[] = [];
  for (const b of pick) {
    const ref = bribeRef(b.index);
    const soldBy = valuesOf(ctx, ref).soldBy;
    // TR-4: only book bribes 0-25, available (raw status 0); index 26 is the Garbage Tuna's.
    if (b.status !== 0 || b.index > LAST_BOOK_BRIBE || (soldBy !== undefined && soldBy !== 'book')) continue;
    if (claimed.has(ref) || b.set > maxSet || !finite(b.price) || b.price <= 0) continue;
    const c = base(item, 'bribe', ref, humanize(b.name), {
      coins: b.price,
      steps: [{ sink: 'bribe', ref, fromLevel: 0, toLevel: 1, coins: b.price }],
    });
    c.fields = [
      `account.spend.bribes[${b.index}].status`,
      `account.spend.bribes[${b.index}].price`,
      'account.spend.wallets',
    ];
    out.push(c);
  }
  return out;
}

// ---------- spend/statue-gold-next ----------

export function statueGoldCandidates(item: ResolvedSpendItem, ctx: CandidateContext): Candidate[] {
  const list = ctx.spend.statueGold;
  if (!list || ctx.world < 2) return [];
  const tools = ctx.spend.guildingToolsOwned || list.some((s) => s.grade >= 1);
  if (!tools) {
    ctx.handoffs.push({ kind: 'guilding-tools', ref: 'statues.acquisition.statue-0', shortfall: 1 });
    ctx.notCovered.add('statues.guilding-tools');
    return [];
  }
  const next = list.find((s) => s.grade === 0);
  if (!next) return [];
  const ref = `statues.acquisition.statue-${next.index}`;
  const c = base(item, 'statue-gold', ref, humanize(next.name), {
    coins: 0,
    steps: [{ sink: 'statue-gold', ref, fromLevel: 0, toLevel: 1, coins: null }],
  });
  c.unpriced = true;
  c.fields = [`account.spend.statueGold[${next.index}].grade`, 'account.spend.guildingToolsOwned'];
  return [c];
}

// ---------- spend/p2w-candidates ----------

const P2W_UPGRADE: Record<string, string> = {
  speed: 'Speed',
  newBubble: 'New Bubble',
  boostReq: 'Boost Req',
  regen: 'Regen',
  capacity: 'Capacity',
  attempts: 'Attempts',
  rng: 'RNG',
  extraExp: 'Extra EXP',
};
// The game's spelling of a cauldron that the kebab key can't carry ("high-iq" is the High-IQ cauldron).
const SPELLED: Readonly<Record<string, string>> = { 'high-iq': 'High-IQ' };
const title = (s: string) =>
  SPELLED[s] ?? s.replace(/(^|-)(\w)/g, (_, d, c: string) => `${d ? ' ' : ''}${c.toUpperCase()}`);
/** "cauldron.high-iq.boostReq" -> "High-IQ cauldron Boost Req"; "liquid.water-drops.regen" -> "Water Drops Regen". */
function p2wName(key: string): string {
  const [group = '', thing = '', up = ''] = key.split('.');
  if (group === 'vials') return `Vial ${P2W_UPGRADE[thing] ?? thing}`;
  if (group === 'player') return `Player Alchemy ${P2W_UPGRADE[thing] ?? thing}`;
  const label = P2W_UPGRADE[up] ?? up;
  return group === 'cauldron' ? `${title(thing)} cauldron ${label}` : `${title(thing)} ${label}`;
}

/** The generated Acquisition id of a Pay 2 Win key: "cauldron.high-iq.boostReq" -> "alchemy-p2w.acquisition.cauldron-high-iq-boost-req". */
export const p2wRef = (key: string): string =>
  `alchemy-p2w.acquisition.${key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/\./g, '-')}`;

/** M19 X2 (FR-13): the tier of `alchemy-p2w.priority.order` an item's ref sits in; its Acquisitions, or null. */
function p2wStep(item: ResolvedSpendItem, ctx: CandidateContext): Set<string> | null {
  const tier = p2wOrder(ctx.entries).find((t) => t.includes(item.ref));
  return tier ? new Set(tier) : null;
}

/** M19 FR-13: the Player upgrades as one unpriced line, up to the best Alchemy level (wiki Pay 2 Win). */
function playerCandidate(item: ResolvedSpendItem, ctx: CandidateContext, claimed: Set<string>): Candidate[] {
  const best = ctx.state.account.alchemyPlan?.bestAlchemyLevel;
  const ups = (ctx.spend.p2w ?? []).filter(
    (u) => u.key.startsWith('player.') && !claimed.has(p2wRef(u.key)) && best !== undefined && u.level < best,
  );
  if (!ups.length || best === undefined) return [];
  const steps: SpendStep[] = ups.map((u) => ({
    sink: 'p2w',
    ref: p2wRef(u.key),
    fromLevel: u.level,
    toLevel: best,
    coins: null,
  }));
  const c = base(item, 'p2w', steps.map((s) => s.ref).join(','), 'Player Alchemy Speed and Extra EXP', {
    coins: 0,
    steps,
  });
  c.unpriced = true;
  c.fields = ['account.spend.p2w', 'account.alchemyPlan.bestAlchemyLevel'];
  const from = Math.min(...ups.map((u) => u.level));
  c.slots = { from, to: best, levels: best - from };
  return [c];
}

export function p2wCandidates(
  item: ResolvedSpendItem,
  ctx: CandidateContext,
  claimed: Set<string>,
): Candidate[] {
  const list = ctx.spend.p2w;
  if (!list || ctx.world < 2) return [];
  const step = p2wStep(item, ctx);
  if (step?.has(p2wRef('player.speed'))) return playerCandidate(item, ctx, claimed);
  const out: Candidate[] = [];
  for (const u of list) {
    const ref = p2wRef(u.key);
    if (claimed.has(ref)) continue;
    if (u.key.startsWith('player.')) continue;
    if (step ? !step.has(ref) : !isSweep(item) && ref !== item.ref) continue;
    const vials = u.key.startsWith('vials.');
    if (!step && isSweep(item) && vials) continue; // vials are listed by name, as unpriced (FR-14)
    // AC-8.2: a locked liquid (level -1) is dropped, whatever Toolbox prices it at.
    if (u.level < 0) continue;
    // A vial upgrade's max comes from its generated Acquisition (Toolbox CAULDRONS_MAX_LEVELS).
    const max = Number(valuesOf(ctx, ref).maxLevel);
    if (vials && !(u.level < max)) continue;
    const name = p2wName(u.key);
    if (vials) {
      const c = base(item, 'p2w', ref, name, {
        coins: 0,
        steps: [{ sink: 'p2w', ref, fromLevel: u.level, toLevel: u.level + 1, coins: null }],
      });
      c.unpriced = true;
      c.fields = [`account.spend.p2w[${u.key}].level`];
      c.slots = { from: u.level, to: u.level + 1, levels: 1 };
      out.push(c);
      continue;
    }
    // Maxed: Toolbox's cost to max is 0 there.
    if (!finite(u.nextCost) || u.nextCost <= 0 || !finite(u.costToMax) || u.costToMax <= 0) continue;
    const c = base(item, 'p2w', ref, name, {
      coins: u.nextCost,
      steps: [{ sink: 'p2w', ref, fromLevel: u.level, toLevel: u.level + 1, coins: u.nextCost }],
    });
    c.fields = [`account.spend.p2w[${u.key}].nextCost`, 'account.spend.wallets'];
    c.slots = { from: u.level, to: u.level + 1, levels: 1 };
    out.push(c);
  }
  return out;
}

// ---------- spend/anvil-coin-points ----------

/** One account-level candidate with one step per character (#70 A5: never the same small line on every row). */
export function anvilCandidates(item: ResolvedSpendItem, ctx: CandidateContext): Candidate[] {
  const list = ctx.spend.anvilCoinPoints;
  if (!list) return [];
  const steps: SpendStep[] = list
    .filter((a) => a.coinsToMax > 0 && finite(a.nextCost) && a.nextCost > 0)
    .map((a) => ({
      sink: 'anvil',
      ref: item.ref,
      fromLevel: a.points,
      toLevel: a.points + 1,
      coins: a.nextCost,
      payer: a.characterIndex,
    }));
  if (!steps.length) return [];
  const c = base(item, 'anvil', `${item.ref}|anvil`, 'Anvil coin point', {
    coins: steps.reduce((t, s) => t + (s.coins ?? 0), 0),
    steps,
  });
  c.perStepPayer = true;
  c.fields = ['account.spend.anvilCoinPoints'];
  return [c];
}

/** Every candidate a resolved item stands for, earlier claims excluded. */
export function candidatesOf(
  item: ResolvedSpendItem,
  ctx: CandidateContext,
  claimed: Set<string>,
): Candidate[] {
  switch (item.spend.sink) {
    case 'vault':
      return item.spend.target.kind === 'cheapest-until-unlock'
        ? []
        : vaultCandidates(item, ctx).filter((c) => !claimed.has(c.claim));
    case 'stamp':
      return stampCandidates(item, ctx, claimed);
    case 'bribe':
      return bribeCandidates(item, ctx, claimed);
    case 'statue-gold':
      return statueGoldCandidates(item, ctx).filter((c) => !claimed.has(c.claim));
    case 'p2w':
      return p2wCandidates(item, ctx, claimed);
    case 'anvil':
      return anvilCandidates(item, ctx).filter((c) => !claimed.has(c.claim));
  }
}

export { dataOf, stampRef, vaultRef };
