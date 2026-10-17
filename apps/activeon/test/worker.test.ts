// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The worker's request handler, end to end on a public save: paste text in, Account State out.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { createRequestHandler, handleRequest } from '../src/worker/handle-request';
import type { ParseInput } from '../src/worker/protocol';

const handleParseRequest = (r: { id: number; now: number; input: ParseInput; withHistory?: boolean }) =>
  handleRequest({ type: 'parse', ...r });

const NOW = Date.UTC(2026, 9, 17, 12);
const publicSave = (name: string) =>
  readFileSync(
    fileURLToPath(new URL(`../../../packages/account-state/fixtures/public/${name}`, import.meta.url)),
    'utf8',
  );

describe('handleParseRequest (the paste fallback path)', () => {
  it('reads a pasted "Copy for support" envelope into an Account State', () => {
    const res = handleParseRequest({
      id: 7,
      now: NOW,
      input: { kind: 'text', text: publicSave('toolbox-raw.json') },
    });
    if (!res.ok) throw new Error(`${res.kind}: ${res.message}`);
    expect(res.id).toBe(7);
    expect(res.state.asOf).toBe(NOW);
    expect(res.state.characters.length).toBeGreaterThan(0);
    expect(res.state.account.lastCloudSave).toEqual(expect.any(Number));
  });

  it('reads a pasted bare save', () => {
    const bare = JSON.stringify(JSON.parse(publicSave('first.json')).data);
    const res = handleParseRequest({ id: 1, now: NOW, input: { kind: 'text', text: bare } });
    if (!res.ok) throw new Error(`${res.kind}: ${res.message}`);
    expect(res.state.characters[0]?.name).toBe('Character 1');
  });

  it('reads an envelope from the live listener', () => {
    const envelope = JSON.parse(publicSave('fresh.json'));
    const res = handleParseRequest({ id: 2, now: NOW, input: { kind: 'envelope', envelope } });
    expect(res.ok && res.state.characters.length).toBeGreaterThan(0);
    expect(res.ok && res.state.diagnostics.source).toBe('live');
    expect(res.ok && res.historyState).toBeUndefined();
  });

  it('marks a paste as a paste', () => {
    const res = handleParseRequest({
      id: 4,
      now: NOW,
      input: { kind: 'text', text: publicSave('fresh.json') },
    });
    expect(res.ok && res.state.diagnostics.source).toBe('paste');
  });

  it('also parses a live save at its own cloud-save time for history (FR-21, TR-4)', () => {
    const envelope = JSON.parse(publicSave('fresh.json'));
    const res = handleParseRequest({
      id: 5,
      now: NOW,
      withHistory: true,
      input: { kind: 'envelope', envelope },
    });
    if (!res.ok || !res.historyState) throw new Error('expected a history state');
    expect(res.state.asOf).toBe(NOW);
    expect(res.historyState.asOf).toBe(res.state.account.lastCloudSave);
    expect(res.historyState.account.secondsSinceLastSave).toBe(0);
  });

  it('never stores a paste in history, even when asked (D2)', () => {
    const res = handleParseRequest({
      id: 6,
      now: NOW,
      withHistory: true,
      input: { kind: 'text', text: publicSave('fresh.json') },
    });
    expect(res.ok && res.historyState).toBeUndefined();
  });

  it('sends the bundle verifiedBuilds with every answer, for the patch rule (FR-29)', () => {
    const envelope = JSON.parse(publicSave('fresh.json'));
    const res = handleParseRequest({ id: 9, now: NOW, input: { kind: 'envelope', envelope } });
    expect(res.verifiedBuilds).toEqual({ serverBuild: expect.any(Number), saveVersion: expect.any(Number) });
  });

  it('reports the build of a save that failed outright, read from the raw save', () => {
    const envelope = { data: { CSver: 35.01, hello: 'world' }, serverVars: { GameVERSION: 150 } };
    const res = handleParseRequest({ id: 10, now: NOW, input: { kind: 'envelope', envelope } });
    expect(res).toMatchObject({ ok: false, kind: 'empty', build: { serverBuild: 150, saveVersion: 35.01 } });
    expect(res.verifiedBuilds?.serverBuild).toEqual(expect.any(Number));
  });

  it('answers the reserved what-if request without running it', () => {
    const res = handleRequest({ id: 8, type: 'what-if', query: { kind: 'damage' }, now: NOW });
    expect(res).toMatchObject({ id: 8, ok: false, kind: 'input' });
  });

  it.each([
    ['not JSON', 'hello', 'input'],
    ['an empty object', '{}', 'input'],
    ['something that is not a save', '{"data":{"hello":"world"}}', 'empty'],
  ])('reports %s as "%s"', (_label, text, kind) => {
    const res = handleParseRequest({ id: 3, now: NOW, input: { kind: 'text', text } });
    expect(res).toMatchObject({ id: 3, ok: false, kind, ms: expect.any(Number) });
  });

  it('runs the engine after a clean parse; every Verdict is Unknown not-covered before M3 (M10 TR-6)', () => {
    const handle = createRequestHandler();
    const envelope = JSON.parse(publicSave('fresh.json'));
    const res = handle({
      id: 11,
      type: 'parse',
      now: NOW,
      input: { kind: 'envelope', envelope },
      engine: {
        expectedReturnSeconds: 8 * 3600,
        sessionStartedAt: 5,
        learnedExpectedReturnSeconds: null,
        knowledgeVersion: 'k1',
      },
    });
    if (!('state' in res) || !res.ok || !res.result || 'error' in res.result)
      throw new Error('expected a result');
    expect(res.result.characters.every((c) => c.verdict.unknownReason === 'not-covered')).toBe(true);
    // The shipped bundle's own version wins over BuildInfo's once it loads (M10 FR-26).
    expect(res.result.versions.knowledge).toMatch(/^knowledge \d{4}\.\d{2}\.\d{2}/);
    expect(res.result.sessionStartedAt).toBe(5);
    expect(structuredClone(res.result)).toEqual(res.result);
    const again = handle({ id: 12, type: 'rerun', expectedReturnSeconds: 4 * 3600, now: NOW });
    expect(again).toMatchObject({
      ok: true,
      rerun: true,
      result: { expectedReturn: { usedSeconds: 4 * 3600 } },
    });
  });

  it('a re-run before any parse says so', () => {
    expect(
      createRequestHandler()({ id: 1, type: 'rerun', expectedReturnSeconds: 1, now: NOW }),
    ).toMatchObject({
      ok: false,
      rerun: true,
    });
  });

  it('a parse without an engine call runs no engine', () => {
    const res = handleParseRequest({
      id: 13,
      now: NOW,
      input: { kind: 'text', text: publicSave('fresh.json') },
    });
    expect(res.ok && res.result).toBeUndefined();
  });
});
