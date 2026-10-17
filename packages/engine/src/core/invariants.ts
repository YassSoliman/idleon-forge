// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M10 TR-9: invariants of an `EngineResult`. They throw in tests and log once in dev builds;
// production renders anyway.
import type { EngineResult, Goal } from '../result';

/** Every broken invariant, as one line each; empty when the result is sound. */
export function invariantViolations(r: EngineResult): string[] {
  const out: string[] = [];
  const goalChecks = (where: string, goals: Goal[]) => {
    for (const g of goals) {
      if (!g.nextAction) out.push(`${where}: Goal ${g.id} has no Next Action`);
      else if (g.nextAction.sources.length === 0)
        out.push(`${where}: Next Action ${g.nextAction.key} has no Source`);
      if (g.category === 'blocker' && g.nextAction?.contested)
        out.push(`${where}: Contested ${g.nextAction.key} is a blocker`);
    }
    const first = goals.find((g) => g.category !== 'blocker');
    if (first?.nextAction?.contested)
      out.push(`${where}: Contested ${first.nextAction.key} is the first Goal`);
  };
  for (const c of r.characters) {
    const where = `c${c.index}`;
    goalChecks(where, c.goals);
    const fix = c.verdict.kind === 'fix';
    if (fix !== c.verdict.blockerKeys.length > 0)
      out.push(`${where}: Verdict ${c.verdict.kind} with ${c.verdict.blockerKeys.length} blockers`);
    for (const k of c.verdict.blockerKeys)
      if (r.account.blockerKeys.includes(k))
        out.push(`${where}: account blocker ${k} in a character Verdict`);
  }
  goalChecks('account', r.account.goals);
  const indexes = r.characters.map((c) => c.index).sort((a, b) => a - b);
  const order = [...r.visitOrder].sort((a, b) => a - b);
  if (indexes.length !== order.length || indexes.some((v, i) => v !== order[i]))
    out.push('visitOrder is not a permutation of the character indexes');
  const blockers = new Set(r.account.blockerKeys);
  for (const k of blockers) {
    const g = r.account.goals.find((x) => x.nextAction.key === k);
    if (g?.category !== 'blocker') out.push(`account: blocker key ${k} is not a blocker Goal`);
  }
  const leading = r.account.goals.slice(0, blockers.size).map((g) => g.nextAction.key);
  if (leading.some((k) => !blockers.has(k)))
    out.push('account: stockpile blockers do not lead account.goals');
  return out;
}

export class InvariantError extends Error {
  override name = 'InvariantError';
}

export function assertInvariants(r: EngineResult): void {
  const v = invariantViolations(r);
  if (v.length > 0) throw new InvariantError(v.join('\n'));
}
