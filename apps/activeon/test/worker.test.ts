// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The worker's request handler, end to end on a public save: paste text in, Account State out.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { handleRequest } from '../src/worker/handle-request';
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
});
