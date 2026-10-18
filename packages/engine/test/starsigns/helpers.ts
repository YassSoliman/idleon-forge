// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Test helpers for M16: a save parsed the way the worker parses it (frontier, Toolbox functions, the
// supply step with the Walkthrough leaves and M16's tree maps), and the engine with M16 registered.
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
import { runEngine } from '../../src/core/engine';
import { frontierRoute, lookupOf, runMetaPath } from '../../src/metapath';
import type { EngineResult, Goal } from '../../src/result';
import { buildStarSigns, createStarSignsModule, telescopeRateLeaves } from '../../src/starsigns';
import { chartNodes, constellationFacts } from '../../src/starsigns/knowledge';
import { leavesForRates, rateTargets } from '../../src/walkthrough';
import { kb, modules } from '../walkthrough/helpers';

export { hasPrivate, privateFile, scrubbedFile } from '../walkthrough/helpers';
export { kb };

const cache = new Map<string, AccountState>();

/** The worker's Account State at the save's own cloud save, with frontier and supply rates (M16 X3 included). */
export function starState(file: string): AccountState {
  const hit = cache.get(file);
  if (hit) return structuredClone(hit);
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { data?: Record<string, unknown> };
  const envelope = normalizeEnvelope(raw);
  const d = envelope.data as Record<string, unknown>;
  const ta = (typeof d.TimeAway === 'string' ? JSON.parse(d.TimeAway) : d.TimeAway) as { GlobalTime: number };
  const now = Math.round(ta.GlobalTime * 1000);
  const parsed = parseSave(envelope, { now });
  const facts = lookupOf(kb);
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
    leaves: [...leavesForRates(state, kb, rateTargets(state, kb)), ...telescopeRateLeaves(state)],
    graph: (kb.facts['maps.fact.maps']?.rows ?? []) as unknown as MapGraphRow[],
    calls: toolboxCalls,
    withFrozenClock,
  });
  const out = withSupplyRates(state, rates);
  cache.set(file, out);
  return structuredClone(out);
}

/** The engine with the worker's M2, M3, M6, M14 and M16 modules. */
export function run(state: AccountState): EngineResult {
  return runEngine(
    {
      state,
      history: { entries: [], sessionStartedAt: null, learnedExpectedReturnSeconds: null },
      knowledge: { version: 'test', coverage: () => [], kb },
      now: state.asOf,
      options: { expectedReturnSeconds: 8 * 3600 },
    },
    [...modules(), createStarSignsModule({ kb })],
  );
}

/** M16 alone, with M2's result (for unit-level stories). */
export const m16 = (state: AccountState) => buildStarSigns(state, kb, runMetaPath(state, kb, state.asOf));

export const starGoals = (r: EngineResult): Goal[] =>
  r.account.goals.filter((g) => g.system === 'star-signs');

/** The index of the character with this class and level (fixtures are named by class and level only). */
export function slotOf(state: AccountState, cls: string, level: number): number {
  const c = state.characters.find((x) => x.class === cls && x.level === level);
  if (!c) throw new Error(`no ${cls} Lv ${level}`);
  return c.index;
}

/** The Telescope quest handed in on every character (the account-wide hand-in, F-k), A-2 claimed. */
export function handedIn(s: AccountState): AccountState {
  for (const c of s.characters) {
    c.quests = { ...(c.quests ?? {}), Telescope: { '1': 1 } };
    c.npcDialog = { ...(c.npcDialog ?? {}), Telescope: 9999 };
  }
  const ss = s.account.starSigns;
  if (ss) ss.telescopeQuestDone = true;
  return claim(s, ['A-2']);
}

const facts = () => constellationFacts(kb);
const rawOf = (name: string) => {
  const f = facts().find((x) => x.name === name);
  if (!f) throw new Error(`no constellation ${name}`);
  return f.rawIndex;
};

/** Marks constellations claimed (their points paid). */
export function claim(s: AccountState, names: readonly string[]): AccountState {
  const ss = s.account.starSigns;
  if (!ss) throw new Error('no star signs');
  for (const n of names) {
    const r = rawOf(n);
    if (!ss.claimed.includes(r)) ss.claimed.push(r);
    ss.progress = ss.progress.filter((p) => p.rawIndex !== r);
  }
  ss.claimed.sort((a, b) => a - b);
  return s;
}

/** Every W1–W3 constellation claimed. */
export const claimAll = (s: AccountState) =>
  claim(
    s,
    facts().map((f) => f.name),
  );

/** Sets a constellation's progress (synthetic letters, TR-8). */
export function setProgress(
  s: AccountState,
  name: string,
  letterCount: number,
  recorded: number[],
): AccountState {
  const ss = s.account.starSigns;
  if (!ss) throw new Error('no star signs');
  const r = rawOf(name);
  ss.progress = [...ss.progress.filter((p) => p.rawIndex !== r), { rawIndex: r, letterCount, recorded }];
  return s;
}

export const progressOf = (s: AccountState, name: string) =>
  s.account.starSigns?.progress.find((p) => p.rawIndex === rawOf(name));

/** Sign names as StarSigns ids (star-signs.fact.chart). */
export function signIds(names: readonly string[]): number[] {
  const nodes = chartNodes(kb);
  return names.map((n) => {
    const x = nodes.find((y) => y.sign === n);
    if (!x) throw new Error(`no sign ${n}`);
    return x.id;
  });
}
