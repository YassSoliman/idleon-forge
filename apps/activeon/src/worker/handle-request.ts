// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the worker does with one request, as a plain function so tests can run it without a Worker.
// The engine runs here too, right after a clean parse (M10 TR-6): it keeps the last parsed state, so
// an Expected Return change re-runs only the dependent stage.
import {
  AccountShapeError,
  type AccountState,
  EmptyAccountError,
  toAccountState,
} from '@idleon-forge/account-state';
import { createEngine, type Engine, type KnowledgePort } from '@idleon-forge/engine';
import {
  InvalidSaveInputError,
  type ParseOptions,
  parseEnvelopeText,
  parseSave,
  type RawSaveEnvelope,
  verifiedBuilds,
} from '@idleon-forge/toolbox-parsers';
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

/**
 * The Knowledge Base the engine sees. Until M11's compiled bundle ships, its version is BuildInfo's
 * and `coverage()` lists nothing beyond the gaps the engine adds itself ("AFK safety"). After M11
 * merges this becomes `loadKnowledge` + `coverage` (cross-module note in the M10 PR).
 */
const knowledgeOf = (call: EngineCall): KnowledgePort => ({
  version: call.knowledgeVersion,
  coverage: () => [],
});

const errorText = (err: unknown) => (err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error');

/** Runs the engine without ever failing the parse: a throw becomes `{ error }` (FR-39). */
function runEngineSafely(engine: Engine, state: AccountState, call: EngineCall, now: number): EngineOutcome {
  try {
    return engine.run({
      state,
      history: {
        entries: [],
        sessionStartedAt: call.sessionStartedAt,
        learnedExpectedReturnSeconds: call.learnedExpectedReturnSeconds,
      },
      knowledge: knowledgeOf(call),
      now,
      options: { expectedReturnSeconds: call.expectedReturnSeconds },
    });
  } catch (err) {
    return { error: errorText(err) };
  }
}

export type RequestHandler = (request: WorkerRequest) => WorkerResponse;

/** One handler per worker: it owns the engine and the last clean parse. */
export function createRequestHandler(
  options: HandleOptions = {},
  engine: Engine = createEngine(),
): RequestHandler {
  return (request) => {
    if (request.type === 'rerun') return rerun(engine, request.id, request.expectedReturnSeconds);
    return handleRequest(request, options, engine);
  };
}

function rerun(engine: Engine, id: number, expectedReturnSeconds: number): RerunResponse {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  if (!engine.ready) return { id, ok: false, rerun: true, message: 'No save has been read yet.', ms: ms() };
  try {
    return { id, ok: true, rerun: true, result: engine.rerun(expectedReturnSeconds), ms: ms() };
  } catch (err) {
    return { id, ok: true, rerun: true, result: { error: errorText(err) }, ms: ms() };
  }
}

export function handleRequest(
  request: Exclude<WorkerRequest, { type: 'rerun' }>,
  options: HandleOptions = {},
  engine: Engine = createEngine(),
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
    const parseAt = (at: number) =>
      toAccountState(parseSave(env, { now: at, consoleErrors: options.consoleErrors }), env, { source });
    const state = parseAt(now);
    const savedAt = state.account.lastCloudSave;
    const historyState =
      request.withHistory && source === 'live' && savedAt !== null ? { historyState: parseAt(savedAt) } : {};
    const result = request.engine ? { result: runEngineSafely(engine, state, request.engine, now) } : {};
    return { id, ok: true, state, ...historyState, ...result, verifiedBuilds: verified, ms: ms() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const build = rawBuild(envelope);
    return { id, ok: false, kind: kindOf(err), message, build, verifiedBuilds: verified, ms: ms() };
  }
}
