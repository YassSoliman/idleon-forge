// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Staleness (M11 FR-19, TR-11). "Current" is always the parser pin's game version, never the save's.
import type { Entry, SourceT } from './schema';

/** Entries are Stale this many game versions (on the deduplicated patch list) behind the current one. */
export const STALE_AFTER_VERSIONS = 10;

/** -1, 0, 1 for `a` before, equal to, after `b` (dotted integer versions such as 2.3.540). */
export function compareGameVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0 ? -1 : 1;
  }
  return 0;
}

/**
 * Index of `version` on `patches` (ordered, oldest first): the newest listed version at or below it, so
 * a Source verified on an unlisted in-game version (2.3.535) still counts. -1 when it predates the list.
 */
export function patchIndex(version: string, patches: readonly string[]): number {
  let found = -1;
  for (let i = 0; i < patches.length; i++) {
    if (compareGameVersions(patches[i] as string, version) <= 0) found = i;
    else break;
  }
  return found;
}

const isGenerated = (e: Entry): boolean => 'origin' in e && e.origin === 'generated';

/** The entry's own authored Sources (plus, for a contested entry, its sides'). Never inherited ones (FR-19). */
export function ownSources(e: Entry): SourceT[] {
  return [...e.sources, ...(e.contested?.sides.flatMap((s) => s.sources) ?? [])];
}

/** The newest game version among `sources`, or null when there are none. */
export function newestVersion(sources: readonly SourceT[]): string | null {
  let best: string | null = null;
  for (const s of sources)
    if (best === null || compareGameVersions(s.gameVersion, best) > 0) best = s.gameVersion;
  return best;
}

/**
 * Whether `entry` is Stale at `currentGameVersion` (FR-19): its `stale` block is set (and flagged at
 * or before the current version), or its newest own Source is 10 or more versions back on `patches`.
 * Generated entries are never Stale by age: they are rebuilt at every sync.
 */
export function isStale(entry: Entry, currentGameVersion: string, patches: readonly string[]): boolean {
  if (isGenerated(entry)) return false;
  if (entry.stale && compareGameVersions(entry.stale.flaggedAt, currentGameVersion) <= 0) return true;
  const newest = newestVersion(ownSources(entry));
  if (newest === null) return false;
  const cur = patchIndex(currentGameVersion, patches);
  const src = patchIndex(newest, patches);
  if (cur < 0) return false;
  // A Source older than the whole patch list is as stale as the list is long.
  return cur - src >= STALE_AFTER_VERSIONS;
}
