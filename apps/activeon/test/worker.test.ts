// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The worker's request handler, end to end on a public save: paste text in, Account State out.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { handleParseRequest } from '../src/worker/handle-request';

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
  });

  it.each([
    ['not JSON', 'hello', 'input'],
    ['an empty object', '{}', 'input'],
    ['something that is not a save', '{"data":{"hello":"world"}}', 'empty'],
  ])('reports %s as "%s"', (_label, text, kind) => {
    const res = handleParseRequest({ id: 3, now: NOW, input: { kind: 'text', text } });
    expect(res).toMatchObject({ id: 3, ok: false, kind });
  });
});
