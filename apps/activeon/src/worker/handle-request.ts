// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What the worker does with one request, as a plain function so tests can run it without a Worker.
import { AccountShapeError, EmptyAccountError, toAccountState } from '@idleon-forge/account-state';
import { InvalidSaveInputError, parseEnvelopeText, parseSave } from '@idleon-forge/toolbox-parsers';
import type { ParseRequest, ParseResponse } from './protocol';

export function handleParseRequest({ id, input, now }: ParseRequest): ParseResponse {
  const started = performance.now();
  try {
    const envelope = input.kind === 'text' ? parseEnvelopeText(input.text) : input.envelope;
    const source = input.kind === 'text' ? 'paste' : 'live';
    const state = toAccountState(parseSave(envelope, { now }), envelope, { source });
    return { id, ok: true, state, ms: Math.round(performance.now() - started) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (err instanceof InvalidSaveInputError) return { id, ok: false, kind: 'input', message };
    if (err instanceof EmptyAccountError) return { id, ok: false, kind: 'empty', message };
    if (err instanceof AccountShapeError) return { id, ok: false, kind: 'shape', message };
    return { id, ok: false, kind: 'crash', message };
  }
}
