// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Timeline place (M17 FR-24 to FR-30), redrawn to the Design Lab's `time.timeline` pick "Lanes with a
// back-at marker" (M21 FR-T1): lanes per character on one axis with the Back marker, a who-glyph on each
// lane head, our own pixel glyph at each bar's end, hatched waste up to Back, and the account lanes as
// the lower band. Its stale state is the runner-up "Hatched waste" (FR-T4). Under the board: the NOW box,
// the legend, the lists (the text partner), then the Parallel Slots grid (`#slots`, FR-T3) and the Daily
// & Weekly section (`#daily`, FR-T2). It renders the views in order and computes nothing (D-18).
//
// Two parts, one truth:
// - the board: every lane's bars on the shared axis, CSS only and `aria-hidden`, inside one frame that
//   scrolls sideways on its own (never the page, FR-30) and is keyboard-focusable;
// - the lists under it: each lane as a list of text items in time order, with the real "See the fix"
//   and "See it" links (TR-13). A sentence that repeats on several characters is said once.
import {
  type TimelineBarView,
  type TimelineLane,
  type TimelineView,
  TIMELINE_WORDS as W,
} from '@idleon-forge/engine/now';
import { type CSSProperties, Fragment, useEffect, useRef } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { SegmentedControl, VerdictStamp } from '../design/atoms';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import { tabHref } from '../now/character-tabs';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import { barArt, barFamily } from './art';
import { DailyWeekly } from './DailyWeekly';
import { ParallelSlots } from './ParallelSlots';
import './timeline.css';
import { BOARD_WORDS as B } from './words';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const familyOf = (s: Session, index: number | null): ClassFamily =>
  (index !== null ? s.view.families?.[index] : undefined) ?? 'beginner';
const rowOf = (s: Session, index: number | null) =>
  index === null ? undefined : s.view.roster.find((r) => r.index === index);

/** The Lab's "Back in" control: the Expected Return chips as one radio group (M10 FR-9, M21 FR-T1). */
function ReturnControl({ s }: { s: Session }) {
  const chips = s.view.expectedReturn.chips;
  if (!chips.length) return null;
  const on = chips.find((c) => c.pressed);
  return (
    <div className="tl-ret">
      <span className="tl-ret-l" aria-hidden="true">
        {B.backIn}
      </span>
      <SegmentedControl
        label={B.backInLabel}
        value={on ? String(on.seconds) : ''}
        options={chips.map((c) => ({ value: String(c.seconds), label: c.label }))}
        onChange={(v) => s.pick(Number(v))}
      />
    </div>
  );
}

/** Bars that fill before Back without a fix of their own are waste: grey stripes, never a Fix outline. */
const wasted = (b: TimelineBarView) => b.beforeReturn && !b.outlined && b.state === 'open' && !b.untimed;

/** One bar on the board: a rail from now to when it binds, the kind's glyph at its end, stripes to Back. */
function BoardBar({ b, backX, now }: { b: TimelineBarView; backX: number; now: boolean }) {
  const x = b.x ?? 0;
  const style: Vars = { '--x': x, '--hatch': b.hatchTo ?? backX };
  const cls = [
    'tl-bar',
    `fam-${barFamily(b.kind)}`,
    `fx-${b.effect}`,
    b.outlined ? 'outlined' : '',
    wasted(b) ? 'waste' : '',
    b.untimed ? 'untimed' : '',
    b.fullNow ? 'full-now' : '',
    b.at === null ? 'present' : '',
    b.later ? 'later' : '',
    x > 0.6 ? 'end' : '',
    b.state !== 'open' ? 'muted' : '',
    now ? 'is-now' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={style}>
      {b.untimed ? null : <span className="tl-rail" />}
      {b.hatched || wasted(b) ? <span className="tl-hatch" /> : null}
      <span className="tl-bar-g">
        <PixelArt name={barArt(b)} decorative />
      </span>
      <span className="tl-bar-l">
        {now ? <span className="tl-nowtag">{B.nowBadge}</span> : null}
        {b.label} · <span className="num">{b.timeText}</span>
      </span>
    </div>
  );
}

