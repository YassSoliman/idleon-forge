// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The parsing Web Worker (ADR 0006): Toolbox's parsers and their prototype patches live only here.
// In production it is served with `connect-src 'none'` (public/_headers, M1 TR-25): it has no network.
import { handleRequest } from './handle-request';
import type { ParseResponse, WorkerRequest } from './protocol';

// The app is typechecked against the DOM lib; this is the slice of the worker scope we use.
const scope = self as unknown as {
  addEventListener(type: 'message', listener: (event: MessageEvent<WorkerRequest>) => void): void;
  postMessage(message: ParseResponse): void;
};

const consoleErrors = import.meta.env.DEV ? 'full' : 'truncated';

scope.addEventListener('message', (event) => {
  scope.postMessage(handleRequest(event.data, { consoleErrors }));
});
