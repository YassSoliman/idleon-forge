// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Daily & Weekly section (M21 FR-T2), the Timeline's `#daily` section: the Design Lab's
// `time.daily-weekly` pick "Two-ring reset clock". The day ring sits inside the week ring, with a reset
// tick at the top and a "now" knob; beside it the three bands (no bank, banks, weekly) as pip rows, one
// pip per checklist row in its state's colour and glyph. A band opens its rows in a sheet (3, then
// "Show all"), each banking row with its day pips ("Bank pips calendar", red on the last). A filter chip
// row (5 / 15 / 30 min, the "Five-minute plan") lists what fits, no-bank rows first.
import { type ChecklistBandView, type ChecklistView, inSpan, span } from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { Button, Chip, cx, Sheet } from '../design/atoms';
import { useNowActions } from '../now/context';
import type { Session } from '../shell/session';
import { rowArt } from './art';
import { ChecklistRow } from './ChecklistRow';
import { planFor, ringFractions } from './daily-model';
import { DAILY_WORDS as W } from './words';

const ROWS_IN_SHEET = 3;
const PLANS = [5, 15, 30] as const;
const BAND_CLASS: Record<ChecklistBandView['band'], string> = {
  'no-bank': 'nobank',
  banks: 'bank',
  weekly: 'weekly',
};

/** The two-ring reset clock: SVG attributes only (CSP), the words beside it carry the meaning. */
function Clock({ day, week }: { day: number | null; week: number | null }) {
  const C = 84;
  const dayR = 60;
  const weekR = 78;
  const circ = (r: number) => 2 * Math.PI * r;
  // The arc from the "now" knob clockwise to the reset tick at the top is the time left.
  const knob = (f: number, r: number) => {
    const a = 2 * Math.PI * (1 - f) - Math.PI / 2;
    return { cx: C + r * Math.cos(a), cy: C + r * Math.sin(a) };
  };
  return (
    <svg className="dw-ring" viewBox="0 0 168 168" width="168" height="168" aria-hidden="true">
      <circle className="dw-ring-week" cx={C} cy={C} r={weekR} />
      {week !== null ? (
        <circle
          className="dw-ring-week-left"
          cx={C}
          cy={C}
          r={weekR}
          strokeDasharray={`${circ(weekR) * week} ${circ(weekR)}`}
          transform={`rotate(${-90 + 360 * (1 - week)} ${C} ${C})`}
        />
      ) : null}
      <circle className="dw-ring-day" cx={C} cy={C} r={dayR} />
      {day !== null ? (
        <>
          <circle
            className="dw-ring-left"
            cx={C}
            cy={C}
            r={dayR}
            strokeDasharray={`${circ(dayR) * day} ${circ(dayR)}`}
            transform={`rotate(${-90 + 360 * (1 - day)} ${C} ${C})`}
          />
          <circle className="dw-ring-now" r={7} {...knob(day, dayR)} />
        </>
      ) : null}
      <line className="dw-ring-reset" x1={C} y1={C - dayR - 9} x2={C} y2={C - dayR + 9} />
    </svg>
  );
}

/** One band as a pip row: a pip per row in its state's colour and glyph; a tap opens the sheet. */
function BandRow({ b, onOpen }: { b: ChecklistBandView; onOpen(): void }) {
  const all = [...b.rows, ...b.done];
  const todo = b.rows.filter((r) => r.state === 'todo' || r.state === 'waiting').length;
  return (
    <li className={cx('dw-band', `dw-band-${BAND_CLASS[b.band]}`)}>
      <button
        type="button"
        className="dw-band-b"
        onClick={onOpen}
        aria-label={`${W.open(b.title)}: ${W.bandCount(todo, all.length)}`}
      >
        <span className="dw-band-h">
          <span className="dw-band-k" aria-hidden="true" />
          <b>{b.title}</b>
          <span className="dw-band-n num">{W.bandCount(todo, all.length)}</span>
        </span>
        <span className="dw-pips" aria-hidden="true">
          {all.map((r) => (
            <span key={r.id} className={cx('dw-pip', `s-${r.state}`, r.lostBeforeReturn && 'lost')}>
              <PixelArt name={rowArt(r.id)} decorative animate={false} />
            </span>
          ))}
        </span>
        <PixelArt name="ui-arrow-right" decorative />
      </button>
    </li>
  );
}

