// SPDX-License-Identifier: GPL-3.0-only
// Test doubles: a local RSA key pair as the "Google" signer (M13 §4), a fake GitHub API and a fake
// Turnstile siteverify behind one fetch function, and fake rate limiters.

import type { SuggestionRequest } from '../src/contract';
import { bytesToBase64, bytesToBase64Url, stringToBase64Url, utf8Bytes } from '../src/encoding';
import type { Env, RateLimiter } from '../src/env';
import { BOT_LOGIN, type RawIssue } from '../src/github';
import type { Deps } from '../src/handlers';

const RSA = {
  name: 'RSASSA-PKCS1-v1_5',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: 'SHA-256',
};

export async function rsaKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(RSA, true, ['sign', 'verify']) as Promise<CryptoKeyPair>;
}

export async function pkcs8Pem(key: CryptoKey): Promise<string> {
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', key));
  const b64 = bytesToBase64(der).replace(/(.{64})/g, '$1\n');
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`;
}

export async function signJwt(
  key: CryptoKey,
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): Promise<string> {
  const h = stringToBase64Url(JSON.stringify(header));
  const p = stringToBase64Url(JSON.stringify(payload));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, utf8Bytes(`${h}.${p}`));
  return `${h}.${p}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

// --- minimal DER encoder, enough to wrap an SPKI in a certificate-shaped structure ---

function len(n: number): number[] {
  if (n < 0x80) return [n];
  const bytes: number[] = [];
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n >>= 8;
  }
  return [0x80 | bytes.length, ...bytes];
}

export function tlv(tag: number, body: Uint8Array | number[]): Uint8Array {
  const b = [...body];
  return new Uint8Array([tag, ...len(b.length), ...b]);
}

const concat = (...parts: Uint8Array[]) => parts.flatMap((p) => [...p]);

/** A certificate-shaped DER around `spki` (not a valid signature; only the structure is read). */
export function fakeCertificate(spki: Uint8Array, withVersion = true): Uint8Array<ArrayBuffer> {
  const oid = tlv(0x30, tlv(0x06, [0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x0b]));
  const tbs = tlv(
    0x30,
    concat(
      ...(withVersion ? [tlv(0xa0, tlv(0x02, [2]))] : []),
      tlv(0x02, [1]),
      oid,
      tlv(0x30, []),
      tlv(0x30, []),
      tlv(0x30, []),
      spki,
    ),
  );
  return new Uint8Array(tlv(0x30, concat(tbs, oid, tlv(0x03, [0]))));
}

export function pem(label: string, der: Uint8Array): string {
  return `-----BEGIN ${label}-----\n${bytesToBase64(der).replace(/(.{64})/g, '$1\n')}\n-----END ${label}-----\n`;
}

// --- the "Google" signer ---

export const NOW = Date.parse('2026-10-17T12:00:00Z');
export const KID = 'test-kid-1';

export interface Google {
  keys: Deps['keys'];
  /** A proof for `sub` that expired `expiredFor` seconds before NOW (default 20 minutes). */
  proof(
    sub: string,
    opts?: { expiredFor?: number; provider?: string; claims?: Record<string, unknown> },
  ): Promise<string>;
  privateKey: CryptoKey;
  publicKey: CryptoKey;
}

export async function google(): Promise<Google> {
  const pair = await rsaKeyPair();
  return {
    privateKey: pair.privateKey,
    publicKey: pair.publicKey,
    keys: { get: async (kid) => (kid === KID ? pair.publicKey : undefined) },
    async proof(sub, opts = {}) {
      const exp = Math.floor(NOW / 1000) - (opts.expiredFor ?? 20 * 60);
      const iat = exp - 3600;
      return signJwt(
        pair.privateKey,
        { alg: 'RS256', kid: KID, typ: 'JWT' },
        {
          iss: 'https://securetoken.google.com/idlemmo',
          aud: 'idlemmo',
          auth_time: iat - 100,
          user_id: sub,
          sub,
          iat,
          exp,
          firebase: { identities: {}, sign_in_provider: opts.provider ?? 'google.com' },
          ...opts.claims,
        },
      );
    },
  };
}

