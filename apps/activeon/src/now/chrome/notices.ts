// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 `flows.banners` Toast once: a notice shows once as a toast; after "Later" (or once it is read), a
// dot on the header's overflow button keeps it findable, never a banner that nags. The toasts live in
// the shell's chrome and the dot on the header, which sits outside the shell, so they share this tiny
// store. "Shown once" lasts for this tab (sessionStorage, guarded), so a reload doesn't nag again.
import { useSyncExternalStore } from 'react';

const SEEN_KEY = 'activeon:notices-seen';
let dot = false;
const listeners = new Set<() => void>();

export function setNoticeDot(on: boolean): void {
  if (dot === on) return;
  dot = on;
  for (const fn of listeners) fn();
}

/** True while a notice was dismissed but still holds (a patch the parser hasn't caught up with). */
export function useNoticeDot(): boolean {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => dot,
    () => false,
  );
}

const memory = new Set<string>();

export function seenNotices(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set([...memory, ...(Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [])]);
  } catch {
    return new Set(memory);
  }
}

export function markNoticeSeen(id: string): void {
  memory.add(id);
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seenNotices(), id]));
  } catch {}
}
