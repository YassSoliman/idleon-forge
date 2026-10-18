// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views and M21 FR-M6: the navigation shell. Five places (Now, Characters, Systems, Timeline, Map),
// a bottom bar under 720 px and a side rail from 720 px (FR-2, D-5), each place one bare anchor (FR-7)
// with its pixel glyph and word. Every place but Now is its own chunk, fetched when the browser is idle. The
// banners, the progress bar and What's new are the same in every place (FR-6): area N's NowChrome slot. The session state lives
// in `useSession` (FR-10), so a place switch never re-runs the engine or loses the Play Session.
import { LINK_WORDS, NAV_WORDS } from '@idleon-forge/engine/now';
import { Suspense, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';
import { Loading, lazyPart, preloadParts } from '../lazy-part';
import { ExpectedReturnChips } from '../now/Chrome';
import { NowChrome, NowLiveRegion } from '../now/chrome/NowChrome';
import { NowActionsContext } from '../now/context';
import { NowPlace } from '../now/NowScreen';
import type { Place, Route } from './route';

// Every place but Now is its own lazy chunk (lazy-part.tsx), prefetched when the browser is idle.
const TimelinePlace = lazyPart(
  () => import('../timeline/TimelinePlace'),
  (m) => m.TimelinePlace,
);
const CharactersPlace = lazyPart(
  () => import('../characters/CharactersPlace'),
  (m) => m.CharactersPlace,
);
const SystemsHub = lazyPart(
  () => import('../systems/SystemsHub'),
  (m) => m.SystemsHub,
);
const MapPlace = lazyPart(
  () => import('../map/MapPlace'),
  (m) => m.MapPlace,
);
const SystemPage = lazyPart(
  () => import('../systems/SystemPage'),
  (m) => m.SystemPage,
);

/** The outlet's id: a plain in-page target, never a route (FR-7 leaves unknown anchors to Now). */
const CONTENT_ANCHOR = `#${'place-content'}`;

import { PLACE_NAMES, type Session, type ShellProps, useSession } from './session';

export type { NowSave, ShellProps } from './session';

export interface ShellSlots {
  /** Where the place navigation renders (App puts the slot right under the header, FR-2); inline without. */
  navSlot?: HTMLElement | null;
}

/** M21 FR-M6: each place's own pixel glyph (`v2-map-nav-*`, core art: no extra request on first load). */
const GLYPHS: Record<Place, ArtName> = {
  now: 'v2-map-nav-now',
  characters: 'v2-map-nav-chars',
  systems: 'v2-map-nav-systems',
  timeline: 'v2-map-nav-timeline',
  map: 'v2-map-nav-map',
};

const ITEMS: { place: Place; route: Route; href: string }[] = [
  { place: 'now', route: { place: 'now' }, href: '#now' },
  { place: 'characters', route: { place: 'characters', section: null }, href: '#characters' },
  { place: 'systems', route: { place: 'systems' }, href: '#systems' },
  { place: 'timeline', route: { place: 'timeline', section: null }, href: '#timeline' },
  { place: 'map', route: { place: 'map', mapIndex: null }, href: '#map' },
];

/**
 * FR-2, FR-4, FR-5, TR-13, M21 FR-M6: `<nav aria-label="Places">` with a list of five links, each a pixel
 * glyph plus a word. Only Now (the count to bring to zero) and the Timeline (limits that bind before
 * you're back, T's `afkStrip.before`) carry a badge, named in words; the Systems badge is gone (D-7).
 */
export function PlacesNav({ s }: { s: Session }) {
  const nowCount = s.view.progress.fix + s.view.account.blockers.length;
  const before = s.views.afkStrip?.before ?? 0;
  const badge = (place: Place): { n: number; name: string; tone: 'now' | 'timeline' } | null =>
    place === 'now' && nowCount > 0
      ? { n: nowCount, name: NAV_WORDS.nowBadge(nowCount), tone: 'now' }
      : place === 'timeline' && before > 0
        ? { n: before, name: NAV_WORDS.timelineBadge(before), tone: 'timeline' }
        : null;
  const exact = s.route.place !== 'character' && s.route.place !== 'system';
  return (
    <div className="places-wrap">
      <a
        className="skip-link"
        href={CONTENT_ANCHOR}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('place-content')?.focus();
        }}
      >
        {LINK_WORDS.skipToContent}
      </a>
      <nav aria-label={NAV_WORDS.label} className="places">
        <ul>
          {ITEMS.map((item) => {
            const on = s.place === item.place;
            const b = badge(item.place);
            return (
              <li key={item.place}>
                <a
                  href={item.href}
                  className={`place-item${on ? ' on' : ''}`}
                  aria-current={on ? (exact ? 'page' : 'true') : undefined}
                  aria-label={b ? `${PLACE_NAMES[item.place]}, ${b.name}` : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    s.navigate(item.route, 'push');
                  }}
                >
                  <span className="glyph-wrap">
                    <PixelArt name={GLYPHS[item.place]} decorative />
                    {b ? (
                      <span className={`badge badge-${b.tone} num`} aria-hidden="true">
                        {b.n}
                      </span>
                    ) : null}
                  </span>
                  <span className="place-label">{PLACE_NAMES[item.place]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function PlaceView({ s }: { s: Session }) {
  switch (s.route.place) {
    case 'characters':
      return <CharactersPlace s={s} />;
    case 'systems':
      return <SystemsHub s={s} />;
    case 'system':
      return <SystemPage s={s} id={s.route.id} />;
    case 'timeline':
      return <TimelinePlace s={s} />;
    case 'map':
      return <MapPlace s={s} />;
    default:
      return <NowPlace s={s} />;
  }
}

function Outlet({ s }: { s: Session }) {
  return (
    <Suspense fallback={<Loading what={PLACE_NAMES[s.place]} />}>
      <PlaceView s={s} />
    </Suspense>
  );
}

export function Shell(props: ShellProps & ShellSlots) {
  const s = useSession(props);
  const { renderChips, onFooter, navSlot } = props;
  useEffect(() => {
    renderChips(
      <ExpectedReturnChips chips={s.view.expectedReturn.chips} updating={props.updating} onPick={s.pick} />,
    );
  }, [renderChips, s.view.expectedReturn.chips, props.updating, s.pick]);
  useEffect(
    () => onFooter({ ...s.view.footer, persistent: s.prefs.persistent }),
    [onFooter, s.view.footer, s.prefs.persistent],
  );
  // TR-11: the lazy chunks (places, tabs, System pages) are prefetched when the browser is idle after
  // the first result, so a tap rarely shows the loading line.
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const go = () => void preloadParts();
    if (w.requestIdleCallback) w.requestIdleCallback(go);
    else setTimeout(go, 2000);
  }, []);
  // The navigation shows only in M10's `ok` state (FR-12): this component exists only then.
  const nav = <PlacesNav s={s} />;

  if (!s.prefs.ready) return <p className="small muted">Loading your choices…</p>;

  return (
    <NowActionsContext.Provider value={s.actions}>
      {navSlot ? createPortal(nav, navSlot) : nav}
      {s.pendingFollow ? (
        <button
          type="button"
          className="chip follow"
          onClick={() => {
            const i = s.pendingFollow?.index;
            if (i !== undefined)
              s.navigate({ place: 'character', index: i, tab: 'now' }, 'push', { origin: '#now' });
          }}
        >
          {NAV_WORDS.playing(s.pendingFollow.text)}
        </button>
      ) : null}
      <NowChrome s={s} />
      <div
        ref={s.refs.outletRef}
        id="place-content"
        tabIndex={-1}
        className={`outlet place-${s.route.place}`}
      >
        <Outlet s={s} />
      </div>
      <NowLiveRegion s={s} />
    </NowActionsContext.Provider>
  );
}
