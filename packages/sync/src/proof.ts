// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Proof of sign-in for Suggestions (M13 TR-4, D1): an ID token that expired at least 15 minutes ago.
// Firebase and Firestore reject it, so it opens nothing, but its signature still proves Google issued
// it for that uid recently. We keep the 3 newest ID tokens Firebase hands us (one slot always holds
// the live token) in this origin's IndexedDB, next to where Firebase already keeps the live token
// and the refresh token, so this adds no new exposure.
//
// The client guard is the only real defence: a live token must never leave the browser. So the local
// clock is never trusted. `googleNow = Date.now() + (iat − receivedAt)` of the newest token, and a
// token is a proof only when `exp ≤ googleNow − 15 min`.

/** How many of the newest ID tokens are kept. */
export const PROOF_RING_SIZE = 3;
/** A token is a proof only this long after it expired, by Google's clock. */
export const PROOF_MIN_EXPIRED_MS = 15 * 60 * 1000;

export interface TokenEntry {
  token: string;
  /** The token's subject (the Firebase uid), so a different account's tokens are never mixed in. */
  sub: string;
  /** Issued at, epoch seconds (Google's clock). */
  iat: number;
  /** Expires at, epoch seconds (Google's clock). */
  exp: number;
  /** When it reached us, epoch ms (local clock). */
  receivedAt: number;
}

/** Where the ring lives. */
export interface ProofStore {
  load(): Promise<TokenEntry[]>;
  save(entries: TokenEntry[]): Promise<void>;
}

const b64urlJson = (part: string): unknown => {
  const b64 = part
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

/** Reads `sub`, `iat` and `exp` from a JWT without verifying it (the Worker verifies). */
export function readTokenTimes(token: string): { sub: string; iat: number; exp: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const p = b64urlJson(parts[1]) as Record<string, unknown>;
    const { sub, iat, exp } = p;
    if (typeof sub !== 'string' || sub === '') return null;
    if (
      typeof iat !== 'number' ||
      typeof exp !== 'number' ||
      !Number.isFinite(iat) ||
      !Number.isFinite(exp)
    ) {
      return null;
    }
    return { sub, iat, exp };
  } catch {
    return null;
  }
}

/** Google's clock minus ours, from the newest token (ms). */
const offsetOf = (entries: TokenEntry[]): number | null => {
  const newest = entries.reduce<TokenEntry | null>((a, e) => (a === null || e.iat > a.iat ? e : a), null);
  return newest ? newest.iat * 1000 - newest.receivedAt : null;
};

/** The newest entry that is a proof at local time `now`, or null. Never a live token. */
export function pickProof(entries: TokenEntry[], now: number): TokenEntry | null {
  const offset = offsetOf(entries);
  if (offset === null) return null;
  const googleNow = now + offset;
  const usable = entries.filter((e) => e.exp * 1000 <= googleNow - PROOF_MIN_EXPIRED_MS);
  return usable.reduce<TokenEntry | null>((a, e) => (a === null || e.exp > a.exp ? e : a), null);
}

/** Local time at which the next entry becomes a proof, or null when none is pending. */
function nextReadyAt(entries: TokenEntry[], now: number): number | null {
  const offset = offsetOf(entries);
  if (offset === null) return null;
  const times = entries
    .map((e) => e.exp * 1000 + PROOF_MIN_EXPIRED_MS - offset)
    .filter((t) => t > now)
    .sort((a, b) => a - b);
  return times[0] ?? null;
}

export interface ProofRing {
  /** Adds a token Firebase just issued. A token for another account resets the ring. */
  record(token: string): Promise<void>;
  /** An ID token that expired at least 15 minutes ago (Google's clock), or null. */
  getSignInProof(): Promise<string | null>;
  /** Calls `cb` once a proof is (or becomes) available in this tab. Returns an unsubscribe. */
  onProofReady(cb: (proof: string) => void): () => void;
  /** Forgets every token (on sign-out). */
  clear(): Promise<void>;
}

export interface ProofRingOptions {
  store?: ProofStore;
  clock?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (handle: unknown) => void;
}

export function memoryProofStore(): ProofStore {
  let entries: TokenEntry[] = [];
  return {
    async load() {
      return entries.map((e) => ({ ...e }));
    },
    async save(next) {
      entries = next.map((e) => ({ ...e }));
    },
  };
}

export function createProofRing(options: ProofRingOptions = {}): ProofRing {
  const store = options.store ?? memoryProofStore();
  const clock = options.clock ?? Date.now;
  const setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = options.clearTimer ?? ((h) => clearTimeout(h as ReturnType<typeof setTimeout>));
  const listeners = new Set<(proof: string) => void>();
  let timer: unknown = null;

  const load = async () => {
    try {
      return await store.load();
    } catch {
      return [];
    }
  };

  const check = async () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    if (listeners.size === 0) return;
    const entries = await load();
    const now = clock();
    const proof = pickProof(entries, now);
    if (proof) {
      const fire = [...listeners];
      listeners.clear();
      for (const cb of fire) cb(proof.token);
      return;
    }
    const at = nextReadyAt(entries, now);
    if (at !== null) timer = setTimer(() => void check(), at - now + 1000);
  };

  return {
    async record(token) {
      const times = readTokenTimes(token);
      if (!times) return;
      const entries = (await load()).filter((e) => e.sub === times.sub && e.token !== token);
      entries.push({ token, ...times, receivedAt: clock() });
      entries.sort((a, b) => b.iat - a.iat);
      try {
        await store.save(entries.slice(0, PROOF_RING_SIZE));
      } catch {}
      await check();
    },
    async getSignInProof() {
      return pickProof(await load(), clock())?.token ?? null;
    },
    onProofReady(cb) {
      listeners.add(cb);
      void check();
      return () => {
        listeners.delete(cb);
      };
    },
    async clear() {
      listeners.clear();
      if (timer !== null) clearTimer(timer);
      timer = null;
      try {
        await store.save([]);
      } catch {}
    },
  };
}

const PROOF_DB = 'activeon-proof';
const RING = 'ring';

/** The ring in its own IndexedDB database (one record), or memory when IndexedDB can't be opened. */
export async function openProofStore(
  factory: IDBFactory | null = globalThis.indexedDB ?? null,
): Promise<ProofStore> {
  if (!factory) return memoryProofStore();
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = factory.open(PROOF_DB, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(RING)) req.result.createObjectStore(RING);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('blocked'));
    });
    const run = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(RING, mode);
        const req = fn(tx.objectStore(RING));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    return {
      async load() {
        const v = await run('readonly', (s) => s.get(RING));
        return Array.isArray(v) ? (v as TokenEntry[]) : [];
      },
      async save(entries) {
        await run('readwrite', (s) => s.put(entries, RING));
      },
    };
  } catch {
    return memoryProofStore();
  }
}
