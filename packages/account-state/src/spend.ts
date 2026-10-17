// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M7 Spend Plan (M7 TR-2): reads Toolbox's coin, Vault, stamp, bribe, statue, Pay 2 Win, anvil and atom
// fields into `SpendInputs`. This file and adapter.ts are the only code that knows those Toolbox names.
// The Vault ladders and the stamp re-evaluation come from the worker's Toolbox calls (TR-4): without them
// (no `toolbox` option) the projection is null and the Spend Plan isn't built, never built from the
// parse's own gilded stamp prices.
import type { ParsedSave, StampEvaluation, ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type {
  AnvilCoinPoint,
  BribeState,
  P2wUpgrade,
  RaisePrice,
  SpendInputs,
  StampState,
  StatueGoldState,
  VaultRow,
  VaultState,
  Wallet,
} from './spend-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const arr = (v: unknown): unknown[] | null => {
  if (Array.isArray(v)) return v;
  if (typeof v !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** M7 scope: Vault rows 0-61 (W1-W4), book bribes 0-25 (sets 1-4). */
export const SPEND_VAULT_ROWS = 62;
const GUILDING_TOOLS = 'SmithingHammerChisel2';
const OLA_GILDED_STAMPS = 154;

export interface SpendReadInput {
  parsed: ParsedSave;
  data: Dict;
  /** Readable character indices. */
  indices: number[];
  levels: number[];
  failedSections: string[];
  toolbox?: { calls: ToolboxCalls; withFrozenClock: <T>(now: number, f: () => T) => T };
  asOf: number;
}

const failed = (input: SpendReadInput, ...sections: string[]) =>
  sections.some((s) => input.failedSections.includes(s));

function wallets(input: SpendReadInput): Wallet[] {
  const { parsed, data } = input;
  const out: Wallet[] = [];
  for (const i of input.indices) {
    const c = parsed.characters[i] as Dict | undefined;
    out.push({ holder: i, coins: Math.max(0, finite(c?.money) ?? 0) });
  }
  out.push({ holder: 'bank', coins: Math.max(0, finite(data.MoneyBANK) ?? 0) });
  return out;
}

function vault(input: SpendReadInput): VaultState | null {
  const { parsed, data, toolbox } = input;
  const levels = arr(data.UpgVault);
  const uv = (parsed.account as Dict).upgradeVault;
  if (!toolbox || !levels || failed(input, 'upgradeVault') || !isDict(uv) || !Array.isArray(uv.upgrades))
    return null;
  const nums = levels.map((x) => finite(x) ?? 0);
  const runs = toolbox.withFrozenClock(input.asOf, () => toolbox.calls.vaultLadders(parsed, nums));
  const ups = uv.upgrades as Dict[];
  const total = finite(uv.totalUpgradeLevels) ?? nums.reduce((s, x) => s + x, 0);
  const rows: VaultRow[] = [];
  const unlockAt = runs.map((r, k) => ({ index: r.index, at: finite(ups[k]?.unlockLevel) ?? 0 }));
  const open = unlockAt.filter((u) => u.at <= total).length;
  runs.forEach((run, k) => {
    if (run.index >= SPEND_VAULT_ROWS) return;
    const u = ups[k] ?? {};
    const level = finite(u.level) ?? 0;
    const maxLevel = finite(u.maxLevel) ?? 0;
    const buyable = run.index < open;
    const ladder: VaultRow['ladder'] = [];
    if (buyable && level < maxLevel) {
      let sum = 0;
      for (let j = 0; j < Math.min(run.costs.length, maxLevel - level); j++) {
        const c = run.costs[j];
        if (c === undefined || !Number.isFinite(c)) break;
        sum += c;
        ladder.push({ k: j + 1, coins: sum });
      }
    }
    rows.push({
      index: run.index,
      level,
      maxLevel,
      buyable,
      nextCost: finite(u.cost) ?? 0,
      costToMax: finite(u.costToMax) ?? 0,
      ladder,
    });
  });
  const next = unlockAt.find((u) => u.at > total) ?? null;
  return { totalLevels: total, nextUnlock: next, rows };
}

function stamps(input: SpendReadInput): StampState[] | null {
  const { parsed, toolbox } = input;
  if (!toolbox || failed(input, 'stamps', 'storage')) return null;
  const account = parsed.account as Dict;
  const gilded = (finite((account.accountOptions as unknown[] | undefined)?.[OLA_GILDED_STAMPS]) ?? 0) > 0;
  const atoms = isDict(account.atoms) ? account.atoms : {};
  const reducer = finite(atoms.stampReducer) ?? 0;
  const run = (g: boolean, r?: number) =>
    toolbox.withFrozenClock(input.asOf, () => toolbox.calls.stampEvaluations(parsed, g, r));
  const current = run(false);
  const zero = reducer > 0 ? run(false, 0) : current;
  const gild = gilded ? run(true) : null;
  const byName = (list: StampEvaluation[] | null) => new Map((list ?? []).map((s) => [s.rawName, s]));
  const zeroBy = byName(zero);
  const gildBy = byName(gild);
  // Carriers come back by character name; join them to indices here, so names never leave the adapter.
  const nameToIndex = new Map<string, number>();
  for (const i of input.indices) {
    const name = (parsed.characters[i] as Dict | undefined)?.name;
    if (typeof name === 'string' && !nameToIndex.has(name)) nameToIndex.set(name, i);
  }
  const held = heldCounts(input);
  const price = (s: StampEvaluation | undefined): RaisePrice | null =>
    s ? { cost: s.materialCost, hasMaterials: s.hasMaterials, carryOk: s.enoughPlayerStorage } : null;
  return current
    .filter((s) => s.maxLevel > 0 || s.level > 0)
    .map((s): StampState => {
      const atCap = s.level >= s.maxLevel;
      return {
        id: s.rawName,
        level: s.level,
        cap: s.maxLevel,
        capStep: s.capStep,
        nextCoinCost: atCap ? null : s.goldCost,
        coinsToCap: atCap ? 0 : s.coinsToCap,
        raise: atCap
          ? {
              material: s.material,
              materialType: s.equip ? 'Equip' : 'Material',
              atDiscount: price(s) as RaisePrice,
              atZero: price(zeroBy.get(s.rawName)) ?? (price(s) as RaisePrice),
              gilded: price(gildBy.get(s.rawName)),
              ownedInStorage: s.ownedMats,
              ownedAnywhere: held.get(s.material) ?? 0,
              carriers: s.topCharacters.flatMap((t) => {
                const characterIndex = nameToIndex.get(t.character);
                return characterIndex === undefined ? [] : [{ characterIndex, capacity: t.maxCapacity }];
              }),
              minReduction: s.minReduction,
              coinsAfterRaise: s.next?.goldCost ?? Number.NaN,
              afterRaise: { level: s.next?.level ?? -1, reduction: s.next?.reduction ?? -1 },
            }
          : null,
      };
    });
}

/** Counts by item rawName in storage plus every readable character's inventory. */
function heldCounts(input: SpendReadInput): Map<string, number> {
  const out = new Map<string, number>();
  const add = (list: unknown) => {
    if (!Array.isArray(list)) return;
    for (const it of list) {
      if (!isDict(it) || typeof it.rawName !== 'string') continue;
      out.set(it.rawName, (out.get(it.rawName) ?? 0) + (finite(it.amount) ?? 0));
    }
  };
  const storage = (input.parsed.account as Dict).storage;
  if (isDict(storage)) add(storage.list);
  for (const i of input.indices) add((input.parsed.characters[i] as Dict | undefined)?.inventory);
  return out;
}

function bribes(input: SpendReadInput): BribeState[] | null {
  const status = arr(input.data.BribeStatus);
  const list = (input.parsed.account as Dict).bribes;
  if (!status || failed(input, 'bribes') || !Array.isArray(list)) return null;
  return list.map((b, index) => {
    const s = finite(status[index]);
    return {
      index,
      status: s === 1 ? 1 : s === 0 ? 0 : -1,
      price: finite((b as Dict | undefined)?.price) ?? 0,
    };
  });
}

function statueGold(input: SpendReadInput): StatueGoldState[] | null {
  const raw = arr(input.data.StuG);
  const statues = (input.parsed.account as Dict).statues;
  if (!raw || failed(input, 'statues') || !Array.isArray(statues)) return null;
  return statues.map((_, index) => ({ index, grade: finite(raw[index]) ?? 0 }));
}

const slug = (name: unknown) =>
  String(name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function p2w(input: SpendReadInput): P2wUpgrade[] | null {
  const alchemy = (input.parsed.account as Dict).alchemy;
  const p = isDict(alchemy) ? alchemy.p2w : null;
  if (!isDict(p) || failed(input, 'alchemy') || !Array.isArray(p.cauldrons) || !Array.isArray(p.liquids))
    return null;
  const out: P2wUpgrade[] = [];
  const priced = (key: string, u: unknown) => {
    if (!isDict(u)) return;
    const level = finite(u.level);
    if (level === null) return;
    out.push({ key, level, nextCost: finite(u.cost), costToMax: finite(u.costToMax) });
  };
  for (const c of p.cauldrons as Dict[])
    for (const up of ['speed', 'newBubble', 'boostReq']) priced(`cauldron.${slug(c.name)}.${up}`, c[up]);
  for (const l of p.liquids as Dict[])
    for (const up of ['regen', 'capacity']) priced(`liquid.${slug(l.name)}.${up}`, l[up]);
  if (isDict(p.vials))
    for (const up of ['attempts', 'rng']) {
      const level = finite(p.vials[up]);
      if (level !== null) out.push({ key: `vials.${up}`, level, nextCost: null, costToMax: null });
    }
  return out;
}

function anvil(input: SpendReadInput): AnvilCoinPoint[] | null {
  const { parsed, toolbox } = input;
  if (!toolbox || failed(input, 'stamps', 'alchemy')) return null;
  const out: AnvilCoinPoint[] = [];
  for (const i of input.indices) {
    const c = parsed.characters[i];
    try {
      const a = toolbox.withFrozenClock(input.asOf, () =>
        toolbox.calls.getPlayerAnvil(c, parsed.characters, parsed.account),
      ) as Dict;
      const stats = isDict(a?.stats) ? a.stats : {};
      const cost = isDict(stats.anvilCost) ? stats.anvilCost : {};
      const nextCost = finite(cost.nextCoinUpgrade);
      const coinsToMax = finite(cost.coinsToMax);
      if (nextCost === null || coinsToMax === null) continue;
      out.push({ characterIndex: i, points: finite(stats.pointsFromCoins) ?? 0, nextCost, coinsToMax });
    } catch {
      // One character's anvil failing drops only that character's coin point line.
    }
  }
  return out;
}

function hydrogen(input: SpendReadInput): SpendInputs['hydrogen'] {
  const atoms = (input.parsed.account as Dict).atoms;
  if (!isDict(atoms) || failed(input, 'atoms') || !Array.isArray(atoms.atoms)) return null;
  const h = atoms.atoms[0] as Dict | undefined;
  const level = finite(h?.level) ?? 0;
  const base = finite(h?.baseBonus) ?? 0;
  return { level, dailyRate: base * level, discountPct: finite(atoms.stampReducer) ?? 0 };
}

function tickets(input: SpendReadInput): SpendInputs['colosseumTickets'] {
  const cur = (input.parsed.account as Dict).currencies;
  const t = isDict(cur) ? cur.ColosseumTickets : null;
  if (!isDict(t) || failed(input, 'currencies', 'currencies.ColosseumTickets')) return null;
  const banked = Array.isArray(t.allTickets)
    ? (t.allTickets as Dict[]).reduce((s, x) => s + (finite(x?.totalAmount) ?? 0), 0)
    : 0;
  return {
    balance: finite(input.data.CYColosseumTickets) ?? finite(t.totalAmount) ?? 0,
    bankedAtNpcs: banked,
  };
}

/** M7 TR-2. null without the worker's Toolbox functions (the stamp prices would be the gilded ones). */
export function readSpendInputs(input: SpendReadInput): SpendInputs | null {
  if (!input.toolbox) return null;
  const statues = statueGold(input);
  const held = heldCounts(input);
  return {
    wallets: wallets(input),
    vault: vault(input),
    stamps: stamps(input),
    bribes: bribes(input),
    statueGold: statues,
    guildingToolsOwned: (held.get(GUILDING_TOOLS) ?? 0) > 0,
    p2w: p2w(input),
    anvilCoinPoints: anvil(input),
    hydrogen: hydrogen(input),
    gildedStamps:
      finite(((input.parsed.account as Dict).accountOptions as unknown[] | undefined)?.[OLA_GILDED_STAMPS]) ??
      0,
    colosseumTickets: tickets(input),
    highestClassLevel: input.levels.reduce((m, l) => Math.max(m, l), 0),
  };
}
