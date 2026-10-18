// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M14 FR-25 to FR-30: the 3D Printer Parallel Slot Plan. For each Demand item, in Walkthrough order:
// already printing -> nothing; stored on a printing character -> swap to it (resets nothing); else take
// a new sample on the eligible character with the largest samplePct × finalKillsPerHour × dropRate on
// a map where that item is the sample (FR-26, the generated `printable` drop row), priced against the
// account-wide printer bonus reset (FR-27a: Toolbox getPrinterMulti before and after). At most one change
// per character; never away from an uncovered Demand item; never a re-sample for its own sake. Only
// characters in save slots below the building level print (M3 FR-23's rule).
import type { AccountState } from '@idleon-forge/account-state';
import type { MetaPathResult } from '../metapath/types';
import { ENTRY, itemOf, type MapRow, numberValue, type WalkthroughKnowledge } from './knowledge';
import type { PrinterChange, PrinterPlanRow, PrinterSlotPlan } from './types';

export interface PrinterInput {
  state: AccountState;
  kb: WalkthroughKnowledge;
  meta: MetaPathResult | null;
  demand: { rawName: string; missing: number }[];
  /** Items some Walkthrough already holds enough of. */
  covered: ReadonlySet<string>;
  bottlenecks: ReadonlySet<string>;
  graph: ReadonlyMap<number, MapRow>;
}

export function planPrinter(input: PrinterInput): PrinterSlotPlan | null {
  const { state, kb, demand, graph } = input;
  const p = state.account.printer;
  if (!p || p.level <= 0) return null; // US-4: no printer, no plan.
  const order = [...state.characters.map((c) => c.index)].sort((a, b) => a - b);
  const printing = new Set(order.slice(0, p.level));
  const pusher = input.meta?.pusher?.index ?? null;
  const want = demand.filter((d) => d.missing > 0);
  const wanted = new Set(want.map((d) => d.rawName));
  const maxLoss = numberValue(kb, ENTRY.printer, 'maxResetLoss', 0.1);
  const loss = p.multiNow > 0 ? Math.max(0, 1 - p.multiAfterSample / p.multiNow) : 0;
  const changed = new Set<number>();
  const changes: PrinterChange[] = [];
  const rates = state.account.supplyRates;
  const activeItems = (i: number) =>
    p.characters.find((c) => c.characterIndex === i)?.active.map((s) => s.rawName) ?? [];
  const freeToChange = (i: number) =>
    printing.has(i) && !changed.has(i) && !activeItems(i).some((x) => wanted.has(x) && !input.covered.has(x));

  for (const d of want) {
    if (
      p.characters.some(
        (c) => printing.has(c.characterIndex) && c.active.some((s) => s.rawName === d.rawName),
      )
    )
      continue;
    // Swap to a stored sample (FR-27).
    const stored = p.characters.find(
      (c) => freeToChange(c.characterIndex) && c.stored.some((s) => s.rawName === d.rawName),
    );
    if (stored) {
      changed.add(stored.characterIndex);
      changes.push({
        characterIndex: stored.characterIndex,
        action: 'swap-to-stored',
        item: d.rawName,
        replaces: stored.active[0]?.rawName ?? null,
        mapIndex: null,
        perHour: stored.stored.find((s) => s.rawName === d.rawName)?.perHour ?? null,
        missing: d.missing,
        resetLoss: 0,
      });
      continue;
    }
    // Take a new sample (FR-27, FR-27a).
    if (loss > maxLoss && !input.bottlenecks.has(d.rawName)) continue;
    const item = itemOf(kb, d.rawName);
    const maps = (item?.drops ?? [])
      .filter((r) => r.printable && !r.table)
      .flatMap((r) => r.maps.filter((m) => graph.get(m)?.listed && graph.get(m)?.afkType === 'FIGHTING'));
    let best: { i: number; map: number; score: number } | null = null;
    for (const c of p.characters) {
      const i = c.characterIndex;
      if (!freeToChange(i) || i === pusher || c.samplingLevel < 1) continue;
      const hasSlot = c.stored.length < p.storedSlots || c.stored.some((s) => !wanted.has(s.rawName));
      if (!hasSlot) continue;
      for (const m of maps) {
        const ch = state.characters.find((x) => x.index === i);
        const reach = ch?.mapIndex === m || (rates?.reachable[i]?.includes(m) ?? false);
        const r = rates?.maps.find((x) => x.mapIndex === m)?.rates.find((x) => x.characterIndex === i);
        if (!reach || !r) continue;
        const score = c.samplePct * r.finalKillsPerHour * r.dropRate;
        if (!best || score > best.score || (score === best.score && i < best.i)) best = { i, map: m, score };
      }
    }
    if (best) {
      changed.add(best.i);
      const c = p.characters.find((x) => x.characterIndex === best.i);
      changes.push({
        characterIndex: best.i,
        action: 'take-sample',
        item: d.rawName,
        replaces: c?.active[0]?.rawName ?? null,
        mapIndex: best.map,
        perHour: null,
        missing: d.missing,
        resetLoss: loss,
      });
    }
  }

  const rows: PrinterPlanRow[] = p.characters.map((c) => {
    const ch = changes.find((x) => x.characterIndex === c.characterIndex);
    if (ch)
      return {
        characterIndex: c.characterIndex,
        action: ch.action,
        item: ch.item,
        replaces: ch.replaces,
        mapIndex: ch.mapIndex,
        covered: false,
      };
    const item = c.active[0]?.rawName ?? null;
    return {
      characterIndex: c.characterIndex,
      action: printing.has(c.characterIndex) ? 'keep' : 'none',
      item,
      replaces: null,
      mapIndex: null,
      covered: item !== null && input.covered.has(item) && !wanted.has(item),
    };
  });
  return {
    slotsUsed: p.characters.filter((c) => printing.has(c.characterIndex) && c.active.length > 0).length,
    slotsTotal: p.level,
    characters: rows,
    multiNow: p.multiNow,
    multiAfterSample: p.multiAfterSample,
    changes,
  };
}
