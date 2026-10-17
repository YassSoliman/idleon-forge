// SPDX-License-Identifier: GPL-3.0-only
// Regression (2026-10-17): the Realtime Database redirects each player to a shard host
// (e.g. s-gke-usc1-nssi4-13.firebaseio.com). Pinning the CSP to idlemmo.firebaseio.com blocked the
// shard, so character names never loaded and the app hung on "waiting for your save".
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const headers = readFileSync(fileURLToPath(new URL('../public/_headers', import.meta.url)), 'utf8');
const pagePolicy =
  headers.split('\n').find((l) => l.includes('Content-Security-Policy') && l.includes('worker-src')) ?? '';
const directive = (name: string) =>
  pagePolicy
    .split(';')
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${name} `)) ?? '';

describe('page CSP admits Realtime Database shard hosts', () => {
  it('allows https and wss on any firebaseio.com shard for connections', () => {
    expect(directive('connect-src')).toContain('https://*.firebaseio.com');
    expect(directive('connect-src')).toContain('wss://*.firebaseio.com');
  });
  it('allows the long-polling fallback script and frame on shard hosts', () => {
    expect(directive('script-src')).toContain('https://*.firebaseio.com');
    expect(directive('frame-src')).toContain('https://*.firebaseio.com');
  });
});
