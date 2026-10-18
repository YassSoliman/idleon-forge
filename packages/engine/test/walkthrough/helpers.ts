// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M14: a save parsed the way the worker parses it (frontier, Toolbox functions, the
// supply step), and the worker's modules over the compiled Knowledge Base.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  type AccountState,
  computeFrontier,
  computeSupplyRates,
  type MapGraphRow,
  toAccountState,
  withSupplyRates,
} from '@idleon-forge/account-state';
import { normalizeEnvelope, parseSave, toolboxCalls, withFrozenClock } from '@idleon-forge/toolbox-parsers';
import { createAfkSafetyModule } from '../../src/afk';
import { runEngine } from '../../src/core/engine';
import type { EngineModule } from '../../src/core/module';
import { detectStage, frontierRoute, lookupOf } from '../../src/metapath';
import { metaPathModule } from '../../src/metapath/module';
import type { EngineResult } from '../../src/result';
import { createUnspentModule } from '../../src/unspent';
import { createWalkthroughModule, leavesForRates, rateTargets } from '../../src/walkthrough';
import { kb, registry } from '../afk/helpers';

export { kb };

const at = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
export const PRIVATE = process.env.FORGE_PRIVATE_FIXTURES
  ? `${process.env.FORGE_PRIVATE_FIXTURES.replace(/\/$/, '')}/`
  : at('../../../../fixtures/private/');
const MAIN_CHECKOUT_PRIVATE = at('../../../../../../../fixtures/private/');
export const privateFile = (stem: 'yasser' | 'joseph') => {
  const a = `${PRIVATE}${stem}.raw.json`;
  return existsSync(a) ? a : `${MAIN_CHECKOUT_PRIVATE}${stem}.raw.json`;
};
export const hasPrivate = (stem: 'yasser' | 'joseph') => existsSync(privateFile(stem));
export const scrubbedFile = (id: 'scrubbed-w2' | 'scrubbed-w3') =>
  at(`../../../../fixtures/scrubbed/${id}.json`);

const cache = new Map<string, AccountState>();

/** A save as the worker reads it: parsed at its own cloud save, with frontier and supply rates. */
export function workerState(file: string, edit?: (data: Record<string, unknown>) => void): AccountState {
  const key = edit ? null : file;
  if (key && cache.has(key)) return cache.get(key) as AccountState;
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { data?: Record<string, unknown> };
  const envelope = normalizeEnvelope(raw);
  if (edit && envelope.data) edit(envelope.data as Record<string, unknown>);
  const d = envelope.data as Record<string, unknown>;
  const ta = (typeof d.TimeAway === 'string' ? JSON.parse(d.TimeAway) : d.TimeAway) as { GlobalTime: number };
  const now = Math.round(ta.GlobalTime * 1000);
  const parsed = parseSave(envelope, { now });
  const facts = lookupOf(kb);
  const world = Math.min(4, Number((parsed.account as { currentWorld?: number }).currentWorld ?? 1));
  const route = frontierRoute(facts, world) ?? [];
  const frontier = computeFrontier(parsed, envelope, {
    world,
    route,
    rates: (m) => toolboxCalls.frontierRates(parsed, m),
  });
  const state = toAccountState(parsed, envelope, {
    source: 'paste',
    frontier,
    toolbox: { calls: toolboxCalls, withFrozenClock },
  });
  const graph = (kb.facts['maps.fact.maps']?.rows ?? []) as unknown as MapGraphRow[];
  const rates = computeSupplyRates(parsed, envelope, state, {
    leaves: leavesForRates(state, kb, rateTargets(state, kb)),
    graph,
    calls: toolboxCalls,
    withFrozenClock,
  });
  const out = withSupplyRates(state, rates);
  if (key) cache.set(key, out);
  return out;
}

export function modules(): EngineModule[] {
  const facts = lookupOf(kb);
  return [
    metaPathModule,
    createAfkSafetyModule({ kb, registry, stage: (s) => detectStage(s, facts) }),
    createUnspentModule({
      kb,
      registry,
      stage: (s) => {
        const st = detectStage(s, facts);
        return st.id ? { id: st.id } : null;
      },
    }),
    createWalkthroughModule({ kb }),
  ];
}

export function engineOf(state: AccountState, expectedReturnHours = 8): EngineResult {
  return runEngine(
    {
      state,
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb },
      now: state.asOf,
      options: { expectedReturnSeconds: expectedReturnHours * 3600 },
    },
    modules(),
  );
}

/** Every Walkthrough on a result, with the Goal it rides on. */
export function walkthroughsOf(r: EngineResult) {
  return [
    ...r.characters.flatMap((c) => c.goals.map((g) => ({ subject: `c${c.index}`, goal: g }))),
    ...r.account.goals.map((g) => ({ subject: 'account', goal: g })),
  ].filter((x) => x.goal.walkthrough);
}
