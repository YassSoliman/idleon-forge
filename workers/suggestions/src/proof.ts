// SPDX-License-Identifier: GPL-3.0-only
// Proof of sign-in (M13 TR-4, D1): a Firebase ID token for the game's project that expired at least a
// minute ago (the client waits 15). Google's signature proves Google issued it for that uid recently,
// while Firebase and Firestore already refuse it, so the Worker never holds a key to a player's save.
// Only `sub` is read; the token is discarded and never logged or echoed.

import { base64UrlToBytes, utf8Bytes } from './encoding';
import { importCertificateKey } from './x509';

export const FIREBASE_PROJECT = 'idlemmo';
export const GOOGLE_X509_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
/** Oldest accepted proof, after `exp` (one constant so a key-rotation change is one edit). */
export const PROOF_MAX_AGE_SECONDS = 7 * 24 * 3600;
/** A token must have expired at least this long ago, by the Worker's clock. */
export const LIVE_TOKEN_MARGIN_SECONDS = 60;
/** Unknown `kid`s trigger at most one refetch per isolate in this window. */
export const KEY_REFETCH_MIN_MS = 5 * 60 * 1000;
export const ALLOWED_PROVIDERS = ['google.com', 'custom'] as const;

export type ProofFailure =
  | 'proof_missing'
  | 'proof_invalid'
  | 'live_token'
  | 'proof_too_old'
  | 'proof_unknown_key'
  | 'provider_not_allowed';

export type ProofResult = { ok: true; sub: string } | { ok: false; code: ProofFailure };

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

/** Google's signing keys, cached for the response's max-age, refetched on an unknown kid (rate-limited). */
export class GoogleKeys {
  private keys = new Map<string, CryptoKey>();
  private expiresAt = 0;
  private lastFetch = Number.NEGATIVE_INFINITY;
  private inflight: Promise<void> | null = null;

  constructor(
    private readonly fetchFn: Fetch,
    private readonly clock: () => number = Date.now,
    private readonly url = GOOGLE_X509_URL,
  ) {}

  async get(kid: string): Promise<CryptoKey | undefined> {
    const now = this.clock();
    if (now >= this.expiresAt && now - this.lastFetch >= 1000) await this.refresh();
    else if (!this.keys.has(kid) && now - this.lastFetch >= KEY_REFETCH_MIN_MS) await this.refresh();
    return this.keys.get(kid);
  }

  private refresh(): Promise<void> {
    this.inflight ??= this.load().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async load(): Promise<void> {
    this.lastFetch = this.clock();
    const res = await this.fetchFn(this.url);
    if (!res.ok) throw new Error(`google keys: HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, unknown>;
    const next = new Map<string, CryptoKey>();
    for (const [kid, pem] of Object.entries(json)) {
      if (typeof pem === 'string') next.set(kid, await importCertificateKey(pem));
    }
    this.keys = next;
    const maxAge = /max-age=(\d+)/.exec(res.headers.get('cache-control') ?? '')?.[1];
    this.expiresAt = this.clock() + (maxAge ? Number(maxAge) : 3600) * 1000;
  }
}

function decodeJson(segment: string): Record<string, unknown> | null {
  const bytes = base64UrlToBytes(segment);
  if (!bytes) return null;
  try {
    const v = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export interface VerifyOptions {
  keys: { get(kid: string): Promise<CryptoKey | undefined> };
  /** Milliseconds since the epoch. */
  now: number;
  project?: string;
}

/** The check order from TR-4. Key-endpoint outages throw; the caller answers 503. */
export async function verifyProof(token: string | undefined, opts: VerifyOptions): Promise<ProofResult> {
  if (!token) return { ok: false, code: 'proof_missing' };
  const project = opts.project ?? FIREBASE_PROJECT;
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, code: 'proof_invalid' };
  const [h, p, s] = parts as [string, string, string];
  const header = decodeJson(h);
  const payload = decodeJson(p);
  const signature = base64UrlToBytes(s);
  if (!header || !payload || !signature) return { ok: false, code: 'proof_invalid' };
  if (header.alg !== 'RS256' || typeof header.kid !== 'string') return { ok: false, code: 'proof_invalid' };

  const key = await opts.keys.get(header.kid);
  if (!key) return { ok: false, code: 'proof_unknown_key' };
  const valid = await crypto.subtle.verify(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    signature,
    utf8Bytes(`${h}.${p}`),
  );
  if (!valid) return { ok: false, code: 'proof_invalid' };

  const now = Math.floor(opts.now / 1000);
  const { aud, iss, sub, auth_time, iat, exp } = payload;
  if (aud !== project || iss !== `https://securetoken.google.com/${project}`) {
    return { ok: false, code: 'proof_invalid' };
  }
  if (typeof sub !== 'string' || sub.length === 0 || sub.length > 128)
    return { ok: false, code: 'proof_invalid' };
  if (!isNum(auth_time) || !isNum(iat) || !isNum(exp)) return { ok: false, code: 'proof_invalid' };
  if (!(auth_time <= iat && iat <= exp) || iat > now) return { ok: false, code: 'proof_invalid' };
  if (exp > now - LIVE_TOKEN_MARGIN_SECONDS) return { ok: false, code: 'live_token' };
  if (exp < now - PROOF_MAX_AGE_SECONDS) return { ok: false, code: 'proof_too_old' };
  const firebase = payload.firebase as Record<string, unknown> | undefined;
  const provider = firebase && typeof firebase === 'object' ? firebase.sign_in_provider : undefined;
  if (!(ALLOWED_PROVIDERS as readonly unknown[]).includes(provider)) {
    return { ok: false, code: 'provider_not_allowed' };
  }
  return { ok: true, sub };
}
