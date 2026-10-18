// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// UI-thread side of the worker (M1 TR-5): one long-lived Worker, at most one request in flight and one
// pending. A newer save replaces the pending one (its caller resolves `{ superseded: true }`), so a
// burst of character switches never queues more than one parse behind the running one.
// An Expected Return re-run (M10 TR-6) queues the same way: re-runs coalesce (newest wins), and a
// re-run behind a pending parse folds into that parse, which already carries the Expected Return.
// A parse over 15 s resolves as `timeout` and the worker is replaced. A worker `error` event fails the
// request in flight as `crash` and marks the worker dead: the next request recreates it once, and if
// that one dies too (it failed to load: an old browser, a chunk 404 after a deploy), every later
// request fails at once instead of waiting forever. When a newer ActiveOn build is live (M12 TR-10),
// that failure is `updated` instead, so the screen asks for a reload rather than blaming the save.
import { noteTruth, truthDebug } from '../truth/hook';
import type {
  EngineCall,
  ParseInput,
  ParseRequest,
  ParseResult,
  RerunResult,
  WorkerRequest,
  WorkerResponse,
} from './protocol';

export const PARSE_TIMEOUT_MS = 15_000;

export interface ParseCall {
  /** The clock to parse at (epoch ms); defaults to now. */
  now?: number;
  /** Also return the state parsed at `now = lastCloudSave`, for save history. */
  withHistory?: boolean;
  /** Run the engine after the parse (M10 TR-6). */
  engine?: EngineCall;
}

export interface ParserClient {
  parse(input: ParseInput, call?: ParseCall): Promise<ParseResult>;
  /** Re-runs the Expected-Return-dependent stage on the last parse (M10 TR-6). */
  rerun(expectedReturnSeconds: number): Promise<RerunResult>;
  /** Ends the worker; anything in flight or pending resolves `{ superseded: true }`. */
  dispose(): void;
}

/** The part of `Worker` the client uses, so tests can pass a fake. */
export interface WorkerLike {
  postMessage(message: WorkerRequest): void;
  terminate(): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerResponse>) => void): void;
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
}

export interface ParserClientOptions {
  createWorker?: () => WorkerLike;
  timeoutMs?: number;
  clock?: () => number;
  /**
   * M12 TR-10: on a worker error, whether a newer ActiveOn build is live (its chunks replaced ours).
   * Resolves true to fail the request as `updated`. Without it, errors are `crash`.
   */
  checkUpdated?: () => Promise<boolean>;
}

const realWorker = (): WorkerLike =>
  new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike;

type Resolve = (r: WorkerResponse | { superseded: true }) => void;

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
    request: WorkerRequest;
    resolve: Resolve;
    timer: ReturnType<typeof setTimeout>;
    sentAt: number;
  } | null = null;
  let pending: { request: WorkerRequest; resolve: Resolve } | null = null;

  const failure = (
    request: WorkerRequest,
    kind: 'crash' | 'timeout' | 'updated',
    message: string,
    ms: number,
  ) =>
    request.type === 'rerun'
      ? ({ id: request.id, ok: false, rerun: true, message, ms } as const)
      : ({ id: request.id, ok: false, kind, message, ms } as const);

  const failInFlight = (kind: 'crash' | 'timeout' | 'updated', message: string) => {
    if (!inFlight) return;
    const { request, resolve, timer, sentAt } = inFlight;
    clearTimeout(timer);
    inFlight = null;
    resolve(failure(request, kind, message, Math.round(clock() - sentAt)));
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
      if (worker !== w || !inFlight || event.data.id !== inFlight.request.id) return;
      const { resolve, timer, request } = inFlight;
      clearTimeout(timer);
      inFlight = null;
      noteTruth(request, event.data); // M22: a no-op unless the URL has ?debug=truth
      if (event.data.ok) restartsLeft = 1; // a working worker earns its restart back
      resolve(event.data);
      sendNext();
    });
    w.addEventListener('error', (event) => {
      if (worker !== w) return;
      event.preventDefault?.();
      drop(w);
      dead = true;
      const message = event.message || 'The parser failed to load.';
      const finish = (updated: boolean) => {
        if (updated) failInFlight('updated', 'ActiveOn was updated. Reload to continue.');
        else failInFlight('crash', message);
        sendNext();
      };
      if (!options.checkUpdated) return finish(false);
      void options.checkUpdated().then(finish, () => finish(false));
    });
    worker = w;
    return w;
  };

  const send = (request: WorkerRequest, resolve: Resolve) => {
    const w = ensureWorker();
    if (!w) {
      resolve(failure(request, 'crash', 'The save reader could not start. Reload the page to try again.', 0));
      return sendNext();
    }
    const timer = setTimeout(() => {
      if (!inFlight || inFlight.request.id !== request.id) return;
      drop(w); // a hung parse can't be interrupted; a fresh worker takes the next request
      failInFlight('timeout', `Reading the save took longer than ${Math.round(timeoutMs / 1000)} s.`);
      sendNext();
    }, timeoutMs);
    inFlight = { request, resolve, timer, sentAt: clock() };
    w.postMessage(request);
  };

  const sendNext = () => {
    if (inFlight || !pending || disposed) return;
    const next = pending;
    pending = null;
    send(next.request, next.resolve);
  };

  const enqueue = (request: WorkerRequest, resolve: Resolve) => {
    if (!inFlight) return send(request, resolve);
    pending?.resolve({ superseded: true });
    pending = { request, resolve };
  };

  return {
    parse(input, call = {}) {
      if (disposed) return Promise.resolve({ superseded: true });
      const request: ParseRequest = {
        id: nextId++,
        type: 'parse',
        input,
        now: call.now ?? Date.now(),
        ...(call.withHistory ? { withHistory: true } : {}),
        ...(call.engine ? { engine: call.engine } : {}),
        ...(truthDebug() ? { truthDetail: true } : {}),
      };
      return new Promise<ParseResult>((resolve) => enqueue(request, resolve as Resolve));
    },
    rerun(expectedReturnSeconds) {
      if (disposed) return Promise.resolve({ superseded: true });
      // A pending parse already re-runs the engine: give it the new Expected Return instead.
      // A re-run never displaces a pending save.
      if (pending?.request.type === 'parse') {
        const { engine } = pending.request;
        if (engine) pending.request = { ...pending.request, engine: { ...engine, expectedReturnSeconds } };
        return Promise.resolve({ superseded: true });
      }
      const request: WorkerRequest = {
        id: nextId++,
        type: 'rerun',
        expectedReturnSeconds,
        now: Date.now(),
        ...(truthDebug() ? { truthDetail: true } : {}),
      };
      return new Promise<RerunResult>((resolve) => enqueue(request, resolve as Resolve));
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
