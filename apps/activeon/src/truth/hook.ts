// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 FR-3: the only truth code on the main thread. Without `?debug=truth` in the URL it is one
// regex test per page load; with it, the dev and QA hook (./debug.ts, its own lazy chunk) records
// each parse's truth report and exposes `window.__activeonTruth`. Nothing is ever sent anywhere.
import type { WorkerRequest, WorkerResponse } from '../worker/protocol';

let on: boolean | null = null;

/** Whether this page load has `?debug=truth` (the worker then sends the full facts table too). */
export function truthDebug(): boolean {
  if (on === null) on = typeof location !== 'undefined' && /[?&]debug=truth(?:&|$)/.test(location.search);
  return on;
}

/** Called by the parser client with every worker response. */
export function noteTruth(request: WorkerRequest, response: WorkerResponse): void {
  if (!truthDebug()) return;
  void import('./debug').then((m) => m.record(request, response));
}
