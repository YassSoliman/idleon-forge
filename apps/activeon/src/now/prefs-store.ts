// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Now screen's preferences in localStorage (M10 TR-8): namespaced per account
// (`activeon:<uidHash>:`, or `activeon:paste:<h>:` for a pasted account), guarded on every access,
// merged per key on write so two tabs don't lose each other's skips, synced across tabs through the
// `storage` event, and dropped when another tab clears (BroadcastChannel 'activeon').
import {
  EMPTY_PREFS,
  type NowPrefs,
  PREFS_CAP,
  pruneDismissals,
  pruneSkips,
  type SessionClock,
  type SkipEntry,
} from '@idleon-forge/engine/now';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface StoredExpectedReturn {
  seconds: number;
  chosenAt: number;
}
export interface StoredVisitOrder {
  sessionStartedAt: number | null;
  order: number[];
}

export interface PrefsData {
  skips: Record<string, SkipEntry>;
  dismissals: Record<string, number | null>;
  expectedReturn: StoredExpectedReturn | null;
  visitOrder: StoredVisitOrder | null;
}

const EMPTY: PrefsData = { skips: {}, dismissals: {}, expectedReturn: null, visitOrder: null };
const KEYS = ['skips', 'dismissals', 'expectedReturn', 'visitOrder'] as const;

const local = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

function read<T>(ns: string, key: string, fallback: T): T {
  try {
    const raw = local()?.getItem(`${ns}${key}`);
    if (!raw) return fallback;
    const v: unknown = JSON.parse(raw);
    return v === null || typeof v !== 'object' ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

function write(ns: string, key: string, value: unknown): boolean {
  try {
    const s = local();
    if (!s) return false;
    if (value === null) s.removeItem(`${ns}${key}`);
    else s.setItem(`${ns}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadPrefs(ns: string): PrefsData {
  return {
    skips: read(ns, 'skips', {}),
    dismissals: read(ns, 'dismissals', {}),
    expectedReturn: read<StoredExpectedReturn | null>(ns, 'expectedReturn', null),
    visitOrder: read<StoredVisitOrder | null>(ns, 'visitOrder', null),
  };
}

/** Whether this browser lets us keep preferences (else: in memory, with a footer note). */
export function storageWorks(): boolean {
  try {
    const s = local();
    if (!s) return false;
    s.setItem('activeon:probe', '1');
    s.removeItem('activeon:probe');
    return true;
  } catch {
    return false;
  }
}

/** Keeps the newest `PREFS_CAP` entries of a map (insertion order is oldest first). */
const capped = <T>(m: Record<string, T>): Record<string, T> => {
  const e = Object.entries(m);
  return e.length > PREFS_CAP ? Object.fromEntries(e.slice(-PREFS_CAP)) : m;
};

/** 12 hex characters of SHA-256 (the paste-mode namespace hash, TR-8). Computed on the device only. */
export async function shortHash(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface NowPrefsStore {
  /** False until the namespace is known and loaded: the first advice render waits (TR-8). */
  ready: boolean;
  /** False when localStorage is blocked: choices live in memory only. */
  persistent: boolean;
  data: PrefsData;
  skip(key: string, entry: SkipEntry): void;
  unskip(keys: string[]): void;
  dismiss(key: string, build: number | null): void;
  undismiss(keys: string[]): void;
  setExpectedReturn(v: StoredExpectedReturn | null): void;
  setVisitOrder(v: StoredVisitOrder): void;
  /** Prunes expired skips and dismissals from older builds (TR-8, on load). */
  prune(clock: SessionClock, build: number | null): void;
}

export function useNowPrefsStore(ns: string | null): NowPrefsStore {
  const [data, setData] = useState<PrefsData>(EMPTY);
  const [ready, setReady] = useState(false);
  const persistent = useMemo(storageWorks, []);
  const cleared = useRef(false);
  const nsRef = useRef(ns);
  nsRef.current = ns;

  useEffect(() => {
    cleared.current = false;
    if (ns === null) {
      setData(EMPTY);
      setReady(false);
      return;
    }
    setData(loadPrefs(ns));
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key.startsWith(ns)) setData(loadPrefs(ns));
    };
    window.addEventListener('storage', onStorage);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('activeon');
      channel.onmessage = (m) => {
        if (m.data !== 'cleared') return;
        cleared.current = true; // another tab cleared: drop ours and stop writing
        setData(EMPTY);
      };
    } catch {}
    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
    };
  }, [ns]);

  /** Re-reads the stored map, applies `edit`, writes it back: a per-key merge with other tabs. */
  const update = useCallback(
    <K extends (typeof KEYS)[number]>(key: K, edit: (v: PrefsData[K]) => PrefsData[K]) => {
      const space = nsRef.current;
      setData((prev) => {
        const base = space && !cleared.current ? loadPrefs(space)[key] : prev[key];
        const next = edit(base ?? (EMPTY[key] as PrefsData[K]));
        if (space && !cleared.current) write(space, key, next);
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  return useMemo(
    () => ({
      ready,
      persistent,
      data,
      skip: (key, entry) => update('skips', (m) => capped({ ...m, [key]: entry })),
      unskip: (keys) =>
        update('skips', (m) => Object.fromEntries(Object.entries(m).filter(([k]) => !keys.includes(k)))),
      dismiss: (key, build) => update('dismissals', (m) => capped({ ...m, [key]: build })),
      undismiss: (keys) =>
        update('dismissals', (m) => Object.fromEntries(Object.entries(m).filter(([k]) => !keys.includes(k)))),
      setExpectedReturn: (v) => update('expectedReturn', () => v),
      setVisitOrder: (v) => update('visitOrder', () => v),
      prune: (clock, build) => {
        update('skips', (m) => pruneSkips(m, clock));
        update('dismissals', (m) => pruneDismissals(m, build));
      },
    }),
    [ready, persistent, data, update],
  );
}

export const toNowPrefs = (d: PrefsData, seenKeys: readonly string[] | null): NowPrefs => ({
  ...EMPTY_PREFS,
  skips: d.skips,
  dismissals: d.dismissals,
  seenKeys,
});
