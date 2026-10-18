// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
// Copyright (C) 2026 IdleOn Forge contributors.
// M22 FR-3: the `?debug=truth` dev and QA hook. It keeps the last report and envelope in memory,
// exposes them on `window.__activeonTruth`, and saves the envelope only as a local download.
import type { TruthReport } from '@idleon-forge/truth/types';
import { describe, expect, it, vi } from 'vitest';
import { record } from '../src/truth/debug';
import type { ParseRequest, WorkerResponse } from '../src/worker/protocol';

const report: TruthReport = {
  asOf: 1,
  rules: ['raw-matches-state'],
  violations: [
    {
      rule: 'raw-matches-state',
      key: 'c0.level',
      message: 'Slot 0 SQUIRE · class level: the save says 40, the Account State says 41',
      severity: 'P1',
      scope: { kind: 'character', character: 0 },
      evidence: { raw: 40, state: 41 },
    },
  ],
  suppressed: [],
  facts: [
    { key: 'c0.level', label: 'Slot 0 SQUIRE · class level', values: { raw: 40, state: 41 }, agree: false },
  ],
  raw: null,
  error: null,
  ms: 1,
};

const envelope = { data: { CharacterClass_0: 9 } };
const request: ParseRequest = { id: 1, type: 'parse', input: { kind: 'envelope', envelope }, now: 1 };
const response = { id: 1, ok: true, state: {}, truth: report, ms: 1 } as unknown as WorkerResponse;

type Hook = {
  report(): TruthReport | null;
  facts(): Array<Record<string, unknown>>;
  log(): unknown[];
  envelope(): unknown;
  saveEnvelope(): string | null;
};

describe('window.__activeonTruth', () => {
  it('returns the violations, the facts table and the envelope the page read', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    record(request, response);
    const hook = (window as unknown as { __activeonTruth: Hook }).__activeonTruth;
    expect(hook.report()?.violations).toHaveLength(1);
    expect(hook.facts()[0]).toMatchObject({ key: 'c0.level', raw: 40, state: 41, agree: false });
    expect(hook.log()).toHaveLength(1);
    expect(hook.envelope()).toEqual(envelope);
  });

  it('offers a local download of the envelope, and nothing else', () => {
    const create = vi.fn(() => 'blob:local');
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const hook = (window as unknown as { __activeonTruth: Hook }).__activeonTruth;
    expect(hook.saveEnvelope()).toMatch(/^live-\d{4}-\d{2}-\d{2}\.raw\.json$/);
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.getElementById('activeon-truth-save')?.textContent).toBe('Save my envelope locally');
    vi.unstubAllGlobals();
  });
});
