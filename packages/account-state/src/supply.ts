// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 TR-3: kill and drop rates on the supply maps, and every character's reachable maps (built here
// first, to M5 TR-4's rule, for M5 to reuse). Runs in the parse worker after the adapter, with Toolbox's
// functions injected (ADR 0006): this file computes no rate itself, it only picks which maps to ask
// Toolbox about. The set depends only on the save and the Knowledge Base, never on device speed.
import type { ParsedSave, RawSaveEnvelope, ToolboxCalls } from '@idleon-forge/toolbox-parsers';
import { killsLeftTable } from './frontier';
import type { AccountState } from './types';
import type { SupplyRate, SupplyRates } from './walkthrough-types';

type Dict = Record<string, unknown>;
const isDict = (v: unknown): v is Dict => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** TR-3: drop maps computed per missing leaf, by effectiveChance (TR-8 budget). */
export const SUPPLY_MAPS_PER_LEAF = 3;

/** One row of `maps.fact.maps` (M5 TR-4's portal graph and exclusion list). */
export interface MapGraphRow {
  index: number;
  world: number;
  listed: boolean;
  afkType: string | null;
  doors: { requirement: number; destination: number | null }[];
}

/** A missing leaf with its drop maps (from its generated item Acquisition). */
export interface SupplyLeaf {
  rawName: string;
  maps: { mapIndex: number; chance: number }[];
}

/**
 * M5 TR-4 `reachableFightingMaps` (and, with the same rule, skilling maps): the current map; every map
 * where the character has killed (raw `KillsLeft2Advance` below the door's requirement, or negative on
 * a door with no requirement); and the destination of each door of such a map whose own requirement is
 * met. Never a map Toolbox's getFilteredPortals leaves out (bosses, colosseums, quest rooms), and only
 * worlds up to `currentWorld`. Fails closed: a gap in the door data costs a map, never adds one.
 */
export function reachableMaps(
  table: unknown[] | null,
  currentMap: number | null,
  graph: ReadonlyMap<number, MapGraphRow>,
  currentWorld: number,
): number[] {
  const out = new Set<number>();
  const ok = (m: number | null | undefined): m is number => {
    if (m === null || m === undefined) return false;
    const row = graph.get(m);
    return !!row && row.listed && row.world <= currentWorld;
  };
  if (ok(currentMap)) out.add(currentMap);
  if (table)
    for (const [m, row] of graph) {
      const kla = table[m];
      if (!Array.isArray(kla)) continue;
      let killed = false;
      row.doors.forEach((d, i) => {
        const v = finite(kla[i]);
        if (v === null) return;
        if ((d.requirement > 0 && v < d.requirement) || (d.requirement === 0 && v < 0)) killed = true;
      });
      if (!killed) continue;
      if (ok(m)) out.add(m);
      row.doors.forEach((d, i) => {
        const v = finite(kla[i]);
        if (v !== null && v <= 0 && d.requirement > 0 && ok(d.destination)) out.add(d.destination as number);
      });
    }
  return [...out].sort((a, b) => a - b);
}

export interface SupplyInput {
  leaves: readonly SupplyLeaf[];
  graph: readonly MapGraphRow[];
  calls: ToolboxCalls;
  withFrozenClock: <T>(now: number, f: () => T) => T;
}

/** The supply rates of TR-3, or `unavailable` when Toolbox threw. */
export function computeSupplyRates(
  parsed: ParsedSave,
  envelope: RawSaveEnvelope,
  state: AccountState,
  input: SupplyInput,
): SupplyRates {
  const data: Dict = isDict(envelope.data) ? envelope.data : {};
  const graph = new Map(input.graph.map((r) => [r.index, r]));
  const world = state.account.currentWorld ?? 1;
  const reachable: Record<number, number[]> = {};
  for (const c of state.characters)
    reachable[c.index] = reachableMaps(killsLeftTable(data, c.index), c.mapIndex ?? null, graph, world);
  const anyReach = new Set(Object.values(reachable).flat());

  const maps = new Set<number>();
  const skipped: Record<string, number> = {};
  for (const leaf of input.leaves) {
    const best = new Map<number, number>();
    for (const m of leaf.maps)
      if (graph.get(m.mapIndex)?.afkType === 'FIGHTING' && anyReach.has(m.mapIndex))
        best.set(m.mapIndex, Math.max(best.get(m.mapIndex) ?? 0, m.chance));
    const ranked = [...best].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([m]) => m);
    for (const m of ranked.slice(0, SUPPLY_MAPS_PER_LEAF)) maps.add(m);
    if (ranked.length > SUPPLY_MAPS_PER_LEAF) skipped[leaf.rawName] = ranked.length - SUPPLY_MAPS_PER_LEAF;
  }
  // Every character's current fighting map, for "already farming" (FR-9).
  for (const c of state.characters)
    if (c.afkType === 'FIGHTING' && c.mapIndex !== null && c.mapIndex !== undefined) maps.add(c.mapIndex);

  // biome-ignore lint/suspicious/noExplicitAny: Toolbox's own character and account types are untyped.
  const characters = parsed.characters as any[];
  const account = parsed.account;
  try {
    const out = [...maps]
      .sort((a, b) => a - b)
      .map((mapIndex) => {
        const kills = input.calls.frontierRates(parsed, mapIndex);
        const rates: SupplyRate[] = input.withFrozenClock(parsed.meta.now, () =>
          kills.map((k) => {
            const c = characters[k.characterIndex];
            const d = finite(
              (input.calls.getDropRate(input.calls.onMap(c, mapIndex), account, characters) as Dict | undefined)
                ?.dropRate,
            );
            return {
              characterIndex: k.characterIndex,
              finalKillsPerHour: k.finalKillsPerHour,
              survivability: k.survivability,
              hitChance: k.hitChance,
              dropRate: d ?? 0,
            };
          }),
        );
        return { mapIndex, rates };
      });
    return {
      status: Object.keys(skipped).length ? 'partial' : 'ok',
      maps: out,
      reachable,
      skipped,
    };
  } catch {
    return { status: 'unavailable', maps: [], reachable, skipped };
  }
}

/** The state with the worker's supply rates attached (TR-3); the adapter leaves the field null. */
export const withSupplyRates = (state: AccountState, supplyRates: SupplyRates | null): AccountState => ({
  ...state,
  account: { ...state.account, supplyRates },
});
