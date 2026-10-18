// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 G10: the player's two display settings, kept in the account's preference namespace (M10 TR-8):
// - `times`: "In 2h 10m" (relative, the default) or "Around 20:10" (the clock), for every time the UI
//   formats itself (design/format.ts `moment`, FR-F6). Knowledge Base sentences stay relative.
// - `back`: the Expected Return as one learned line with Change (the default), or always the chips.
// The theme is per device (design/theme.ts, `activeon:theme`), not here.
// Every storage access is guarded; a write reaches every hook in this tab at once (a custom event) and
// other tabs through the `storage` event. Without storage the settings last for the visit.
import { useCallback, useEffect, useState } from 'react';
import type { TimeStyle } from '../../design/format';

export type BackMode = 'learned' | 'ask';
export interface Settings {
  times: TimeStyle;
  back: BackMode;
}

export const DEFAULT_SETTINGS: Settings = { times: 'relative', back: 'learned' };
/** Settings changed the theme: the header's sun/moon toggle re-reads it (it keeps its own state). */
export const THEME_EVENT = 'activeon:theme';
const KEY = 'settings';
const EVENT = 'activeon:settings';
/** The in-memory copy when storage can't keep it (per namespace). */
const memory = new Map<string, Settings>();

const parse = (raw: string | null): Settings => {
  try {
    const v = raw ? (JSON.parse(raw) as Partial<Settings>) : {};
    return {
      times: v.times === 'clock' ? 'clock' : 'relative',
      back: v.back === 'ask' ? 'ask' : 'learned',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export function readSettings(ns: string | null): Settings {
  if (ns === null) return DEFAULT_SETTINGS;
  const kept = memory.get(ns);
  if (kept) return kept;
  try {
    return parse(localStorage.getItem(`${ns}${KEY}`));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(ns: string | null, next: Settings): void {
  if (ns === null) return;
  try {
    localStorage.setItem(`${ns}${KEY}`, JSON.stringify(next));
    memory.delete(ns);
  } catch {
    memory.set(ns, next);
  }
  try {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: ns }));
  } catch {}
}

/** The settings for `ns`, kept in step with every other hook and tab. */
export function useSettings(ns: string | null): [Settings, (patch: Partial<Settings>) => void] {
  const [settings, setSettings] = useState<Settings>(() => readSettings(ns));
  useEffect(() => {
    setSettings(readSettings(ns));
    if (ns === null) return;
    const reread = () => setSettings(readSettings(ns));
    const onEvent = (e: Event) => {
      if ((e as CustomEvent<string>).detail === ns) reread();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === `${ns}${KEY}`) reread();
    };
    window.addEventListener(EVENT, onEvent);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      window.removeEventListener('storage', onStorage);
    };
  }, [ns]);
  const update = useCallback(
    (patch: Partial<Settings>) => writeSettings(ns, { ...readSettings(ns), ...patch }),
    [ns],
  );
  return [settings, update];
}