function BandSheet({ b, onClose }: { b: ChecklistBandView | null; onClose(): void }) {
  const [all, setAll] = useState(false);
  const rows = b ? [...b.rows, ...b.done] : [];
  const shown = all ? rows : rows.slice(0, ROWS_IN_SHEET);
  return (
    <Sheet
      open={b !== null}
      title={b?.title ?? ''}
      onClose={() => {
        setAll(false);
        onClose();
      }}
    >
      <div className="dw-sheet">
        <ul className="cl-rows">
          {shown.map((r) => (
            <ChecklistRow key={r.id} r={r} />
          ))}
        </ul>
        {!all && rows.length > ROWS_IN_SHEET ? (
          <Button tone="quiet" onClick={() => setAll(true)}>
            {W.showAll(rows.length)}
          </Button>
        ) : null}
        {b?.later.length ? <p className="cl-detail">{W.opensLater(b.later.join('; '))}</p> : null}
      </div>
    </Sheet>
  );
}

function Plan({ v }: { v: ChecklistView }) {
  const actions = useNowActions();
  const [minutes, setMinutes] = useState<number | null>(null);
  const raw = actions.result?.checklist?.rows ?? [];
  const effortOf = (id: string) => raw.find((r) => r.id === id)?.effortSeconds ?? null;
  const plan = minutes === null ? null : planFor(v, effortOf, minutes);
  return (
    <div className="dw-plan">
      <fieldset className="dw-chips">
        <legend className="dw-plan-h">{W.planTitle}</legend>
        {PLANS.map((m) => (
          <Chip key={m} pressed={minutes === m} onClick={() => setMinutes(minutes === m ? null : m)}>
            {W.plan(m)}
          </Chip>
        ))}
      </fieldset>
      {plan && minutes !== null ? (
        plan.rows.length ? (
          <>
            <p className="dw-quiet" aria-live="polite">
              {W.planned(span(plan.usedSeconds * 1000), minutes)}
            </p>
            <ul className="cl-rows">
              {plan.rows.map((r) => (
                <ChecklistRow key={r.id} r={r} />
              ))}
            </ul>
          </>
        ) : (
          <p className="dw-quiet" aria-live="polite">
            {W.planNone(minutes)}
          </p>
        )
      ) : null}
    </div>
  );
}

export function DailyWeekly({ s }: { s: Session }) {
  const v = s.view.checklist;
  const [open, setOpen] = useState<ChecklistBandView['band'] | null>(null);
  if (!v) return null;
  const clocks = s.result.checklist?.clocks;
  const { day, week } = ringFractions(clocks, s.now);
  const todo = v.rings.today.total - v.rings.today.done;
  const band = v.bands.find((b) => b.band === open) ?? null;
  return (
    <section className="tl-section daily" id="daily" aria-labelledby="daily-h">
      <h3 id="daily-h" className="tl-h">
        {W.title}
      </h3>
      <div className="dw">
        <div className="dw-side">
          <div className="dw-face">
            <Clock day={day} week={week} />
            <p className="dw-c">
              <span className="dw-k">{W.ringKey}</span>
              <span className="dw-v num">
                {clocks?.daily != null && clocks.daily > s.now ? inSpan(clocks.daily - s.now) : W.ringUnknown}
              </span>
            </p>
          </div>
          <p className="dw-quiet dw-week">
            {clocks?.accountWeek != null && clocks.accountWeek > s.now
              ? W.weekKnown(inSpan(clocks.accountWeek - s.now))
              : W.weekUnknown}
          </p>
          <p className="dw-sum">
            <b>{todo > 0 ? W.toDo(todo) : W.allDone}</b>
            <span className="num">{v.ringText}</span>
          </p>
        </div>
        <div className="dw-list">
          <ul className="dw-bands">
            {v.bands.map((b) => (
              <BandRow key={b.band} b={b} onOpen={() => setOpen(b.band)} />
            ))}
          </ul>
          <p className="dw-quiet">{v.weekWhy}</p>
          <Plan v={v} />
        </div>
      </div>
      <BandSheet b={band} onClose={() => setOpen(null)} />
    </section>
  );
}
