// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the worker does with one request, as a plain function so tests can run it without a Worker.
// The engine runs here too, right after a clean parse (M10 TR-6): it keeps the last parsed state, so
// an Expected Return change re-runs only the dependent stage.

import knowledgeText from 'virtual:activeon-knowledge';
import {
  AccountShapeError,
  type AccountState,
  computeFrontier,
  EmptyAccountError,
  type Frontier,
  toAccountState,
  withSupplyRates,
} from '@idleon-forge/account-state';
import {
  createEngine,
  type Engine,
  type EngineModule,
  type KnowledgePort,
  metaPathModule,
} from '@idleon-forge/engine';
import { createAfkSafetyModule } from '@idleon-forge/engine/afk';
import { createAlchemyModule } from '@idleon-forge/engine/alchemy';
import { createBuildsModule } from '@idleon-forge/engine/builds';
import { createCardsViewModule, createCollectionsModule } from '@idleon-forge/engine/collections';
import { engineDetectors } from '@idleon-forge/engine/detectors';
import { createGearModule } from '@idleon-forge/engine/gear';
import { createMapModule } from '@idleon-forge/engine/map';
import { createMetaPathModule, detectStage, frontierRoute, lookupOf } from '@idleon-forge/engine/metapath';
import { createPicturesModule } from '@idleon-forge/engine/pictures';
import {
  classXpActionFor,
  createPurposeModule,
  purposeStatusFor,
  suggestionFor,
} from '@idleon-forge/engine/purpose';
import { createSessionModule } from '@idleon-forge/engine/session';
import { createM20Modules } from '@idleon-forge/engine/slots';
import { createSpendModule } from '@idleon-forge/engine/spend';
import { createStarSignsModule } from '@idleon-forge/engine/starsigns';
import { createUnspentModule } from '@idleon-forge/engine/unspent';
import { createWalkthroughModule } from '@idleon-forge/engine/walkthrough';
import {
  type CompiledKnowledge,
  coverage,
  type DetectorRegistry,
  loadKnowledge,
} from '@idleon-forge/knowledge';
import { detectors as knowledgeDetectors } from '@idleon-forge/knowledge/detectors';
import {
  InvalidSaveInputError,
  type ParsedSave,
  type ParseOptions,
  parseEnvelopeText,
  parseSave,
  type RawSaveEnvelope,
  toolboxCalls,
  verifiedBuilds,
  withFrozenClock,
} from '@idleon-forge/toolbox-parsers';
import { checkTruth, type TruthReport } from '@idleon-forge/truth';
import type {
  BuildMark,
  EngineCall,
  EngineOutcome,
  ParseFailureKind,
  ParseResponse,
  RerunResponse,
  WorkerRequest,
  WorkerResponse,
} from './protocol';
import { supplyRatesOf } from './supply';

export interface HandleOptions {
  /** Toolbox console.error pass-through (truncated in production builds, TR-23). */
  consoleErrors?: ParseOptions['consoleErrors'];
}

const kindOf = (err: unknown): ParseFailureKind =>
  err instanceof InvalidSaveInputError
    ? 'input'
    : err instanceof EmptyAccountError
      ? 'empty'
      : err instanceof AccountShapeError
        ? 'shape'
        : 'crash';

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** The build of a save that failed to parse, straight from the raw save and server vars. */
const rawBuild = (envelope: RawSaveEnvelope | null): BuildMark | null =>
  envelope
    ? { serverBuild: num(envelope.serverVars?.GameVERSION), saveVersion: num(envelope.data?.CSver) }
    : null;

/** The compiled Knowledge Base shipped in this chunk (knowledge-bundle.ts), loaded on first use. */
let knowledge: { kb: CompiledKnowledge | null; error: string | null } | null = null;
export function shippedKnowledge(): { kb: CompiledKnowledge | null; error: string | null } {
  if (!knowledge) {
    try {
      knowledge = { kb: loadKnowledge(knowledgeText), error: null };
    } catch (err) {
      // A broken bundle: no advice from it (M11 TR-7); the engine still runs and shows the gap.
      knowledge = { kb: null, error: err instanceof Error ? err.message : String(err) };
    }
  }
  return knowledge;
}

/** Detector registries `coverage()` evaluates System unlocks with. */
export const REGISTRIES: readonly DetectorRegistry[] = [knowledgeDetectors];

