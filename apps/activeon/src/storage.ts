// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What ActiveOn keeps in localStorage besides the Firebase session and save history (whose
// per-account clear lives in @idleon-forge/sync).
// Every access is guarded: storage can be missing or throw (private windows, blocked site data).

/** Every ActiveOn localStorage key starts with this. */
export const STORAGE_PREFIX = 'activeon:';
const SESSION_FLAG = `${STORAGE_PREFIX}had-session`;

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
