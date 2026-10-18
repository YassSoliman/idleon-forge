// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 TR-3: the route grammar. The whole route lives in the URL fragment, one bare anchor (FR-7):
//   none, #now           Now
//   #characters          Characters (#builds, #cards, #skills: Characters scrolled to that overview)
//   #<tab>-<index>       the Character page of CharacterState.index on that tab (#now-3, #build-3)
//   #systems             the Systems hub
//   #system-<systemId>   that System page
//   #timeline            the Timeline (Phase 2; opens Now until then)
// Legacy `?c=<i>` links are read once and rewritten (D-2). Anything unknown opens Now and leaves the
// URL as it was, so M10's in-page anchors (#spend-plan) still scroll. Pure and total.

export type Route =
  | { place: 'now' }
  | { place: 'characters'; section: 'builds' | 'cards' | 'skills' | null }
  | { place: 'character'; index: number; tab: string }
  | { place: 'systems' }
  | { place: 'system'; id: string }
  | { place: 'timeline' };

/** The four places of the shell (FR-1); a Character page or a System page belongs to one of them. */
export type Place = 'now' | 'characters' | 'systems' | 'timeline';

export interface KnownRoutes {
  /** Registered Character page tab ids (`character-tabs.ts`), "now" among them. */
  tabs: readonly string[];
  /** Game System ids with a page (the registry's `kind: game` rows). */
  systems: readonly string[];
  /** CharacterState.index values in the save. */
  indexes: readonly number[];
  /** Phase 2. */
  timeline: boolean;
}

const NOW: Route = { place: 'now' };
const PLACE_RE = /^#(now|characters|systems|timeline)$/;
const SECTION_RE = /^#(builds|cards|skills)$/;
const SYSTEM_RE = /^#system-([a-z0-9-]+)$/;
const TAB_RE = /^#([a-z]+)-(\d+)$/;
const LEGACY_C = /^\d+$/;

/** The route of one fragment, against what the app knows; Now for anything else (FR-7). */
export function routeOfHash(hash: string, known: KnownRoutes): Route {
  const place = PLACE_RE.exec(hash)?.[1];
  if (place === 'now' || hash === '' || hash === '#') return NOW;
  if (place === 'characters') return { place: 'characters', section: null };
  if (place === 'systems') return { place: 'systems' };
  if (place === 'timeline') return known.timeline ? { place: 'timeline' } : NOW;
  const section = SECTION_RE.exec(hash)?.[1];
  if (section === 'builds' || section === 'cards' || section === 'skills')
    return { place: 'characters', section };
  const system = SYSTEM_RE.exec(hash)?.[1];
  if (system !== undefined) return known.systems.includes(system) ? { place: 'system', id: system } : NOW;
  const tab = TAB_RE.exec(hash);
  if (tab?.[1] && tab[2] !== undefined) {
    const index = Number(tab[2]);
    if (known.tabs.includes(tab[1]) && known.indexes.includes(index))
      return { place: 'character', index, tab: tab[1] };
  }
  return NOW;
}

/**
 * The route of a URL's fragment and query. `rewrite` is the fragment that replaces a legacy `?c=`
 * (`?c=3` → `#now-3`, `?c=3#build-3` → `#build-3`), once, by `history.replaceState`; null otherwise.
 */
export function parseRoute(
  hash: string,
  search: string,
  known: KnownRoutes,
): { route: Route; rewrite: string | null } {
  let c: string | null = null;
  try {
    c = new URLSearchParams(search).get('c');
  } catch {
    c = null;
  }
  if (c !== null && LEGACY_C.test(c)) {
    const tab = TAB_RE.exec(hash);
    const rewrite = tab && tab[2] === c ? hash : `#now-${c}`;
    return { route: routeOfHash(rewrite, known), rewrite };
  }
  return { route: routeOfHash(hash, known), rewrite: null };
}

/** The fragment of a route: '#now', '#build-3', '#system-refinery' … */
export function formatRoute(route: Route): string {
  switch (route.place) {
    case 'now':
      return '#now';
    case 'characters':
      return route.section ? `#${route.section}` : '#characters';
    case 'character':
      return `#${route.tab}-${route.index}`;
    case 'systems':
      return '#systems';
    case 'system':
      return `#system-${route.id}`;
    case 'timeline':
      return '#timeline';
  }
}

/** The place a route shows, before FR-4's "opened from" rule for Character pages. */
export function placeOf(route: Route): Place {
  switch (route.place) {
    case 'character':
    case 'now':
      return 'now';
    case 'system':
    case 'systems':
      return 'systems';
    default:
      return route.place;
  }
}

/** One key per screen, for per-place scroll (FR-10). */
export const routeKey = (route: Route): string =>
  route.place === 'characters' ? '#characters' : formatRoute(route);

/** The same screen? (A Character page is one screen per character and tab.) */
export const sameRoute = (a: Route, b: Route): boolean => formatRoute(a) === formatRoute(b);
