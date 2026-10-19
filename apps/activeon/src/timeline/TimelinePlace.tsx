// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Timeline place (M17 FR-24 to FR-30, M21 area T), redrawn by M24 to the `Timeline`, `TimelineSlots`,
// `TimelineDaily` and `TimelinePhone` boards: one question as the heading ("When does everyone stop
// earning?"), then three tabs that really switch the content (M24 rule 3): Lanes (`#timeline`), Parallel
// slots (`#slots`) and Daily & weekly (`#daily`). Each tab is a route, so a link opens it and Back returns
// to it; each panel answers first in its one frame. It renders the views in order and computes nothing.
import { type TimelineView, TIMELINE_WORDS as W } from '@idleon-forge/engine/now';
import { useEffect, useMemo, useRef } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { cx } from '../design/atoms';
import type { Route } from '../shell/route';
import type { Session } from '../shell/session';
import { DailyWeekly } from './DailyWeekly';
import { Lanes, limitsBefore } from './Lanes';
import { ParallelSlots, slotsBadge } from './ParallelSlots';
import './timeline.css';
import { BOARD_WORDS as B, DAILY_WORDS, SLOTS_UI_WORDS } from './words';

type Section = Extract<Route, { place: 'timeline' }>['section'];
const TABS: { section: Section; id: string }[] = [
  { section: null, id: 'lanes' },
  { section: 'slots', id: 'slots' },
  { section: 'daily', id: 'daily' },
];

const lanesSub = (v: TimelineView | null): string =>
  v ? B.sub(limitsBefore(v), v.lanes.length, v.accountLanes.length) : '';

/** The tabs: one link per panel, the current one marked; arrow keys move along them. */
function TabBar({ s, section, badges }: { s: Session; section: Section; badges: (number | null)[] }) {
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const labels = [B.tabLanes, B.tabSlots, B.tabDaily];
  const short = [B.tabLanes, B.tabSlotsShort, B.tabDailyShort];
  const go = (to: Section) => s.navigate({ place: 'timeline', section: to }, 'replace');
  return (
    <nav className="a-tabs tl-tabs" aria-label={B.tabsLabel}>
      {TABS.map((t, i) => {
        const on = t.section === section;
        const n = badges[i];
        return (
          <a
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            href={t.section ? `#${t.section}` : '#timeline'}
            className={cx('a-tab tl-tab', on && 'a-tab--on is-on')}
            aria-current={on ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              go(t.section);
            }}
            onKeyDown={(e) => {
              const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -9;
              const next = TABS[(to + TABS.length) % TABS.length];
              if (to === -9 || !next) return;
              e.preventDefault();
              go(next.section);
              refs.current[(to + TABS.length) % TABS.length]?.focus();
            }}
          >
            <span className="tl-tab-l">{labels[i]}</span>
            <span className="tl-tab-s" aria-hidden="true">
              {short[i]}
            </span>
            {n !== null && n !== undefined ? (
              <span className={cx('a-badge tl-badge', on ? 'a-badge--gold is-on' : 'a-badge--plain')}>
                <span className="num">{n}</span>
              </span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}

export function TimelinePlace({ s }: { s: Session }) {
  const v = s.timeline;
  const heading = useRef<HTMLHeadingElement | null>(null);
  const { takeArrivalFocus } = s;
  const section: Section = s.route.place === 'timeline' ? s.route.section : null;
  // FR-11: this place is lazy, so on a first visit its heading appears after the shell's arrival step.
  useEffect(() => {
    if (takeArrivalFocus()) heading.current?.focus({ preventScroll: true });
  }, [takeArrivalFocus]);
  const slots = useMemo(() => slotsBadge(s), [s]);
  const cl = s.view.checklist;
  const daily = cl ? cl.rings.today.total - cl.rings.today.done : null;
  const sub = section === 'slots' ? SLOTS_UI_WORDS.sub : section === 'daily' ? DAILY_WORDS.sub : lanesSub(v);
  return (
    <section className="timeline-place" aria-labelledby="timeline-h">
      <h2 ref={heading} id="timeline-h" className="place-h a-h1 tl-title" data-place-heading tabIndex={-1}>
        {B.title}
      </h2>
      {/* §6 and the Design Lab's "Hatched waste": the save's age comes before anything else. */}
      {v?.stale ? (
        <p className="tl-stale">
          <PixelArt name="now-glyph-stale" decorative />
          <span>{v.stale.text}</span>
        </p>
      ) : null}
      {sub ? <p className="tl-sub">{sub}</p> : null}
      <TabBar s={s} section={section} badges={[v ? limitsBefore(v) : null, slots, daily]} />
      <div className="tl-panel">
        {section === 'slots' ? (
          <ParallelSlots s={s} />
        ) : section === 'daily' ? (
          <DailyWeekly s={s} />
        ) : !v ? (
          <p className="tl-quiet">{W.unavailable}</p>
        ) : (
          <Lanes v={v} s={s} />
        )}
      </div>
    </section>
  );
}