/** The Knowledge Base the engine sees (M10 FR-26): the shipped bundle's version and coverage(). */
export function knowledgeOf(
  call: EngineCall,
  kb: CompiledKnowledge | null = shippedKnowledge().kb,
): KnowledgePort {
  if (!kb) return { version: call.knowledgeVersion, coverage: () => [], kb: null };
  return {
    version: kb.version.display,
    kb,
    // M17 TR-2: the Systems hub's unlock states, evaluated here in the worker.
    registries: REGISTRIES,
    coverage: (state) =>
      coverage(state, kb, REGISTRIES, { now: state.asOf }).map((s) => ({ systemId: s.id, label: s.name })),
  };
}

/**
 * M2 TR-2: the frontier door on the current world's route path, with every character's Toolbox kill
 * rate there (the getMaxDamage clone, in the parse's frozen clock). null without a Knowledge Base, past
 * World 4, or when anything throws: a fallback is never used for a kill rate.
 */
export function frontierOf(
  parsed: ParsedSave,
  envelope: RawSaveEnvelope,
  kb: CompiledKnowledge | null,
): Frontier | null {
  if (!kb) return null;
  try {
    const world = num(parsed.account.currentWorld);
    if (world === null || world < 1 || world > 4) return null;
    const route = frontierRoute(lookupOf(kb), world);
    if (!route) return null;
    return computeFrontier(parsed, envelope, {
      world,
      route,
      rates: (map) => toolboxCalls.frontierRates(parsed, map),
    });
  } catch {
    return null;
  }
}

/**
 * The modules the worker's engine runs: M2's Stage & Meta Path and M3's AFK Safety, which needs the
 * compiled Knowledge Base (without it the core says AFK safety isn't covered, M10 §6).
 */
export function workerModules(kb: CompiledKnowledge | null = shippedKnowledge().kb): EngineModule[] {
  if (!kb) return [metaPathModule];
  const facts = lookupOf(kb);
  const purpose = { kb, registry: knowledgeDetectors };
  return [
    // M15 FR-15: the next family unlock takes M4's top Class XP Next Action.
    createMetaPathModule({ classXpAction: classXpActionFor(purpose) }),
    createAfkSafetyModule({
      kb,
      registry: knowledgeDetectors,
      stage: (state) => detectStage(state, facts),
      // M4 FR-8, FR-14: Ready means safe and serving; "What is this character for?" gets its suggestion.
      purpose: purposeStatusFor(purpose),
      purposeSuggestion: suggestionFor(purpose),
    }),
    createPurposeModule(purpose),
    createUnspentModule({
      kb,
      registry: knowledgeDetectors,
      stage: (state) => {
        const stage = detectStage(state, facts);
        return stage.id ? { id: stage.id } : null;
      },
    }),
    createBuildsModule({ kb }),
    createCollectionsModule({ kb, registry: engineDetectors }),
    createCardsViewModule({ kb, purpose }),
    createSpendModule({ kb, stage: (state) => detectStage(state, facts) }),
    // M18: before M14's step, which builds its Goals' Walkthroughs.
    createGearModule({ kb }),
    createWalkthroughModule({ kb }),
    createStarSignsModule({ kb }),
    ...createM20Modules({ kb }),
    // M19: runs after every module (it reads M3's, M6's and M7's merged output).
    createAlchemyModule({ kb }),
    // M21 Phase F: the area modules' stubs, registered once (spec §9); each area fills its own.
    createSessionModule(),
    createMapModule(),
    createPicturesModule(),
  ];
}

