// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Daily & weekly tab (`#daily`), M24's `TimelineDaily` board over M21 FR-T2: the one frame answers
// first (the two-ring reset clock, how many things are left before the daily reset, and what is already
// being lost); then the time planner ("How long have you got?" 5 / 15 / 30 min, 15 by default): the jobs
// that fit, the losing job first, drawn as a strip of their efforts and listed in order, with what can
// wait for next time; and beside it everything by how it resets (no bank, banks up to 3 days with its day
// pips, weekly with each clock). A band opens its rows in a sheet (3, then "Show all") with the Done tick
// and the links. Every word and number comes from the engine's checklist view (DS-23: nothing invented).
import {
  type ChecklistBandView,
  type ChecklistRowView,
  type ChecklistView,
  inSpan,
  span,
} from '@idleon-forge/engine/now';
import { type CSSProperties, useState } from 'react';
import { Button, cx, SegmentedControl, Sheet } from '../design/atoms';
import { useNowActions } from '../now/context';
import type { Session } from '../shell/session';
import { ChecklistRow } from './ChecklistRow';
import { bankPips, planFor, ringFractions } from './daily-model';
import { DAILY_WORDS as W } from './words';

type Vars = CSSProperties & Record<`--${string}`, string | number>;

const ROWS_IN_SHEET = 3;
const PLANS = [5, 15, 30] as const;
const BAND_CLASS: Record<ChecklistBandView['band'], string> = {
  'no-bank': 'nobank',
  banks: 'bank',
  weekly: 'weekly',
};

/** The two-ring reset clock: SVG attributes only (CSP); the words beside it carry the meaning. */
function Clock({ day, week, left }: { day: number | null; week: number | null; left: string }) {
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
      <text className="dw-ring-k" x={C} y={C - 6} textAnchor="middle">
        {W.resetIn}
      </text>
      <text className="dw-ring-v" x={C} y={C + 18} textAnchor="middle">
        {left}
      </text>
    </svg>
  );
}

/** The plan's colour for a row: coral when it is being lost, sky for a weekly one, gold otherwise. */
const toneOf = (r: ChecklistRowView) =>
  r.lostBeforeReturn ? 'is-lost' : r.band === 'weekly' ? 'is-weekly' : 'is-todo';

