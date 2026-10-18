// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// `bestExpPerHour` (M4 TR-6) until M5's reachability sweep ships. TODO(M5): replace with M5's sweep.
// The stand-in uses only kill rates the worker already computed with Toolbox's own clone (ADR 0005):
// the current map, M2's frontier map (every character's rate there, M2 TR-2) and M14's supply maps the
// character can reach (M14 TR-3), each times the map monster's EXP (maps.fact.maps `expGiven`) and the
// character's class EXP multi. It is a lower bound of the best map, so the D3 test can only err toward
// "worthwhile" here, never toward a false "What is this character for?". With no rated map besides the
// current one there is no comparison: null, and the Class EXP Goal is skipped (never guessed).
import type { AccountState } from '@idleon-forge/account-state';
import type { FactLookup } from '../metapath/types';

interface MapRow {
  index: number;
  afkType: string | null;
  expGiven: number | null;
}

export function bestExpPerHour(state: AccountState, kb: FactLookup): (number | null)[] {
  const rows = (kb.get('maps.fact.maps') as { rows?: MapRow[] } | undefined)?.rows ?? [];
  const exp = new Map(rows.filter((r) => r.afkType === 'FIGHTING').map((r) => [r.index, r.expGiven ?? 0]));
  const out: (number | null)[] = [];
  for (const c of state.characters) {
    const f = c.fighting;
    if (c.afkType !== 'FIGHTING' || !f || f.expPerKill === null || f.classExpMulti === null) {
      out[c.index] = null;
      continue;
    }
    const multi = f.classExpMulti;
    const here = f.finalKillsPerHour * f.expPerKill;
    const others: number[] = [];
    const fr = state.account.frontier ?? null;
    const atFrontier = fr?.fights.find((x) => x.characterIndex === c.index);
    const reaches = fr?.routeCleared.find((x) => x.characterIndex === c.index)?.reachesFrontier ?? false;
    if (fr && atFrontier && reaches && fr.mapIndex !== c.mapIndex)
      others.push(atFrontier.finalKillsPerHour * (exp.get(fr.mapIndex) ?? 0) * multi);
    const sr = state.account.supplyRates ?? null;
    const reach = sr?.reachable?.[c.index] ?? null;
    for (const m of sr?.maps ?? []) {
      if (m.mapIndex === c.mapIndex || !exp.has(m.mapIndex)) continue;
      if (reach && !reach.includes(m.mapIndex)) continue;
      const r = m.rates.find((x) => x.characterIndex === c.index);
      if (r) others.push(r.finalKillsPerHour * (exp.get(m.mapIndex) ?? 0) * multi);
    }
    out[c.index] = others.length === 0 ? null : Math.max(here, ...others);
  }
  return out;
}
