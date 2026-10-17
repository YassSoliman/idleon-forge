// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What ActiveOn keeps in this origin's storage besides the Firebase session, and how to clear it.
// Every access is guarded: storage can be missing or throw (private windows, blocked site data).

/** Every ActiveOn localStorage key starts with this. */
export const STORAGE_PREFIX = 'activeon:';
const SESSION_FLAG = `${STORAGE_PREFIX}had-session`;
/** The IndexedDB database save history will live in (M1 TR-14). */
export const HISTORY_DB = 'activeon';

const local = (): Storage | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
};

/** Marks that this browser held a session, so a later silent loss can be told apart (FR-4). */
export function rememberSession(): void {
  try {
    local()?.setItem(SESSION_FLAG, '1');
  } catch {}
}

export function hadSession(): boolean {
  try {
    return local()?.getItem(SESSION_FLAG) === '1';
  } catch {
    return false;
  }
}

export function forgetSession(): void {
  try {
    local()?.removeItem(SESSION_FLAG);
  } catch {}
}

/** Asks the browser not to evict this site's storage (FR-4). Best effort; the answer is not needed. */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.().catch(() => {});
  } catch {}
}

/** Removes ActiveOn's own data from this browser: its localStorage keys and the history database. */
export async function clearLocalData(): Promise<void> {
  const store = local();
  if (store) {
    try {
      const keys = Array.from({ length: store.length }, (_, i) => store.key(i)).filter(
        (k): k is string => k?.startsWith(STORAGE_PREFIX) ?? false,
      );
      for (const k of keys) store.removeItem(k);
    } catch {}
  }
  try {
    if (typeof indexedDB === 'undefined') return;
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase(HISTORY_DB);
      req.onsuccess = req.onerror = req.onblocked = () => resolve();
    });
  } catch {}
}
