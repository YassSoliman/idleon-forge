// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 dev and QA hook, loaded only under `?debug=truth` (hook.ts). It keeps the last parse's truth
// report and a short log of violations in memory, and exposes them as `window.__activeonTruth`:
//   report()        the last TruthReport (violations, what was held back, the facts table, raw facts)
//   violations()    the last report's violations
//   facts()         the facts table, as rows ready for console.table
//   log()           every violation seen this page load (bounded)
//   envelope()      the last save envelope the page read (the signed-in player's own save)
//   saveEnvelope()  downloads that envelope as `live-<date>.raw.json`, for fixtures/private/
// The "Save my envelope locally" button does the same. Read-only toward the game: it reads what the
// page already holds, writes only a local file, and never sends anything anywhere.
import type { TruthReport, Violation } from '@idleon-forge/truth/types';
import type { WorkerRequest, WorkerResponse } from '../worker/protocol';

const LOG_MAX = 200;

interface TruthHook {
  report(): TruthReport | null;
  violations(): Violation[];
  facts(): Array<{ key: string; label: string; agree: boolean } & Record<string, unknown>>;
  log(): Violation[];
  envelope(): unknown;
  saveEnvelope(): string | null;
}

let lastReport: TruthReport | null = null;
let lastEnvelope: unknown = null;
const seen: Violation[] = [];

const today = () => new Date().toISOString().slice(0, 10);

function saveEnvelope(): string | null {
  if (!lastEnvelope) return null;
  const name = `live-${today()}.raw.json`;
  const blob = new Blob([JSON.stringify(lastEnvelope)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return name;
}

const hook: TruthHook = {
  report: () => lastReport,
  violations: () => lastReport?.violations ?? [],
  facts: () =>
    (lastReport?.facts ?? []).map((f) => ({ key: f.key, label: f.label, agree: f.agree, ...f.values })),
  log: () => seen.slice(),
  envelope: () => lastEnvelope,
  saveEnvelope,
};

function button() {
  if (document.getElementById('activeon-truth-save')) return;
  const b = document.createElement('button');
  b.id = 'activeon-truth-save';
  b.type = 'button';
  b.textContent = 'Save my envelope locally';
  // CSSOM, not a style attribute: allowed under the page's CSP.
  Object.assign(b.style, {
    position: 'fixed',
    left: '8px',
    bottom: '8px',
    zIndex: '9999',
    minHeight: '44px',
    padding: '0 12px',
    font: '14px system-ui, sans-serif',
  });
  b.addEventListener('click', () => {
    b.textContent = saveEnvelope() ? 'Saved: check your downloads' : 'No save read yet';
  });
  document.body.append(b);
}

/** One worker response: keep its report (and the envelope it was read from). */
export function record(request: WorkerRequest, response: WorkerResponse): void {
  (window as unknown as { __activeonTruth?: TruthHook }).__activeonTruth = hook;
  button();
  if (!response.ok || !('truth' in response) || !response.truth) return;
  lastReport = response.truth;
  if (request.type === 'parse')
    lastEnvelope = request.input.kind === 'envelope' ? request.input.envelope : safeParse(request.input.text);
  for (const v of response.truth.violations) {
    seen.push(v);
    if (seen.length > LOG_MAX) seen.shift();
  }
  if (response.truth.violations.length > 0)
    console.warn(`[truth] ${response.truth.violations.length} violation(s); window.__activeonTruth.report()`);
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
