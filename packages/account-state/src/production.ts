// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C (Wave C, FR-C7, V33, V-C1): one character's anvil as the Production Plan reads it: the
// hammers in save order, the stock of every product, the capacity and the speed terms. Called from
// adapter.ts; like it, the only place that knows these Toolbox paths.
import type { ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import type { AnvilProduction, AnvilSpeedParts } from './production-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const attempt = <T>(f: () => T | null): T | null => {
  try {
    return f();
  } catch {
    return null;
  }
};

/** The anvil products the game has (shared-data `anvilProducts` 0-10; 11-13 are unreachable, levelReq 999). */
export const ANVIL_PRODUCTS = 11;

interface Collector {
  checkRaw(template: string, path: string, i: number | null, slots?: number[]): boolean;
  unknown(path: string): void;
}

export interface ProductionInputs {
  account: Dict;
  characters: unknown[];
  data: Dict;
  states: Array<{ index: number; anvil?: AnvilProduction | null }>;
  calls: ToolboxCalls | null;
  withFrozenClock: (<T>(now: number, f: () => T) => T) | null;
  asOf: number;
}

/**
 * Raw `AnvilPAselect_i`: a list (or its JSON string) of product indices, -1 for a free hammer, or a bare
 * number on a single-hammer save (V33). null when missing or malformed.
 */
export function hammersOf(raw: unknown): number[] | null {
  let v: unknown = raw;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return null;
    try {
      v = JSON.parse(t);
    } catch {
      return null;
    }
  }
  if (typeof v === 'number') return Number.isInteger(v) && v >= -1 ? [v] : null;
  if (!Array.isArray(v) || v.length === 0) return null;
  const out: number[] = [];
  for (const x of v) {
    const n = finite(x);
    if (n === null || !Number.isInteger(n) || n < -1 || n >= ANVIL_PRODUCTS) return null;
    out.push(n);
  }
  return out;
}

/** Toolbox `anvilProduction` rows `[currentAmount, currentXP, currentProgress, totalProduced]` -> stock 0-10. */
export function stockOf(production: unknown): number[] | null {
  if (!Array.isArray(production) || production.length < ANVIL_PRODUCTS) return null;
  const out: number[] = [];
  for (let p = 0; p < ANVIL_PRODUCTS; p++) {
    const row = production[p] as Record<string | number, unknown> | undefined;
    const n = finite(row?.[0]);
    if (n === null || n < 0) return null;
    out.push(Math.floor(n));
  }
  return out;
}

function speedPartsOf(c: Dict, account: Dict, calls: ToolboxCalls): AnvilSpeedParts | null {
  const t = calls.anvilSpeedTerms(c, account);
  if (!t) return null;
  const parts: AnvilSpeedParts = {
    stamp: t.stamp,
    speedPoints: t.speedPoints,
    box: t.box,
    statue: t.statue,
    vault: t.vault,
    hammerHammer: t.hammerHammer,
    agility: t.agility,
    starSign: t.starSign,
    brokenTime: t.brokenTime,
  };
  return Object.values(parts).every((x) => Number.isFinite(x)) ? parts : null;
}

/** M26 F-C: `characters[].anvil`, written onto the states in place. */
export function readProduction(input: ProductionInputs, c: Collector): void {
  const { account, characters, data, states, calls, withFrozenClock, asOf } = input;
  const frozen = <T>(f: () => T): T => (withFrozenClock ? withFrozenClock(asOf, f) : f());
  for (const st of states) {
    const at = `characters[${st.index}].anvil`;
    st.anvil = null;
    const raw = characters[st.index];
    if (!isDict(raw) || !c.checkRaw('characters[].anvil', at, st.index)) continue;
    const hammers = hammersOf(data[`AnvilPAselect_${st.index}`]);
    const anvil = isDict(raw.anvil) ? raw.anvil : null;
    const stock = stockOf(anvil?.anvilProduction);
    if (hammers === null || stock === null) {
      c.unknown(at);
      continue;
    }
    const capacity = calls
      ? attempt(() =>
          frozen(() => {
            const a = calls.getPlayerAnvil(raw, characters, account) as Dict;
            const v = finite(isDict(a?.stats) ? a.stats.anvilCapacity : null);
            return v !== null && v > 0 ? v : null;
          }),
        )
      : null;
    const speedParts = calls ? attempt(() => frozen(() => speedPartsOf(raw, account, calls))) : null;
    const speedStampNext =
      calls && speedParts
        ? attempt(() =>
            frozen(() => {
              const v = calls.anvilSpeedOf({ ...speedParts, stamp: speedParts.stamp + 1 });
              return Number.isFinite(v) && v > 0 ? v : null;
            }),
          )
        : null;
    st.anvil = {
      hammers,
      stock,
      capacity,
      speedParts,
      speedStampNext,
      hammerHammerByCompanion: calls
        ? (attempt(() => calls.hammerHammerByCompanion(account)) ?? false)
        : false,
      expBonus: calls ? attempt(() => frozen(() => calls.anvilExpBonus(raw, characters, account))) : null,
    };
    if (calls && (capacity === null || speedParts === null)) c.unknown(at);
  }
}
