// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M13: the page CSP admits the Suggestions Worker and Turnstile, and keeps every earlier entry (the
// Firebase hosts and Realtime Database shards, Google OAuth) and the locked-down parse worker.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const headers = readFileSync(fileURLToPath(new URL('../public/_headers', import.meta.url)), 'utf8');
const policies = headers.split('\n').filter((l) => l.includes('Content-Security-Policy'));
const pagePolicy = policies.find((l) => l.includes('worker-src')) ?? '';
const directive = (name: string) =>
  (
    pagePolicy
      .split(';')
      .map((d) => d.trim().replace(/^Content-Security-Policy:\s*/, ''))
      .find((d) => d.startsWith(`${name} `)) ?? ''
  ).split(/\s+/);

describe('page CSP for Suggestions (M13 TR-5, TR-10)', () => {
  it('lets the page reach the Suggestions Worker', () => {
    expect(directive('connect-src')).toContain('https://activeon-suggestions.idleon.workers.dev');
  });
  it('lets Turnstile load its script and its challenge frame', () => {
    expect(directive('script-src')).toContain('https://challenges.cloudflare.com');
    expect(directive('frame-src')).toContain('https://challenges.cloudflare.com');
  });
  it('keeps every earlier entry', () => {
    expect(directive('default-src')).toEqual(['default-src', "'self'"]);
    expect(directive('script-src')).toEqual(expect.arrayContaining(["'self'", 'https://*.firebaseio.com']));
    expect(directive('connect-src')).toEqual(
      expect.arrayContaining([
        "'self'",
        'https://oauth2.googleapis.com',
        'https://*.googleapis.com',
        'https://*.firebaseio.com',
        'wss://*.firebaseio.com',
      ]),
    );
    expect(directive('frame-src')).toContain('https://*.firebaseio.com');
    expect(directive('worker-src')).toEqual(['worker-src', "'self'"]);
    expect(directive('style-src')).toEqual(['style-src', "'self'"]);
    expect(directive('object-src')).toEqual(['object-src', "'none'"]);
    expect(directive('frame-ancestors')).toEqual(['frame-ancestors', "'none'"]);
    expect(directive('form-action')).toEqual(['form-action', "'none'"]);
  });
  it('admits nothing broader: no wildcard source and no unsafe keywords', () => {
    expect(pagePolicy).not.toMatch(/'unsafe-|\s\*\s|\s\*;|https:\s|https:;/);
  });
  it('leaves the parse worker with no network', () => {
    expect(
      policies.some((l) => l.includes("default-src 'none'; script-src 'self'; connect-src 'none'")),
    ).toBe(true);
  });
});
