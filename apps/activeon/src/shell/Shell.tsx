// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Views: the navigation shell. Three places in Phase 1 (Now, Characters, Systems; FR-1), a bottom
// bar under 720 px and a side rail from 720 px (FR-2, D-5), each place one bare anchor (FR-7). The
// banners, the progress bar and What's new are the same in every place (FR-6). The session state lives
// in `useSession` (FR-10), so a place switch never re-runs the engine or loses the Play Session.
import { LINK_WORDS, NAV_WORDS, PLACE_WORDS } from '@idleon-forge/engine/now';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CharactersPlace } from '../characters/CharactersPlace';
import { Banners, ExpectedReturnChips, ProgressBar, WhatsNewCard } from '../now/Chrome';
import { NowActionsContext } from '../now/context';
import { NowPlace } from '../now/NowScreen';
import { useWhatsNew } from '../now/release';
import { SystemPage } from '../systems/SystemPage';
import { SystemsHub } from '../systems/SystemsHub';
import type { Place, Route } from './route';

/** The outlet's id: a plain in-page target, never a route (FR-7 leaves unknown anchors to Now). */
const CONTENT_ANCHOR = `#${'place-content'}`;

import { type Session, type ShellProps, useSession } from './session';

export type { NowSave, ShellProps } from './session';

export interface ShellSlots {
  /** Where the place navigation renders (App puts the slot right under the header, FR-2); inline without. */
  navSlot?: HTMLElement | null;
}

function Glyph({ place, on }: { place: Place; on: boolean }) {
  const fill = on ? 'currentColor' : 'none';
  return (
    <svg className="glyph" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      {place === 'now' ? (
        <circle cx="12" cy="12" r="8" fill={fill} stroke="currentColor" strokeWidth="2" />
      ) : place === 'characters' ? (
        <>
          <circle cx="12" cy="8" r="4" fill={fill} stroke="currentColor" strokeWidth="2" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill={fill} stroke="currentColor" strokeWidth="2" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="8" height="8" rx="1.5" fill={fill} stroke="currentColor" strokeWidth="2" />
          <rect
            x="13"
            y="3"
            width="8"
            height="8"
            rx="1.5"
            fill={fill}
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="3"
            y="13"
            width="8"
            height="8"
            rx="1.5"
            fill={fill}
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="13"
            y="13"
            width="8"
            height="8"
            rx="1.5"
            fill={fill}
            stroke="currentColor"
            strokeWidth="2"
          />
        </>
      )}
    </svg>
  );
}

const ITEMS: { place: Place; route: Route; href: string }[] = [
  { place: 'now', route: { place: 'now' }, href: '#now' },
  { place: 'characters', route: { place: 'characters', section: null }, href: '#characters' },
  { place: 'systems', route: { place: 'systems' }, href: '#systems' },
];

/** FR-2, FR-4, FR-5, TR-13: `<nav aria-label="Places">` with a list of links, badges named in words. */
export function PlacesNav({ s }: { s: Session }) {
  const nowCount = s.view.progress.fix + s.view.account.blockers.length;
  const badge = (place: Place) =>
    place === 'now' && nowCount > 0
      ? { n: nowCount, name: NAV_WORDS.nowBadge(nowCount) }
      : place === 'systems' && s.systems.wastingCount > 0
        ? { n: s.systems.wastingCount, name: NAV_WORDS.systemsBadge(s.systems.wastingCount) }
        : null;
  const exact = s.route.place === 'now' || s.route.place === 'characters' || s.route.place === 'systems';
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
                  aria-label={
                    b ? `${PLACE_WORDS[item.place as keyof typeof PLACE_WORDS]}, ${b.name}` : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    s.navigate(item.route, 'push');
                  }}
                >
                  <span className="glyph-wrap">
                    <Glyph place={item.place} on={on} />
                    {b ? (
                      <span className="badge num" aria-hidden="true">
                        {b.n}
                      </span>
                    ) : null}
                  </span>
                  <span className="place-label">{PLACE_WORDS[item.place as keyof typeof PLACE_WORDS]}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function Outlet({ s }: { s: Session }) {
  switch (s.route.place) {
    case 'characters':
      return <CharactersPlace s={s} />;
    case 'systems':
      return <SystemsHub s={s} />;
    case 'system':
      return <SystemPage s={s} id={s.route.id} />;
    default:
      return <NowPlace s={s} />;
  }
}

export function Shell(props: ShellProps & ShellSlots) {
  const s = useSession(props);
  const whatsNew = useWhatsNew();
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
      <Banners banners={s.view.banners} onReload={props.onReload} />
      <ProgressBar progress={s.view.progress} onAccount={s.toAccountFix} />
      {whatsNew.view ? <WhatsNewCard view={whatsNew.view} onDismiss={whatsNew.dismiss} /> : null}
      <div
        ref={s.refs.outletRef}
        id="place-content"
        tabIndex={-1}
        className={`outlet place-${s.route.place}`}
      >
        <Outlet s={s} />
      </div>
      <p className="sr-only" aria-live="polite">
        {s.spoken}
      </p>
    </NowActionsContext.Provider>
  );
}
