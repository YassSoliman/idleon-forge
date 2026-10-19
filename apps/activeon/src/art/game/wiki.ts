// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// A game thing's IdleOn Wiki page from its display name: https://idleon.wiki/wiki/<Name_With_Underscores>.
// The wiki titles pages by the in-game name, so the name is the whole mapping; SPECIAL holds the few
// names whose page has another title (checked by HEAD request, see the M25 art PR).
const BASE = 'https://idleon.wiki/wiki/';

/** Display name (as the app shows it) -> the wiki's page title, where the two differ. */
const SPECIAL: Readonly<Record<string, string>> = {
  // The game's data still calls it Bumble Bee; the wiki titles it by its in-game name, Worker Bee.
  'Bumble Bee': 'Worker Bee',
  'Bumble Bee Card': 'Worker Bee Card',
};

/** The wiki page title for a display name: spaces as underscores, game underscores kept. */
export function wikiTitle(name: string): string | null {
  const clean = name.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length > 80) return null;
  return (SPECIAL[clean] ?? clean).replace(/ /g, '_');
}

/** The page URL, or null when the name can't title a page. */
export function wikiHref(name: string): string | null {
  const t = wikiTitle(name);
  return t ? `${BASE}${encodeURIComponent(t).replace(/%2F/g, '/')}` : null;
}

/** The link's accessible name. */
export const wikiLabel = (name: string) => `Open ${name.replace(/_/g, ' ').trim()} on the IdleOn Wiki`;
