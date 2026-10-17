// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the worker does with one request, as a plain function so tests can run it without a Worker.
import { AccountShapeError, EmptyAccountError, toAccountState } from '@idleon-forge/account-state';
import {
  InvalidSaveInputError,
  type ParseOptions,
  parseEnvelopeText,
  parseSave,
  type RawSaveEnvelope,
  verifiedBuilds,
} from '@idleon-forge/toolbox-parsers';
import type { BuildMark, ParseFailureKind, ParseResponse, WorkerRequest } from './protocol';

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

export function handleRequest(request: WorkerRequest, options: HandleOptions = {}): ParseResponse {
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
    if (request.withHistory && source === 'live' && savedAt !== null) {
      return { id, ok: true, state, historyState: parseAt(savedAt), verifiedBuilds: verified, ms: ms() };
    }
    return { id, ok: true, state, verifiedBuilds: verified, ms: ms() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const build = rawBuild(envelope);
    return { id, ok: false, kind: kindOf(err), message, build, verifiedBuilds: verified, ms: ms() };
  }
}
