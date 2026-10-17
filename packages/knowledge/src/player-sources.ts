// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Player-facing Sources (#74, owner ruling 2026-10-17): a Source link takes the player to where the
// info is documented for humans (the IdleOn Wiki, a dated guide, a forum or Discord thread, patch
// notes), never to a GitHub file. Tier 1 Sources (game data via Toolbox) stay as provenance and are
// shown as an unlinked credit. Pure and dependency-free: the Now view model imports it on the UI thread.

export interface SourceLike {
  url: string;
  tier: 1 | 2 | 3 | 4;
  /** ISO date of the claim (a wiki revision, a comment date). */
  claimDate?: string;
}

/** Code hosts: a Source here is provenance for reviewers, not a page a player reads. */
const CODE_HOST = /(^|\.)(github\.com|githubusercontent\.com)$/;

/** True for a tier 2–4 https Source that is not a code host. */
export function isPlayerSource(s: SourceLike): boolean {
  if (s.tier === 1) return false;
  try {
    const u = new URL(s.url);
    return u.protocol === 'https:' && !CODE_HOST.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * The player-facing Sources, best first: tier 2 (the wiki), then tier 3 newest claimDate first (dated
 * guides and threads), then tier 4 (patch notes and anything else). Stable within a group.
 */
export function playerSources<T extends SourceLike>(sources: readonly T[]): T[] {
  const rank = (s: T) => (s.tier === 2 ? 0 : s.tier === 3 ? 1 : 2);
  return sources
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => isPlayerSource(s))
    .sort((a, b) => {
      const r = rank(a.s) - rank(b.s);
      if (r !== 0) return r;
      if (a.s.tier === 3) {
        const d = (b.s.claimDate ?? '').localeCompare(a.s.claimDate ?? '');
        if (d !== 0) return d;
      }
      return a.i - b.i;
    })
    .map(({ s }) => s);
}