function LaneHead({ lane, s }: { lane: TimelineLane; s: Session }) {
  const row = rowOf(s, lane.index);
  if (!row)
    return (
      <span className="tl-head">
        <span className="tl-lh-t">
          <span className="tl-lh-n">{lane.heading}</span>
        </span>
      </span>
    );
  return (
    <span className="tl-head">
      <WhoGlyph family={familyOf(s, row.index)} classLabel={row.classLabel} scale={1} decorative />
      <span className="tl-lh-t">
        <span className="tl-lh-n">
          {row.classLabel} {row.level}
        </span>
        {row.map ? <span className="tl-lh-m">{row.map}</span> : null}
      </span>
    </span>
  );
}

function Track({
  lane,
  v,
  s,
  nowId,
}: {
  lane: TimelineLane;
  v: TimelineView;
  s: Session;
  nowId: string | null;
}) {
  const bars = [...lane.bars, ...lane.untimed];
  return (
    <div className={`tl-row${lane.kind === 'account' ? ' acct' : ''}`}>
      <LaneHead lane={lane} s={s} />
      <div className="tl-track" style={{ '--back': v.axis.backX } as Vars}>
        {bars.length ? (
          bars.map((b) => <BoardBar key={b.barId} b={b} backX={v.axis.backX} now={b.barId === nowId} />)
        ) : (
          <div className="tl-bar empty" />
        )}
      </div>
    </div>
  );
}

/** The NOW box's bar: the earliest open limit with a fix before you're back (DS-2: one next step). */
function nowBar(v: TimelineView): { lane: TimelineLane; bar: TimelineBarView } | null {
  let best: { lane: TimelineLane; bar: TimelineBarView } | null = null;
  for (const lane of [...v.lanes, ...v.accountLanes])
    for (const bar of lane.bars)
      if (bar.outlined && bar.fix && (!best || (bar.at ?? 0) < (best.bar.at ?? 0))) best = { lane, bar };
  return best;
}

