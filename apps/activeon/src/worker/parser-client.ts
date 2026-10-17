// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// UI-thread side of the worker: one long-lived Worker, promise per request.
import type { ParseInput, ParseRequest, ParseResponse } from './protocol';

export interface ParserClient {
  parse(input: ParseInput, now?: number): Promise<ParseResponse>;
  dispose(): void;
}

export function createParserClient(): ParserClient {
  const worker = new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' });
  const pending = new Map<number, (r: ParseResponse) => void>();
  let nextId = 1;

  worker.addEventListener('message', (event: MessageEvent<ParseResponse>) => {
    pending.get(event.data.id)?.(event.data);
    pending.delete(event.data.id);
  });
  worker.addEventListener('error', (event) => {
    // A worker that fails to load (or throws outside a request) fails everything in flight.
    for (const [id, resolve] of pending) {
      resolve({ id, ok: false, kind: 'crash', message: event.message || 'The parser failed to load.' });
    }
    pending.clear();
  });

  return {
    parse(input, now = Date.now()) {
      const id = nextId++;
      const request: ParseRequest = { id, input, now };
      return new Promise((resolve) => {
        pending.set(id, resolve);
        worker.postMessage(request);
      });
    },
    dispose() {
      worker.terminate();
      pending.clear();
    },
  };
}
