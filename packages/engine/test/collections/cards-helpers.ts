// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for the M8 Cards view: a save parsed the way the worker parses it, with the supply step
// over the Walkthrough leaves AND the card grind leaves (apps/activeon/src/worker/supply.ts), and the
// compiled Knowledge Base as a FactLookup.
import { readFileSync } from 'node:fs';
import {
  type AccountState,
  computeFrontier,
  computeSupplyRates,
  type MapGraphRow,
  toAccountState,
  withSupplyRates,
} from '@idleon-forge/account-state';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { cardLeavesForRates, type FactLookup } from '../../src/collections';
import { frontierRoute, lookupOf } from '../../src/metapath';
import { leavesForRates, rateTargets } from '../../src/walkthrough';
import { kb } from '../afk/helpers';

export { kb };
export const facts: FactLookup = lookupOf(kb);

const cache = new Map<string, AccountState>();

/** The worker's Account State at the save's own cloud save, with frontier and card supply rates. */
export function cardsState(file: string, edit?: (data: Record<string, unknown>) => void): AccountState {
  const key = edit ? null : file;
  if (key && cache.has(key)) return cache.get(key) as AccountState;
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { data?: Record<string, unknown> };
  const envelope = normalizeEnvelope(raw);
  if (edit && envelope.data) edit(envelope.data as Record<string, unknown>);
  const d = envelope.data as Record<string, unknown>;
  const ta = (typeof d.TimeAway === 'string' ? JSON.parse(d.TimeAway) : d.TimeAway) as { GlobalTime: number };
  const now = Math.round(ta.GlobalTime * 1000);
  const parsed = parseSave(envelope, { now });
  const world = Math.min(4, Number((parsed.account as { currentWorld?: number }).currentWorld ?? 1));
  const frontier = computeFrontier(parsed, envelope, {
    world,
    route: frontierRoute(facts, world) ?? [],
    rates: (m) => toolboxCalls.frontierRates(parsed, m),
  });
  const state = toAccountState(parsed, envelope, {
    source: 'paste',
    frontier,
    toolbox: { calls: toolboxCalls, withFrozenClock },
  });
  const rates = computeSupplyRates(parsed, envelope, state, {
    leaves: [...leavesForRates(state, kb, rateTargets(state, kb)), ...cardLeavesForRates(state, facts)],
    graph: (kb.facts['maps.fact.maps']?.rows ?? []) as unknown as MapGraphRow[],
    calls: toolboxCalls,
    withFrozenClock,
  });
  const out = withSupplyRates(state, rates);
  if (key) cache.set(key, out);
  return out;
}