const errorText = (err: unknown) => (err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error');

/** Runs the engine without ever failing the parse: a throw becomes `{ error }` (FR-39). */
/**
 * The earlier saves the engine reads: only those saved before this one, oldest first. A pasted save
 * reads none (M1 D2: it may be another account, and it never feeds observed rates).
 */
export function historyFor(state: AccountState, call: EngineCall): NonNullable<EngineCall['history']> {
  const saved = state.account.lastCloudSave;
  if (state.diagnostics.source !== 'live' || saved === null || !call.history) return [];
  return call.history
    .filter((h) => h.lastCloudSave < saved)
    .sort((a, b) => a.lastCloudSave - b.lastCloudSave);
}

function runEngineSafely(engine: Engine, state: AccountState, call: EngineCall, now: number): EngineOutcome {
  try {
    return engine.run({
      state,
      history: {
        entries: historyFor(state, call),
        sessionStartedAt: call.sessionStartedAt,
        learnedExpectedReturnSeconds: call.learnedExpectedReturnSeconds,
      },
      knowledge: knowledgeOf(call),
      now,
      options: { expectedReturnSeconds: call.expectedReturnSeconds },
      // M19 TR-1: Toolbox's bubble cost function, pure, for the engine in this same worker.
      toolbox: { bubbleCost: toolboxCalls.bubbleCost },
    });
  } catch (err) {
    return { error: errorText(err) };
  }
}

export type RequestHandler = (request: WorkerRequest) => WorkerResponse;

/** One handler per worker: it owns the engine and the last clean parse. */
export function createRequestHandler(
  options: HandleOptions = {},
  engine: Engine = createEngine(workerModules()),
): RequestHandler {
  const last: LastParse = { input: null };
  return (request) => {
    if (request.type === 'rerun')
      return rerun(engine, request.id, request.expectedReturnSeconds, last, request.truthDetail);
    return handleRequest(request, options, engine, last);
  };
}

/** M22: what a re-run needs to check its result against the same save. */
interface LastParse {
  input: { envelope: RawSaveEnvelope; state: AccountState } | null;
}

/**
 * M22: the truth checks on an engine result, which replace only the advice a violation touches. A
 * thrown result passes through untouched (there is no advice to doubt).
 */
export function withTruth(
  envelope: RawSaveEnvelope,
  state: AccountState,
  outcome: EngineOutcome | null,
  detail = false,
): { result: EngineOutcome | null; truth: TruthReport } {
  const result = outcome && !('error' in outcome) ? outcome : null;
  const checked = checkTruth({ envelope, state, result });
  // The facts table and raw facts are for the debug hook; every other page gets the short report.
  const truth = detail ? checked.report : { ...checked.report, facts: [], raw: null };
  return { result: checked.result ?? outcome, truth };
}

function rerun(
  engine: Engine,
  id: number,
  expectedReturnSeconds: number,
  last?: LastParse,
  detail = false,
): RerunResponse {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  if (!engine.ready) return { id, ok: false, rerun: true, message: 'No save has been read yet.', ms: ms() };
  let result: EngineOutcome;
  try {
    result = engine.rerun(expectedReturnSeconds);
  } catch (err) {
    return { id, ok: true, rerun: true, result: { error: errorText(err) }, ms: ms() };
  }
  if (!last?.input) return { id, ok: true, rerun: true, result, ms: ms() };
  const checked = withTruth(last.input.envelope, last.input.state, result, detail);
  return { id, ok: true, rerun: true, result: checked.result ?? result, truth: checked.truth, ms: ms() };
}

export function handleRequest(
  request: Exclude<WorkerRequest, { type: 'rerun' }>,
  options: HandleOptions = {},
  engine: Engine = createEngine(workerModules()),
  last?: LastParse,
): ParseResponse {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const { id } = request;
  if (request.type === 'what-if') {
    return { id, ok: false, kind: 'input', message: 'What-if queries are not available yet.', ms: ms() };
  }
  let envelope: RawSaveEnvelope | null = null;
  const verified = { ...verifiedBuilds };
  try {
    const { input, now } = request;
    envelope = input.kind === 'text' ? parseEnvelopeText(input.text) : input.envelope;
    const env = envelope;
    const source = input.kind === 'text' ? 'paste' : 'live';
    // The frontier (kill rates on one map) is for the current save only, not the history parse.
    const parseAt = (at: number, withFrontier: boolean) => {
      const parsed = parseSave(env, { now: at, consoleErrors: options.consoleErrors });
      const frontier = withFrontier ? frontierOf(parsed, env, shippedKnowledge().kb) : null;
      const state = toAccountState(parsed, env, {
        source,
        frontier,
        toolbox: { calls: toolboxCalls, withFrozenClock },
      });
      return withFrontier
        ? withSupplyRates(state, supplyRatesOf(parsed, env, state, shippedKnowledge().kb))
        : state;
    };
    const state = parseAt(now, true);
    const savedAt = state.account.lastCloudSave;
    const historyState =
      request.withHistory && source === 'live' && savedAt !== null
        ? { historyState: parseAt(savedAt, false) }
        : {};
    // M22: the truth checks run on every parse, after the engine; they only ever hold advice back.
    const outcome = request.engine ? runEngineSafely(engine, state, request.engine, now) : null;
    const { result, truth } = withTruth(env, state, outcome, request.truthDetail);
    if (last) last.input = { envelope: env, state };
    const engineResult = result ? { result } : {};
    return {
      id,
      ok: true,
      state,
      ...historyState,
      ...engineResult,
      truth,
      verifiedBuilds: verified,
      ms: ms(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const build = rawBuild(envelope);
    return { id, ok: false, kind: kindOf(err), message, build, verifiedBuilds: verified, ms: ms() };
  }
}
