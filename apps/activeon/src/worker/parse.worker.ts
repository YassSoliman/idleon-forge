// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The parsing Web Worker (ADR 0006): Toolbox's parsers and their prototype patches live only here.
import { handleParseRequest } from './handle-request';
import type { ParseRequest, ParseResponse } from './protocol';

// The app is typechecked against the DOM lib; this is the slice of the worker scope we use.
const scope = self as unknown as {
  addEventListener(type: 'message', listener: (event: MessageEvent<ParseRequest>) => void): void;
  postMessage(message: ParseResponse): void;
};

scope.addEventListener('message', (event) => {
  scope.postMessage(handleParseRequest(event.data));
});
