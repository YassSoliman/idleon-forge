// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Suggestions' own storage on this device (M13 TR-9): the draft (FR-8), the outbox (FR-12), the last
// "Your suggestions" list (shown "as of" while no proof is ready), the items just sent, and the owner.
// One IndexedDB database, `activeon-suggestions`, with one key-value store; memory when it can't open.
// Signing out, or signing in as another account, clears all of it.
import type {
  MySuggestion,
  ReportContext,
  SuggestionText,
  SuggestionType,
} from '@idleon-forge/suggestions-worker/contract';

/** A Suggestion being written. Its report part was anonymized when the form opened. */
export interface Draft {
  clientId: string;
  type: SuggestionType;
  text: SuggestionText;
  /** The advice it reports, with every value it may attach; null for a plain Suggest. */
  report: ReportContext | null;
  /** "Attach the numbers": null until the player touches the box (FR-10). */
  attach: boolean | null;
  characterIndex: number | null;
  screen: 'now' | 'character' | 'account' | 'suggestions' | 'settings' | 'other';
  createdAt: number;
}

/** A Suggestion waiting for a proof (FR-12). The context is rebuilt when it is sent (TR-9). */
export type OutboxItem = Draft & { attachValues: boolean; savedAt: number };

export interface CachedList {
  items: MySuggestion[];
  at: number;
}

interface Shape {
  owner: string | null;
  draft: Draft | null;
  outbox: OutboxItem[];
  mine: CachedList | null;
  sent: MySuggestion[];
  /** One clientId per Add details answer, reused on retry (TR-22). */
  details: Record<string, string>;
}

const EMPTY: Shape = { owner: null, draft: null, outbox: [], mine: null, sent: [], details: {} };

export interface SuggestionsStore {
  get<K extends keyof Shape>(key: K): Promise<Shape[K]>;
  set<K extends keyof Shape>(key: K, value: Shape[K]): Promise<void>;
  clear(): Promise<void>;
  /** Subscribers hear every change made through this store (all tabs share IndexedDB, not events). */
  subscribe(cb: () => void): () => void;
}

interface Backend {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  clear(): Promise<void>;
}

function memoryBackend(): Backend {
  const m = new Map<string, unknown>();
  return {
    async get(k) {
      return structuredClone(m.get(k));
    },
    async put(k, v) {
      m.set(k, structuredClone(v));
    },
    async clear() {
      m.clear();
    },
  };
}

const DB = 'activeon-suggestions';
const KV = 'suggestions';

async function idbBackend(factory: IDBFactory): Promise<Backend> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = factory.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(KV)) req.result.createObjectStore(KV);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('blocked'));
  });
  const run = <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) =>
    new Promise<T>((resolve, reject) => {
      const tx = db.transaction(KV, mode);
      const req = fn(tx.objectStore(KV));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  return {
    get: (k) => run('readonly', (s) => s.get(k)),
    put: async (k, v) => {
      await run('readwrite', (s) => s.put(v, k));
    },
    clear: async () => {
      await run('readwrite', (s) => s.clear());
    },
  };
}

export function createSuggestionsStore(
  factory: IDBFactory | null = typeof indexedDB === 'undefined' ? null : indexedDB,
): SuggestionsStore {
  const backend: Promise<Backend> = factory
    ? idbBackend(factory).catch(() => memoryBackend())
    : Promise.resolve(memoryBackend());
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const cb of [...listeners]) cb();
  };
  return {
    async get(key) {
      try {
        const v = await (await backend).get(key);
        return (v === undefined ? structuredClone(EMPTY[key]) : v) as Shape[typeof key];
      } catch {
        return structuredClone(EMPTY[key]);
      }
    },
    async set(key, value) {
      try {
        await (await backend).put(key, value);
      } catch {}
      notify();
    },
    async clear() {
      try {
        await (await backend).clear();
      } catch {}
      notify();
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };
}

export const newClientId = (): string => crypto.randomUUID();
