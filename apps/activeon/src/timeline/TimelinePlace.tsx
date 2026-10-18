// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 Phase 2: the Timeline place (FR-24 to FR-30). From the Design Lab's picks: lanes on one axis with
// a Back marker, hatched waste for the stale save, and the account band as its own block under the
// characters. It renders `buildTimelineView`'s output in order and computes nothing (D-18).
//
// Two parts, one truth:
// - the board: every lane's bars on the shared axis, CSS only and `aria-hidden`, inside one frame that
//   scrolls sideways on its own (never the page, FR-30) and is keyboard-focusable;
// - the lists under it: each lane as a list of text items in time order, with the real "See the fix"
//   and "See it" links (TR-13). A sentence that repeats on several characters is said once.
import {
  type PillView,
  type TimelineBarView,
  type TimelineLane,
  type TimelineView,
  TIMELINE_WORDS as W,
} from '@idleon-forge/engine/now';
import { type CSSProperties, Fragment, useEffect, useRef } from 'react';
import { tabHref } from '../now/character-tabs';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import './timeline.css';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

function KindGlyph({ kind }: { kind: TimelineBarView['kind'] }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const;
  return (
    <svg className="tl-glyph" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      {kind === 'storage' ? (
        <rect x="2" y="4" width="12" height="9" rx="1.5" {...p} />
      ) : kind === 'food' ? (
        <path d="M8 2c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8z" {...p} />
      ) : kind === 'time-cap' ? (
        <>
          <circle cx="8" cy="8" r="6" {...p} />
          <path d="M8 4v4h3" {...p} />
        </>
      ) : kind === 'production' ? (
        <>
          <circle cx="8" cy="8" r="3" {...p} />
          <path d="M8 1v3M8 12v3M1 8h3M12 8h3" {...p} />
        </>
      ) : kind === 'bank' ? (
        <>
          <ellipse cx="8" cy="5" rx="5" ry="2" {...p} />
          <path d="M3 5v6c0 1.1 2.2 2 5 2s5-.9 5-2V5" {...p} />
        </>
      ) : (
        <path d="M4 2h8M4 14h8M5 2c0 4 6 4 6 6s-6 2-6 6M11 2c0 4-6 4-6 6s6 2 6 6" {...p} />
      )}
    </svg>
  );
}

const pillClass = (p: PillView | null) => (p ? `pill ${p.kind}` : '');

/** One bar on the board: a rail from now to when it binds, an outline and stripes when it binds before Back. */
function BoardBar({ b, backX }: { b: TimelineBarView; backX: number }) {
  const x = b.x ?? 0;
  const style: Vars = { '--x': x, '--hatch': b.hatchTo ?? backX };
  const cls = [
    'tl-bar',
    `fx-${b.effect}`,
    b.outlined ? 'outlined' : '',
    b.fullNow ? 'full-now' : '',
    b.at === null ? 'present' : '',
    b.later ? 'later' : '',
    b.state !== 'open' ? 'muted' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} style={style}>
      {b.effect === 'pill' ? <span className="tl-pip" /> : <span className="tl-rail" />}
      {b.hatched ? <span className="tl-hatch" /> : null}
    </div>
  );
}

function Track({ lane, v }: { lane: TimelineLane; v: TimelineView }) {
  return (
    <div className="tl-row">
      <span className="tl-head">{lane.short}</span>
      <div className={`tl-track${v.stale ? ' stale' : ''}`} style={{ '--back': v.axis.backX } as Vars}>
        <span className="tl-now-line" />
        <span className="tl-back-line" />
        {lane.bars.length ? (
          lane.bars.map((b) => <BoardBar key={b.barId} b={b} backX={v.axis.backX} />)
        ) : (
          <div className="tl-bar empty" />
        )}
      </div>
    </div>
  );
}

function Board({ v }: { v: TimelineView }) {
  return (
    // FR-30, TR-13: the lanes scroll sideways inside this frame only; it is focusable and labelled, and
    // the drawing inside it is hidden from assistive tech (the lists below carry the same content).
    // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take keyboard focus (TR-13).
    <section className="tl-frame" tabIndex={0} aria-label={W.scrollLabel}>
      <div className="tl-board" aria-hidden="true">
        <div className="tl-row tl-axis">
          <span className="tl-head" />
          <div className={`tl-track${v.stale ? ' stale' : ''}`} style={{ '--back': v.axis.backX } as Vars}>
            {v.stale ? <span className="tl-past">{v.stale.band}</span> : null}
            <span className="tl-tick now">{W.now}</span>
            {v.axis.ticks.map((t) => (
              <span key={t.at} className="tl-tick" style={{ '--x': t.x } as Vars}>
                {t.label}
              </span>
            ))}
            <span className="tl-back-flag">{W.backShort}</span>
          </div>
        </div>
        {v.lanes.map((lane) => (
          <Track key={lane.id} lane={lane} v={v} />
        ))}
        {v.accountLanes.length ? (
          <>
            <div className="tl-divider">{W.account}</div>
            {v.accountLanes.map((lane) => (
              <Track key={lane.id} lane={lane} v={v} />
            ))}
          </>
        ) : null}
      </div>
    </section>
  );
}

