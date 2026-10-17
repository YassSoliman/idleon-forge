// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The M12 contracts the Now screen renders: BuildInfo (footer, Preview badge, reports), What's new
// (M12 TR-8), the stale-tab check (TR-9) and the chunk-load check (TR-10).
/// <reference types="@idleon-forge/release/global" />
import type { BuildInfo, WhatsNewEntry, WhatsNewFeed, WhatsNewSection } from '@idleon-forge/release';
import { useCallback, useEffect, useState } from 'react';

const FALLBACK: BuildInfo = {
  schema: 1,
  app: 'local',
  commit: 'unknown',
  builtFrom: '1970-01-01T00:00:00Z',
  channel: 'local',
  knowledge: 'unknown',
  parsers: { toolboxCommit: 'unknown', toolboxVersion: 'unknown', gameVersion: 'unknown' },
};

/** `__BUILD_INFO__`, compiled in by vite.config.ts (M12 TR-3). */
export const buildInfo: BuildInfo = typeof __BUILD_INFO__ === 'undefined' ? FALLBACK : __BUILD_INFO__;

/** M12 FR-11: "Preview of PR #N, not the live app", or null in production. */
export const previewBadge = (b: BuildInfo = buildInfo): string | null =>
  b.channel === 'preview' ? `Preview of PR #${b.pr ?? '?'}, not the live app` : null;

// ---- What's new (M12 TR-8) ----

export const WHATS_NEW_KEY = 'activeon.whatsNew.lastSeen';
export const WHATS_NEW_MAX = 10;
export const COMMITS_URL = 'https://github.com/YassSoliman/idleon-forge/commits/main';

export interface LastSeen {
  id: string;
  date: string;
}

export const SECTION_TITLES: Record<WhatsNewSection, string> = {
  advice: 'Advice changes',
  'game-patch': 'Game patch support',
  app: 'App changes',
};

export interface WhatsNewView {
  groups: { section: WhatsNewSection; title: string; entries: WhatsNewEntry[] }[];
  /** "and N more" beyond the first 10. */
  more: number;
  newest: LastSeen;
}

/** What to show, given the feed and what this browser saw last. Null: nothing (first visit, or nothing new). */
export function whatsNewFor(feed: WhatsNewFeed, lastSeen: LastSeen | null): WhatsNewView | null {
  const [newest] = feed.entries;
  if (!newest || lastSeen === null) return null;
  const at = feed.entries.findIndex((e) => e.id === lastSeen.id);
  const unseen = at >= 0 ? feed.entries.slice(0, at) : feed.entries.filter((e) => e.date > lastSeen.date);
  if (unseen.length === 0) return null;
  const shown = unseen.slice(0, WHATS_NEW_MAX);
  const groups = (['advice', 'game-patch', 'app'] as const)
    .map((section) => ({
      section,
      title: SECTION_TITLES[section],
      entries: shown.filter((e) => e.section === section),
    }))
    .filter((g) => g.entries.length > 0);
  return { groups, more: unseen.length - shown.length, newest: { id: newest.id, date: newest.date } };
}

const readLastSeen = (): LastSeen | null | 'unavailable' => {
  try {
    const raw = localStorage.getItem(WHATS_NEW_KEY);
    if (raw === null) return null;
    const v = JSON.parse(raw) as Partial<LastSeen>;
    return typeof v.id === 'string' && typeof v.date === 'string' ? { id: v.id, date: v.date } : null;
  } catch {
    return 'unavailable';
  }
};

const writeLastSeen = (v: LastSeen): boolean => {
  try {
    localStorage.setItem(WHATS_NEW_KEY, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};

export const forgetWhatsNew = () => {
  try {
    localStorage.removeItem(WHATS_NEW_KEY);
  } catch {}
};

const isFeed = (v: unknown): v is WhatsNewFeed =>
  typeof v === 'object' && v !== null && Array.isArray((v as WhatsNewFeed).entries);

/** The What's new card: once per new set of entries, never on a first visit (FR-37, M12 FR-23). */
export function useWhatsNew(fetchFeed: () => Promise<unknown> = defaultFetchFeed) {
  const [view, setView] = useState<WhatsNewView | null>(null);
  useEffect(() => {
    let active = true;
    void fetchFeed()
      .then((feed) => {
        if (!active || !isFeed(feed)) return; // missing or corrupt: skipped silently (§6)
        const seen = readLastSeen();
        if (seen === 'unavailable') return; // storage fails: never shown (TR-8)
        const [newest] = feed.entries;
        if (seen === null) {
          if (newest) writeLastSeen({ id: newest.id, date: newest.date });
          return;
        }
        setView(whatsNewFor(feed, seen));
      })
      .catch(() => {});
    const onStorage = (e: StorageEvent) => {
      if (e.key === WHATS_NEW_KEY) setView(null); // dismissed in another tab
    };
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [fetchFeed]);
  const dismiss = useCallback(() => {
    setView((v) => {
      if (v) writeLastSeen(v.newest);
      return null;
    });
  }, []);
  return { view, dismiss };
}

async function defaultFetchFeed(): Promise<unknown> {
  const res = await fetch('/whats-new.json', { cache: 'no-cache' });
  return res.ok ? res.json() : null;
}

// ---- stale tab (TR-9) and chunk load (TR-10) ----

export type UpdateReason = 'newer-build' | 'chunk-load-failed';
export const UPDATE_TEXT: Record<UpdateReason, string> = {
  'newer-build': 'A different version of ActiveOn is live. Reload to switch',
  'chunk-load-failed': 'ActiveOn was updated. Reload to continue',
};

/** Whether `/version.json` names another commit than this build. Failures are silent (false). */
export async function liveBuildDiffers(info: BuildInfo = buildInfo): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return false;
    const v = (await res.json()) as { commit?: unknown };
    return typeof v.commit === 'string' && v.commit !== info.commit;
  } catch {
    return false;
  }
}

const CHECK_EVERY_MS = 15 * 60_000;
const MIN_GAP_MS = 60_000;

/** M12 FR-24: learns about a newer build within 15 minutes or on focus. Never reloads by itself. */
export function useUpdateAvailable(check: () => Promise<boolean> = liveBuildDiffers) {
  const [reason, setReason] = useState<UpdateReason | null>(null);
  useEffect(() => {
    if (buildInfo.channel === 'local') return;
    let last = 0;
    let active = true;
    const run = () => {
      const now = Date.now();
      if (now - last < MIN_GAP_MS) return;
      last = now;
      void check().then((differs) => {
        if (active && differs) setReason((r) => r ?? 'newer-build');
      });
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') run();
    }, CHECK_EVERY_MS);
    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [check]);
  const chunkLoadFailed = useCallback(() => setReason('chunk-load-failed'), []);
  return { reason, text: reason ? UPDATE_TEXT[reason] : null, chunkLoadFailed };
}