// --- fake GitHub + Turnstile ---

export interface FakeComment {
  id: number;
  body: string;
  createdAt: string;
  author: { typename: 'User' | 'Bot'; login: string; id: number };
  lastEditedAt: string | null;
  editor: { typename: 'User' | 'Bot'; login: string; id: number } | null;
}

export interface FakeIssue extends RawIssue {
  comments: FakeComment[];
}

export const BOT_ACTOR = { typename: 'Bot' as const, login: 'idleon-forge-suggestions', id: 9000 };
export const YASSER = { typename: 'User' as const, login: 'YassSoliman', id: 1111 };
export const STRANGER = { typename: 'User' as const, login: 'someone', id: 2222 };

export class FakeGitHub {
  issues: FakeIssue[] = [];
  calls: string[] = [];
  /** Throw on the nth call matching `match` (fault injection). */
  failOn: { match: RegExp; status: number } | null = null;
  /** Set to false to make siteverify fail. */
  turnstilePass = true;
  turnstileHostname = 'activeon.idleon.workers.dev';
  turnstileAction = 'suggest';
  siteverifyBodies: FormData[] = [];
  private nextNumber = 100;
  private nextComment = 1;
  clock: () => number = () => NOW;

  addIssue(partial: Partial<FakeIssue> & { body: string }): FakeIssue {
    const n = this.nextNumber++;
    const iso = new Date(this.clock()).toISOString();
    const issue: FakeIssue = {
      number: n,
      html_url: `https://github.com/YassSoliman/idleon-forge/issues/${n}`,
      state: 'open',
      state_reason: null,
      title: 'x',
      created_at: iso,
      updated_at: iso,
      user: { login: BOT_LOGIN },
      labels: [{ name: 'suggestion' }],
      comments: [],
      ...partial,
    };
    this.issues.push(issue);
    return issue;
  }

  addComment(
    issue: FakeIssue,
    body: string,
    author: FakeComment['author'] = YASSER,
    extra: Partial<FakeComment> = {},
  ): FakeComment {
    const c: FakeComment = {
      id: this.nextComment++,
      body,
      createdAt: new Date(this.clock()).toISOString(),
      author,
      lastEditedAt: null,
      editor: null,
      ...extra,
    };
    issue.comments.push(c);
    return c;
  }

  labelsOf(n: number): string[] {
    const issue = this.issues.find((i) => i.number === n);
    return issue ? issue.labels.map((l) => (typeof l === 'string' ? l : l.name)) : [];
  }