function Item({ b, s }: { b: TimelineBarView; s: Session }) {
  const fix = b.fix;
  return (
    <li className={`tl-item${b.outlined ? ' outlined' : ''}${b.state !== 'open' ? ' muted' : ''}`}>
      <KindGlyph kind={b.kind} />
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
        {b.note ? <p className="small muted tl-note">{b.note}</p> : null}
        {b.group?.first && b.group.more.length ? (
          <details className="tl-more small">
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
      {fix ? (
        <a
          className="tl-link small"
          href={
            fix.where === 'account'
              ? formatRoute({ place: 'now' })
              : tabHref('now', Number(fix.subject.slice(1)))
          }
          aria-label={fix.where === 'pill' ? W.seeItFor(b.label) : W.seeFixFor(b.label)}
          onClick={(e) => {
            e.preventDefault();
            s.toFix(fix);
          }}
        >
          {fix.where === 'pill' ? W.seeIt : W.seeFix}
        </a>
      ) : null}
    </li>
  );
}

function LaneList({ lane, s, level }: { lane: TimelineLane; s: Session; level: 3 | 4 }) {
  const items = [...lane.bars, ...lane.untimed].filter((b) => !b.group || b.group.first);
  // A lane whose bars are all said once on an earlier lane points there, never "Nothing timed here".
  const grouped = [...new Set([...lane.bars, ...lane.untimed].map((b) => b.label))];
  const H = level === 3 ? 'h3' : 'h4';
  const href =
    lane.index !== null
      ? tabHref('now', lane.index)
      : formatRoute({ place: 'system', id: lane.systemId ?? '' });
  return (
    <section className="tl-lane" aria-label={lane.heading}>
      <H className="tl-lane-h">
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
        {lane.detail ? <span className="small muted"> {lane.detail}</span> : null}
        {lane.verdict ? (
          <span className={`${pillClass(lane.verdict)} small`}>{lane.verdict.text}</span>
        ) : null}
      </H>
      {items.length ? (
        <ul className="tl-items">
          {items.map((b) => (
            <Item key={b.barId} b={b} s={s} />
          ))}
        </ul>
      ) : grouped.length ? (
        <p className="small muted tl-grouped">
          {W.inGroupAbove}
          {grouped.map((label) => (
            <Fragment key={label}>
              {' · '}
              {label}
            </Fragment>
          ))}
        </p>
      ) : (
        <p className="small muted">{W.nothingTimed}</p>
      )}
    </section>
  );
}

export function TimelinePlace({ s }: { s: Session }) {
  const v = s.timeline;
  const heading = useRef<HTMLHeadingElement | null>(null);
  const { takeArrivalFocus } = s;
  // FR-11: this place is lazy, so on a first visit its heading appears after the shell's arrival step.
  useEffect(() => {
    if (takeArrivalFocus()) heading.current?.focus({ preventScroll: true });
  }, [takeArrivalFocus]);
  return (
    <section className="timeline-place" aria-labelledby="timeline-h">
      <h2 ref={heading} id="timeline-h" className="place-h" data-place-heading tabIndex={-1}>
        {W.title}
      </h2>
      {!v ? (
        <p>{W.unavailable}</p>
      ) : (
        <>
          {/* §6 and the Design Lab's "Hatched waste": the save's age comes before anything else. */}
          {v.stale ? <p className="banner tl-stale">{v.stale.text}</p> : null}
          <p className="small muted">{W.intro}</p>
          <p className="tl-back-text">
            <strong className="num">{v.axis.backLabel}</strong>
          </p>
          {v.empty ? <p className="small">{v.empty}</p> : null}
          <Board v={v} />
          <p className="small muted tl-legend">
            <span className="tl-key outlined" aria-hidden="true" /> {W.legendOutlined}{' '}
            <span className="tl-key hatch" aria-hidden="true" /> {W.legendHatched}
          </p>
          <div className="tl-lists">
            {v.lanes.map((lane) => (
              <LaneList key={lane.id} lane={lane} s={s} level={3} />
            ))}
            {v.accountLanes.length || v.accountNote ? (
              <section className="tl-account" aria-labelledby="tl-account-h">
                <h3 id="tl-account-h" className="sub-h">
                  {W.account}
                </h3>
                {v.accountNote ? <p className="small">{v.accountNote}</p> : null}
                {v.accountLanes.map((lane) => (
                  <LaneList key={lane.id} lane={lane} s={s} level={4} />
                ))}
              </section>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
