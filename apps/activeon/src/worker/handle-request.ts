// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the worker does with one request, as a plain function so tests can run it without a Worker.
import { AccountShapeError, EmptyAccountError, toAccountState } from '@idleon-forge/account-state';
import {
  InvalidSaveInputError,
  type ParseOptions,
  parseEnvelopeText,
  parseSave,
} from '@idleon-forge/toolbox-parsers';
import type { ParseFailureKind, ParseResponse, WorkerRequest } from './protocol';

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

export function handleRequest(request: WorkerRequest, options: HandleOptions = {}): ParseResponse {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const { id } = request;
  if (request.type === 'what-if') {
    return { id, ok: false, kind: 'input', message: 'What-if queries are not available yet.', ms: ms() };
  }
  try {
    const { input, now } = request;
    const envelope = input.kind === 'text' ? parseEnvelopeText(input.text) : input.envelope;
    const source = input.kind === 'text' ? 'paste' : 'live';
    const parseAt = (at: number) =>
      toAccountState(parseSave(envelope, { now: at, consoleErrors: options.consoleErrors }), envelope, {
        source,
      });
    const state = parseAt(now);
    const savedAt = state.account.lastCloudSave;
    if (request.withHistory && source === 'live' && savedAt !== null) {
      return { id, ok: true, state, historyState: parseAt(savedAt), ms: ms() };
    }
    return { id, ok: true, state, ms: ms() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { id, ok: false, kind: kindOf(err), message, ms: ms() };
  }
}