function Board({ v, s, nowId }: { v: TimelineView; s: Session; nowId: string | null }) {
  return (
    // FR-30, TR-13: the lanes scroll sideways inside this frame only; it is focusable and labelled, and
    // the drawing inside it is hidden from assistive tech (the lists below carry the same content).
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take keyboard focus (TR-13).
    <section className="tl-frame" tabIndex={0} aria-label={W.scrollLabel}>
      <div className={`tl-board${v.stale ? ' stale' : ''}`} aria-hidden="true">
        <div className="tl-row tl-axis">
          <span className="tl-head tl-axis-head">{v.stale ? v.stale.band : ''}</span>
          <div className="tl-track" style={{ '--back': v.axis.backX } as Vars}>
            <span className="tl-tick now">{W.now}</span>
            {v.axis.ticks.map((t) => (
              <span key={t.at} className="tl-tick" style={{ '--x': t.x } as Vars}>
                {t.label}
              </span>
            ))}
            <span className="tl-back-flag">
              <PixelArt name="flows-back-flag" decorative />
              {W.backShort}
            </span>
          </div>
        </div>
        <div className="tl-lanes" style={{ '--back': v.axis.backX } as Vars}>
          <span className="tl-now-line" />
          <span className="tl-back-line" />
          {v.lanes.map((lane) => (
            <Track key={lane.id} lane={lane} v={v} s={s} nowId={nowId} />
          ))}
          {v.accountLanes.length ? (
            <>
              <div className="tl-divider">
                <span>{W.account}</span>
              </div>
              {v.accountLanes.map((lane) => (
                <Track key={lane.id} lane={lane} v={v} s={s} nowId={nowId} />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function FixLink({ b, s, className }: { b: TimelineBarView; s: Session; className: string }) {
  const fix = b.fix;
  if (!fix) return null;
  return (
    <a
      className={className}
      href={
        fix.where === 'account' ? formatRoute({ place: 'now' }) : tabHref('now', Number(fix.subject.slice(1)))
      }
      aria-label={fix.where === 'pill' ? W.seeItFor(b.label) : W.seeFixFor(b.label)}
      onClick={(e) => {
        e.preventDefault();
        s.toFix(fix);
      }}
    >
      {fix.where === 'pill' ? W.seeIt : W.seeFix}
      <PixelArt name="ui-arrow-right" decorative />
    </a>
  );
}

/** The Lab's NOW box under the board: one next step, with who and the fix link (DS-2, DS-3). */
function NowBox({ v, s }: { v: TimelineView; s: Session }) {
  const now = nowBar(v);
  if (!now)
    return (
      <p className="tl-next calm">
        <PixelArt name="ui-check" decorative /> {B.nowCalm}
      </p>
    );
  const row = rowOf(s, now.lane.index);
  return (
    <div className="tl-next">
      <span className="tl-now-badge">{B.nowBadge}</span>
      <span className="tl-next-a">
        {now.bar.label} · <span className="num">{now.bar.timeText}</span>
      </span>
      <span className="tl-next-tok">
        {row ? (
          <span className="tl-who">
            <WhoGlyph family={familyOf(s, row.index)} classLabel={row.classLabel} scale={1} decorative />
            {row.classLabel} {row.level}
          </span>
        ) : (
          <span className="tl-who">
            <PixelArt name={barArt(now.bar)} decorative />
            {now.lane.heading}
          </span>
        )}
      </span>
      <FixLink b={now.bar} s={s} className="tl-link" />
    </div>
  );
}

function Legend() {
  return (
    <ul className="tl-legend" aria-label={B.legend}>
      <li>
        <span className="tl-key fam-prod" aria-hidden="true" /> {B.legendCap}
      </li>
      <li>
        <span className="tl-key fam-store" aria-hidden="true" /> {B.legendBank}
      </li>
      <li>
        <span className="tl-key fam-timer" aria-hidden="true" /> {B.legendTimer}
      </li>
      <li>
        <span className="tl-key fam-food" aria-hidden="true" /> {B.legendFood}
      </li>
      <li>
        <span className="tl-key outlined" aria-hidden="true" /> {W.legendOutlined}
      </li>
      <li>
        <span className="tl-key hatch" aria-hidden="true" /> {W.legendHatched}
      </li>
    </ul>
  );
}

function Item({ b, s }: { b: TimelineBarView; s: Session }) {
  const fix = b.fix;
  return (
    <li className={`tl-item${b.outlined ? ' outlined' : ''}${b.state !== 'open' ? ' muted' : ''}`}>
      <span className="tl-glyph">
        <PixelArt name={barArt(b)} decorative />
      </span>
      <div className="tl-item-body">
        <p className="tl-item-text">
          <span aria-hidden="true">
            {b.label}
            {' · '}
            <span className="num">{b.timeText}</span>
            {b.flag ? (
              <>
                {' · '}
                <strong>{b.flag}</strong>
              </>
            ) : null}
          </span>
          <span className="sr-only">{b.a11y}</span>
        </p>
        {b.note ? <p className="tl-note">{b.note}</p> : null}
        {b.group?.first && b.group.more.length ? (
          <details className="tl-more">
            <summary>{W.sameOn(b.group.more.length)}</summary>
            <ul>
              {b.group.more.map((m) => (
                <li key={m.index}>
                  {fix ? (
                    <a
                      href={tabHref('now', m.index)}
                      onClick={(e) => {
                        e.preventDefault();
                        s.toFix({ ...fix, subject: `c${m.index}`, key: m.key });
                      }}
                    >
                      {m.name}
                    </a>
                  ) : (
                    <span>{m.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
      <FixLink b={b} s={s} className="tl-link" />
    </li>
  );
}

function LaneList({ lane, s, level }: { lane: TimelineLane; s: Session; level: 4 | 5 }) {
  const items = [...lane.bars, ...lane.untimed].filter((b) => !b.group || b.group.first);
  // A lane whose bars are all said once on an earlier lane points there, never "Nothing timed here".
  const grouped = [...new Set([...lane.bars, ...lane.untimed].map((b) => b.label))];
  const H = level === 4 ? 'h4' : 'h5';
  const row = rowOf(s, lane.index);
  const href =
    lane.index !== null
      ? tabHref('now', lane.index)
      : formatRoute({ place: 'system', id: lane.systemId ?? '' });
  return (
    <section className="tl-lane" aria-label={lane.heading}>
      <H className="tl-lane-h">
        {row ? (
          <WhoGlyph family={familyOf(s, row.index)} classLabel={row.classLabel} scale={1} decorative />
        ) : null}
        <a
          className="tl-lane-link"
          href={href}
          onClick={(e) => {
            e.preventDefault();
            if (lane.index !== null) s.open(lane.index, 'now');
            else if (lane.systemId) s.navigate({ place: 'system', id: lane.systemId }, 'push');
          }}
        >
          {lane.heading}
        </a>
        {lane.detail ? <span className="tl-lane-d"> {lane.detail}</span> : null}
        {lane.verdict ? <VerdictStamp verdict={lane.verdict.kind} word={lane.verdict.text} /> : null}
      </H>
      {items.length ? (
        <ul className="tl-items">
          {items.map((b) => (
            <Item key={b.barId} b={b} s={s} />
          ))}
        </ul>
      ) : grouped.length ? (
        <p className="tl-quiet tl-grouped">
          {W.inGroupAbove}
          {grouped.map((label) => (
            <Fragment key={label}>
              {' · '}
              {label}
            </Fragment>
          ))}
        </p>
      ) : (
        <p className="tl-quiet">{W.nothingTimed}</p>
      )}
    </section>
  );
}

function JumpNav() {
  const links = [
    { href: '#timeline', label: B.jumpLanes },
    { href: formatRoute({ place: 'timeline', section: 'slots' }), label: B.jumpSlots },
    { href: formatRoute({ place: 'timeline', section: 'daily' }), label: B.jumpDaily },
  ];
  return (
    <nav className="tl-jump" aria-label={B.jumpLabel}>
      {links.map((l) => (
        <a key={l.href} className="tl-jump-a" href={l.href}>
          {l.label}
        </a>
      ))}
    </nav>
  );
}

export function TimelinePlace({ s }: { s: Session }) {
  const v = s.timeline;
  const heading = useRef<HTMLHeadingElement | null>(null);
  const { takeArrivalFocus } = s;
  const section = s.route.place === 'timeline' ? s.route.section : null;
  // FR-11: this place is lazy, so on a first visit its heading appears after the shell's arrival step.
  useEffect(() => {
    if (takeArrivalFocus()) heading.current?.focus({ preventScroll: true });
  }, [takeArrivalFocus]);
  // M21 TR-6: `#slots` and `#daily` open the place at that section (this place mounts late, so it scrolls).
  useEffect(() => {
    if (!section) return;
    // After the lazy sections have drawn (their art loads on first draw), so the scroll lands.
    const id = requestAnimationFrame(() =>
      document.getElementById(section)?.scrollIntoView?.({ block: 'start' }),
    );
    return () => cancelAnimationFrame(id);
  }, [section]);
  const now = v ? nowBar(v) : null;
  return (
    <section className="timeline-place" aria-labelledby="timeline-h">
      <h2 ref={heading} id="timeline-h" className="place-h" data-place-heading tabIndex={-1}>
        {W.title}
      </h2>
      {/* §6 and the Design Lab's "Hatched waste": the save's age comes before anything else. */}
      {v?.stale ? (
        <p className="tl-stale">
          <PixelArt name="now-glyph-stale" decorative />
          <span>{v.stale.text}</span>
        </p>
      ) : null}
      <JumpNav />
      {!v ? (
        <p>{W.unavailable}</p>
      ) : (
        <div className="tl-lanes-part">
          <h3 className="tl-h">{B.title}</h3>
          <p className="tl-intro">{W.intro}</p>
          <div className="tl-toolbar">
            <ReturnControl s={s} />
          </div>
          <p className="tl-back-text">
            <PixelArt name="flows-back-flag" decorative />
            <strong className="num">{v.axis.backLabel}</strong>
          </p>
          {v.empty ? <p className="tl-quiet">{v.empty}</p> : null}
          <Board v={v} s={s} nowId={now?.bar.barId ?? null} />
          <NowBox v={v} s={s} />
          <Legend />
          <h3 className="tl-sub-h">{B.listsTitle}</h3>
          <div className="tl-lists">
            {v.lanes.map((lane) => (
              <LaneList key={lane.id} lane={lane} s={s} level={4} />
            ))}
            {v.accountLanes.length || v.accountNote ? (
              <section className="tl-account" aria-labelledby="tl-account-h">
                <h4 id="tl-account-h" className="tl-account-h">
                  {W.account}
                </h4>
                {v.accountNote ? <p className="tl-quiet">{v.accountNote}</p> : null}
                {v.accountLanes.map((lane) => (
                  <LaneList key={lane.id} lane={lane} s={s} level={5} />
                ))}
              </section>
            ) : null}
          </div>
        </div>
      )}
      <ParallelSlots s={s} />
      <DailyWeekly s={s} />
    </section>
  );
}
