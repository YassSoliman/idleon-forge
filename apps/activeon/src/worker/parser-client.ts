// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// UI-thread side of the worker (M1 TR-5): one long-lived Worker, at most one parse in flight and one
// pending. A newer save replaces the pending one (its caller resolves `{ superseded: true }`), so a
// burst of character switches never queues more than one parse behind the running one.
// A parse over 15 s resolves as `timeout` and the worker is replaced. A worker `error` event fails the
// parse in flight as `crash` and marks the worker dead: the next request recreates it once, and if
// that one dies too (it failed to load: an old browser, a chunk 404 after a deploy), every later
// request fails at once instead of waiting forever.
import type { ParseInput, ParseResponse, ParseResult, WorkerRequest } from './protocol';

export const PARSE_TIMEOUT_MS = 15_000;

export interface ParseCall {
  /** The clock to parse at (epoch ms); defaults to now. */
  now?: number;
  /** Also return the state parsed at `now = lastCloudSave`, for save history. */
  withHistory?: boolean;
}

export interface ParserClient {
  parse(input: ParseInput, call?: ParseCall): Promise<ParseResult>;
  /** Ends the worker; anything in flight or pending resolves `{ superseded: true }`. */
  dispose(): void;
}

/** The part of `Worker` the client uses, so tests can pass a fake. */
export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  terminate(): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<ParseResponse>) => void): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
}

export interface ParserClientOptions {
  createWorker?: () => WorkerLike;
  timeoutMs?: number;
  clock?: () => number;
}

const realWorker = (): WorkerLike =>
  new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike;

type Resolve = (r: ParseResult) => void;

export function createParserClient(options: ParserClientOptions = {}): ParserClient {
  const create = options.createWorker ?? realWorker;
  const timeoutMs = options.timeoutMs ?? PARSE_TIMEOUT_MS;
  const clock = options.clock ?? (() => performance.now());

  let worker: WorkerLike | null = null;
  let dead = false;
  let restartsLeft = 1;
  let disposed = false;
  let nextId = 1;
  let inFlight: {
    id: number;
    resolve: Resolve;
    timer: ReturnType<typeof setTimeout>;
    sentAt: number;
  } | null = null;
  let pending: { request: WorkerRequest; resolve: Resolve } | null = null;

  const failInFlight = (kind: 'crash' | 'timeout', message: string) => {
    if (!inFlight) return;
    const { id, resolve, timer, sentAt } = inFlight;
    clearTimeout(timer);
    inFlight = null;
    resolve({ id, ok: false, kind, message, ms: Math.round(clock() - sentAt) });
  };

  const drop = (w: WorkerLike) => {
    w.terminate();
    if (worker === w) worker = null;
  };

  const ensureWorker = (): WorkerLike | null => {
    if (worker) return worker;
    if (dead) {
      if (restartsLeft <= 0) return null;
      restartsLeft--;
      dead = false;
    }
    const w = create();
    w.addEventListener('message', (event) => {
      if (worker !== w || !inFlight || event.data.id !== inFlight.id) return;
      const { resolve, timer } = inFlight;
      clearTimeout(timer);
      inFlight = null;
      if (event.data.ok) restartsLeft = 1; // a working worker earns its restart back
      resolve(event.data);
      sendNext();
    });
    w.addEventListener('error', (event) => {
      if (worker !== w) return;
      event.preventDefault?.();
      drop(w);
      dead = true;
      failInFlight('crash', event.message || 'The parser failed to load.');
      sendNext();
    });
    worker = w;
    return w;
  };

  const send = (request: WorkerRequest, resolve: Resolve) => {
    const w = ensureWorker();
    if (!w) {
      resolve({
        id: request.id,
        ok: false,
        kind: 'crash',
        message: 'The save reader could not start. Reload the page to try again.',
        ms: 0,
      });
      return sendNext();
    }
    const timer = setTimeout(() => {
      if (!inFlight || inFlight.id !== request.id) return;
      drop(w); // a hung parse can't be interrupted; a fresh worker takes the next request
      failInFlight('timeout', `Reading the save took longer than ${Math.round(timeoutMs / 1000)} s.`);
      sendNext();
    }, timeoutMs);
    inFlight = { id: request.id, resolve, timer, sentAt: clock() };
    w.postMessage(request);
  };

  const sendNext = () => {
    if (inFlight || !pending || disposed) return;
    const next = pending;
    pending = null;
    send(next.request, next.resolve);
  };

  return {
    parse(input, call = {}) {
      if (disposed) return Promise.resolve({ superseded: true });
      const request: WorkerRequest = {
        id: nextId++,
        type: 'parse',
        input,
        now: call.now ?? Date.now(),
        ...(call.withHistory ? { withHistory: true } : {}),
      };
      return new Promise<ParseResult>((resolve) => {
        if (!inFlight) return send(request, resolve);
        pending?.resolve({ superseded: true });
        pending = { request, resolve };
      });
    },
    dispose() {
      disposed = true;
      if (worker) drop(worker);
      if (inFlight) {
        clearTimeout(inFlight.timer);
        inFlight.resolve({ superseded: true });
        inFlight = null;
      }
      pending?.resolve({ superseded: true });
      pending = null;
    },
  };
}