  private json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }

  fetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
    const method = init.method ?? 'GET';
    const url = new URL(input);
    const key = `${method} ${url.pathname}`;
    this.calls.push(key);
    if (this.failOn?.match.test(key)) {
      const status = this.failOn.status;
      this.failOn = null;
      return this.json({ message: 'injected' }, status);
    }
    if (url.hostname === 'challenges.cloudflare.com') {
      this.siteverifyBodies.push(init.body as FormData);
      return this.json({
        success: this.turnstilePass,
        action: this.turnstileAction,
        hostname: this.turnstileHostname,
      });
    }
    if (url.hostname !== 'api.github.com') throw new Error(`unexpected fetch ${input}`);
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    const p = url.pathname;
    if (/^\/app\/installations\/\d+\/access_tokens$/.test(p)) {
      return this.json(
        { token: 'ghs_test', expires_at: new Date(this.clock() + 3600_000).toISOString() },
        201,
      );
    }
    const base = '/repos/YassSoliman/idleon-forge';
    if (method === 'GET' && p === `${base}/issues`) {
      const page = Number(url.searchParams.get('page') ?? '1');
      const creator = url.searchParams.get('creator');
      const list = this.issues
        .filter((i) => i.user?.login === creator)
        .filter((i) => this.labelsOf(i.number).includes(url.searchParams.get('labels') ?? ''))
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice((page - 1) * 100, page * 100)
        .map(({ comments: _c, ...rest }) => rest);
      return this.json(list);
    }
    const one = new RegExp(`^${base}/issues/(\\d+)$`).exec(p);
    if (method === 'GET' && one) {
      const issue = this.issues.find((i) => i.number === Number(one[1]));
      if (!issue) return this.json({ message: 'Not Found' }, 404);
      const { comments: _c, ...rest } = issue;
      return this.json(rest);
    }
    if (method === 'POST' && p === `${base}/issues`) {
      const issue = this.addIssue({
        title: body.title,
        body: body.body,
        labels: body.labels.map((name: string) => ({ name })),
      });
      const { comments: _c, ...rest } = issue;
      return this.json(rest, 201);
    }
    const sub = new RegExp(`^${base}/issues/(\\d+)/(comments|labels)(?:/(.+))?$`).exec(p);
    if (sub) {
      const issue = this.issues.find((i) => i.number === Number(sub[1]));
      if (!issue) return this.json({ message: 'Not Found' }, 404);
      if (sub[2] === 'comments' && method === 'POST') {
        const c = this.addComment(issue, body.body, BOT_ACTOR);
        return this.json({ id: c.id, created_at: c.createdAt }, 201);
      }
      if (sub[2] === 'labels' && method === 'POST') {
        for (const name of body.labels)
          if (!this.labelsOf(issue.number).includes(name)) issue.labels.push({ name });
        return this.json(issue.labels);
      }
      if (sub[2] === 'labels' && method === 'DELETE' && sub[3]) {
        const name = decodeURIComponent(sub[3]);
        if (!this.labelsOf(issue.number).includes(name))
          return this.json({ message: 'Label does not exist' }, 404);
        issue.labels = issue.labels.filter((l) => (typeof l === 'string' ? l : l.name) !== name);
        return this.json(issue.labels);
      }
    }
    if (method === 'POST' && p === '/graphql') {
      const issue = this.issues.find((i) => i.number === body.variables.number);
      const actor = (a: FakeComment['author'] | null) =>
        a ? { __typename: a.typename, login: a.login, databaseId: a.id } : null;
      return this.json({
        data: {
          repository: {
            issue: issue
              ? {
                  comments: {
                    nodes: issue.comments.map((c) => ({
                      databaseId: c.id,
                      body: c.body,
                      createdAt: c.createdAt,
                      lastEditedAt: c.lastEditedAt,
                      author: actor(c.author),
                      editor: actor(c.editor),
                    })),
                  },
                }
              : null,
          },
        },
      });
    }
    throw new Error(`fake GitHub: unhandled ${key}`);
  };
}

export class FakeLimiter implements RateLimiter {
  counts = new Map<string, number>();
  constructor(private readonly max: number) {}
  async limit({ key }: { key: string }) {
    const n = (this.counts.get(key) ?? 0) + 1;
    this.counts.set(key, n);
    return { success: n <= this.max };
  }
}

export async function testEnv(overrides: Partial<Env> = {}): Promise<Env> {
  const pair = await rsaKeyPair();
  return {
    SUGGESTIONS_ENABLED: 'true',
    SUGGESTIONS_PAUSED: 'false',
    GH_APP_ID: '123',
    GH_INSTALLATION_ID: '456',
    GH_APP_PRIVATE_KEY: await pkcs8Pem(pair.privateKey),
    TURNSTILE_SECRET: 'turnstile-secret',
    SUGGESTER_PEPPER: 'pepper',
    MAINTAINER_IDS: String(YASSER.id),
    ...overrides,
  };
}

export function suggestion(overrides: Partial<SuggestionRequest> = {}): Omit<SuggestionRequest, 'proof'> {
  return {
    clientId: crypto.randomUUID(),
    type: 'idea',
    text: { whenIm: 'checking the Now screen', iWant: 'a way to pin one character', soThat: '', example: '' },
    context: {
      schema: 1,
      build: {
        app: '2026.10.21-3f9c2ab',
        commit: '3f9c2ab',
        channel: 'production',
        knowledge: 'kb-1',
        parsers: { toolboxCommit: '6c37e3d', toolboxVersion: '1.0.0', gameVersion: '2.3.540' },
      },
      gameBuild: 540,
      stage: 'W2-mid',
      screen: 'now',
      saveAgeSeconds: 30,
      browser: 'chrome',
    },
    turnstileToken: 'turnstile-token',
    ...overrides,
  };
}