function Plan({ v }: { v: ChecklistView }) {
  const actions = useNowActions();
  const [minutes, setMinutes] = useState<number>(15);
  const raw = actions.result?.checklist?.rows ?? [];
  const effortOf = (id: string) => raw.find((r) => r.id === id)?.effortSeconds ?? null;
  const plan = planFor(v, effortOf, minutes);
  const budget = minutes * 60;
  const planned = new Set(plan.rows.map((r) => r.id));
  const later = v.bands.flatMap((b) => b.rows).filter((r) => r.state === 'todo' && !planned.has(r.id));
  const ticks = [...new Set([0, minutes / 3, (2 * minutes) / 3, minutes].map((m) => Math.round(m)))];
  return (
    <section className="dw-plan" aria-labelledby="dw-plan-h">
      <div className="dw-plan-top">
        <h3 id="dw-plan-h" className="tl-h2">
          {W.planTitle}
        </h3>
        <SegmentedControl
          label={W.planTitle}
          value={String(minutes)}
          options={PLANS.map((m) => ({ value: String(m), label: W.plan(m) }))}
          onChange={(m) => setMinutes(Number(m))}
        />
      </div>
      {plan.rows.length ? (
        <>
          <div className="dw-strip-t">
            <p className="dw-fit" aria-live="polite">
              <b>{W.fits(plan.rows.length, minutes)}</b>
              <span className="dw-fit-u">{W.fitsUsed(span(plan.usedSeconds * 1000))}</span>
            </p>
            <div className="dw-strip" aria-hidden="true">
              {plan.rows.map((r, i) => (
                <span
                  key={r.id}
                  className={cx('dw-job', toneOf(r))}
                  style={{ '--w': (effortOf(r.id) ?? 0) / budget } as Vars}
                  title={`${r.label}, ${r.effort}`}
                >
                  {i + 1}
                </span>
              ))}
              <span className="dw-strip-rest" />
            </div>
            <p className="dw-axis" aria-hidden="true">
              {ticks.map((m) => (
                <span key={m}>{m === 0 ? '0' : W.axis(m)}</span>
              ))}
            </p>
          </div>
          <ol className="dw-jobs">
            {plan.rows.map((r, i) => (
              <li key={r.id} className="dw-jobr">
                <span className={cx('dw-n', toneOf(r))} aria-hidden="true">
                  {i + 1}
                </span>
                <span className="dw-jobb">
                  <b>{r.label}</b>
                  {r.lostBeforeReturn || r.details.length ? (
                    <span className={cx('dw-jobd', r.lostBeforeReturn && 'is-lost')}>
                      {[r.lostBeforeReturn ? W.lostBeforeBack : '', ...r.details].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </span>
                <span className="dw-band-w">{W.bandShort[r.band]}</span>
                <span className="dw-eff num">{r.effort}</span>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="dw-quiet" aria-live="polite">
          {W.planNone(minutes)}
        </p>
      )}
      {later.length ? (
        <div className="dw-later">
          <h4 className="tl-cap">{W.later}</h4>
          <ul>
            {later.map((r) => (
              <li key={r.id}>
                <b>{r.label}</b>
                <span className="dw-later-w">{W.laterWhy(W.bandShort[r.band], r.clockText)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="dw-quiet">{W.ticksNote}</p>
    </section>
  );
}

/** One band as a tile: its count, then a pip per row (no bank), day pips (banks) or clocks (weekly). */
function BandTile({ b, onOpen }: { b: ChecklistBandView; onOpen(): void }) {
  const all = [...b.rows, ...b.done];
  const todo = b.rows.filter((r) => r.state === 'todo' || r.state === 'waiting').length;
  const title = b.band === 'no-bank' ? W.bandNoBank : b.band === 'banks' ? W.bandBanks : W.bandWeekly;
  return (
    <li className={cx('dw-tile', `dw-band-${BAND_CLASS[b.band]}`)}>
      <button
        type="button"
        className="dw-tile-b"
        onClick={onOpen}
        aria-label={`${W.open(b.title)}: ${W.bandCount(todo, all.length)}`}
      >
        <span className="dw-tile-h">
          <span className="dw-band-k" aria-hidden="true" />
          <b>{title}</b>
          <span className="dw-band-n num">{W.bandCount(todo, all.length)}</span>
        </span>
        {b.band === 'no-bank' ? (
          <>
            <span className="dw-quiet">{W.bandNoBankWhy}</span>
            <span className="dw-pips" aria-hidden="true">
              {all.map((r) => (
                <span
                  key={r.id}
                  className={cx('dw-pip', `s-${r.state}`, r.lostBeforeReturn && 'lost')}
                  title={r.label}
                />
              ))}
            </span>
          </>
        ) : b.band === 'banks' ? (
          <>
            <span className="dw-banks" aria-hidden="true">
              {all.flatMap((r) =>
                bankPips(r.details).pips.map((p) => (
                  <span key={`${r.id}-${p.name}`} className="dw-bank">
                    <span>{p.name}</span>
                    <span className="dw-bank-p">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={cx('dw-pip', i < p.kept ? 's-banked' : 's-empty')} />
                      ))}
                      {Array.from({ length: p.lost }, (_, i) => (
                        // biome-ignore lint/suspicious/noArrayIndexKey: identical lost-day pips
                        <span key={`l${i}`} className="dw-pip s-lostday" />
                      ))}
                    </span>
                  </span>
                )),
              )}
            </span>
            <span className="dw-quiet">{W.bankKey}</span>
          </>
        ) : (
          <span className="dw-weekly" aria-hidden="true">
            {all.map((r) => (
              <span key={r.id} className={cx('dw-wk', r.lostBeforeReturn && 'is-lost')}>
                <span>{r.label}</span>
                <span className="dw-wk-c">{r.clockText}</span>
              </span>
            ))}
          </span>
        )}
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

export function DailyWeekly({ s }: { s: Session }) {
  const v = s.view.checklist;
  const [open, setOpen] = useState<ChecklistBandView['band'] | null>(null);
  if (!v) return null;
  const clocks = s.result.checklist?.clocks;
  const { day, week } = ringFractions(clocks, s.now);
  const todo = v.rings.today.total - v.rings.today.done;
  const band = v.bands.find((b) => b.band === open) ?? null;
  const left =
    clocks?.daily != null && clocks.daily > s.now
      ? span(clocks.daily - s.now).replace(/ \d+s$/, '')
      : W.ringUnknown;
  const weekLeft =
    clocks?.accountWeek != null && clocks.accountWeek > s.now ? inSpan(clocks.accountWeek - s.now) : null;
  const losing = v.bands.flatMap((b) => b.rows).filter((r) => r.lostBeforeReturn && r.state === 'todo');
  return (
    <section className="tl-section daily" id="daily" aria-labelledby="daily-h">
      <h3 id="daily-h" className="sr-only">
        {W.title}
      </h3>
      <section className="dw-hero a-frame" aria-label={W.ringKey}>
        <Clock day={day} week={week} left={left} />
        <div className="dw-hero-b">
          <p className="dw-count">
            <span className="dw-big num">{todo}</span>
            <span className="dw-count-l">{todo > 0 ? W.heroCount(todo) : W.heroDone}</span>
          </p>
          <p className="sr-only">
            {W.ringKey}: {left}
          </p>
          {losing.map((r) => (
            <p key={r.id} className="dw-losing">
              <span className="dw-pip-l" aria-hidden="true" />
              <b>{W.losingLine(r.label)}</b>
              {r.details.some((d) => / lost$/.test(d)) ? (
                <span> · {r.details.filter((d) => / lost$/.test(d)).join(' · ')}</span>
              ) : null}
            </p>
          ))}
          <p className="dw-keys">
            <span className="dw-kv">
              <span className="dw-key is-day" aria-hidden="true" />
              {W.todayKey(v.rings.today.done, v.rings.today.total)}
            </span>
            <span className="dw-kv">
              <span className="dw-key is-week" aria-hidden="true" />
              {W.weekKey(v.rings.week.done, v.rings.week.total, weekLeft)}
            </span>
          </p>
        </div>
      </section>
      <div className="dw-cols">
        <Plan v={v} />
        <aside className="dw-aside" aria-labelledby="dw-aside-h">
          <h3 id="dw-aside-h" className="tl-cap">
            {W.asideTitle}
          </h3>
          <ul className="dw-tiles">
            {v.bands.map((b) => (
              <BandTile key={b.band} b={b} onOpen={() => setOpen(b.band)} />
            ))}
          </ul>
          <p className="dw-quiet">{v.weekWhy}</p>
        </aside>
      </div>
      <BandSheet b={band} onClose={() => setOpen(null)} />
    </section>
  );
}
