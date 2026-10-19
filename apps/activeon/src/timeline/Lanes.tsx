// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Timeline's Lanes tab (the `Timeline` and `TimelinePhone` boards): the one framed answer (what is
// losing value now, with its fix), the "How long are you away?" control, then the limits as a Chart or a
// List (one toggle, never both stacked). The Chart is one row per lane: who, the earning rail up to its
// first limit, coral stripes from there to Back, grey stripes after, a mark per limit, and the lane's
// limits as text beside it. The List is M17's lane lists with every fix link (TR-13). Characters come
// soonest first, then the account Systems. It renders `TimelineView` and computes only positions.
import {
  inSpan,
  type TimelineBarView,
  type TimelineLane,
  type TimelineView,
  TIMELINE_WORDS as W,
} from '@idleon-forge/engine/now';
import { type CSSProperties, Fragment, useState } from 'react';
import { spriteOf } from '../art/sprites/index';
import { Sprite } from '../art/sprites/Sprite';
import { PixelArt } from '../design/art/PixelArt';
import { cx, Frame, SegmentedControl, VerdictStamp } from '../design/atoms';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import { tabHref } from '../now/character-tabs';
import { PageSources } from '../shell/page-sources';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import { barArt } from './art';
import { BOARD_WORDS as B } from './words';

type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Mode = 'chart' | 'list';

const familyOf = (s: Session, index: number | null): ClassFamily =>
  (index !== null ? s.view.families?.[index] : undefined) ?? 'beginner';
const rowOf = (s: Session, index: number | null) =>
  index === null ? undefined : s.view.roster.find((r) => r.index === index);
/** A System's sprite from the kit (`sys-<registry id>`), or null when the kit has none. */
export const systemSprite = (id: string | null): string | null => {
  if (!id) return null;
  const name = `sys-${id}`;
  if (spriteOf(name)) return name;
  const head = `sys-${id.split('-')[0]}`;
  return spriteOf(head) ? head : null;
};

const open = (b: TimelineBarView) => b.state === 'open';
/** Losing value now: full already, before you're back, with its own fix (the outlined set). */
const nowish = (b: TimelineBarView) => b.fullNow || (b.at === null && !b.untimed);
const losing = (b: TimelineBarView) => open(b) && nowish(b) && b.outlined;
/** The first timed limit that is not already full: where the earning rail stops. */
const firstTimed = (lane: TimelineLane): number | null => {
  const xs = lane.bars.filter((b) => open(b) && !nowish(b) && b.x !== null).map((b) => b.x as number);
  return xs.length ? Math.min(...xs) : null;
};
/** Where a lane stops earning on the axis (0 to 1). */
const stopOf = (lane: TimelineLane): number => (lane.bars.some(losing) ? 0 : (firstTimed(lane) ?? 1));

/** Characters soonest first (the Visit Order breaks ties); the account by how urgent its first limit is. */
function ordered(v: TimelineView) {
  const at = (l: TimelineLane) => firstTimed(l) ?? Number.POSITIVE_INFINITY;
  const chars = v.lanes.map((l, i) => ({ l, i })).sort((a, z) => at(a.l) - at(z.l) || a.i - z.i);
  const urgency = (l: TimelineLane) =>
    l.bars.some(losing) ? -2 : l.bars.some((b) => open(b) && nowish(b)) ? -1 : at(l);
  const account = v.accountLanes
    .map((l, i) => ({ l, i }))
    .sort((a, z) => urgency(a.l) - urgency(z.l) || a.i - z.i);
  return { chars: chars.map((x) => x.l), account: account.map((x) => x.l) };
}

/** The NOW bar: the earliest open limit with a fix before you're back (DS-2: one next step). */
export function nowBar(v: TimelineView): { lane: TimelineLane; bar: TimelineBarView } | null {
  let best: { lane: TimelineLane; bar: TimelineBarView } | null = null;
  for (const lane of [...v.lanes, ...v.accountLanes])
    for (const bar of lane.bars)
      if (bar.outlined && bar.fix && (!best || (bar.at ?? 0) < (best.bar.at ?? 0))) best = { lane, bar };
  return best;
}

/** The Next Action a fix lands on, for the frame's second line. */
function naText(s: Session, key: string): string | null {
  const goals = [...s.result.account.goals, ...s.result.characters.flatMap((c) => c.goals)];
  return goals.find((g) => g.nextAction.key === key)?.nextAction.text ?? null;
}

export function FixLink({ b, s, className }: { b: TimelineBarView; s: Session; className: string }) {
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

/** The one frame: what is losing value now (or binds first before you're back), who, and the fix. */
function LosingNow({ v, s }: { v: TimelineView; s: Session }) {
  const now = nowBar(v);
  if (!now)
    return (
      <p className="tl-next calm">
        <PixelArt name="ui-check" decorative /> {B.nowCalm}
      </p>
    );
  const row = rowOf(s, now.lane.index);
  const sprite = systemSprite(now.lane.systemId ?? now.bar.system);
  const step = now.bar.fix ? naText(s, now.bar.fix.key) : null;
  const where = row ? `${row.classLabel} ${row.level}` : B.accountHead;
  return (
    <Frame
      tone={nowish(now.bar) ? 'coral' : 'gold'}
      className={cx('tl-next', nowish(now.bar) && 'is-losing')}
      aria-label={B.losingNow}
    >
      <span className="tl-next-ic" aria-hidden="true">
        {row ? (
          <WhoGlyph family={familyOf(s, row.index)} classLabel={row.classLabel} scale={2} decorative />
        ) : sprite ? (
          <Sprite name={sprite} size={48} decorative />
        ) : (
          <PixelArt name={barArt(now.bar)} decorative />
        )}
      </span>
      <span className="tl-next-b">
        <span className="a-cap tl-now-badge">{nowish(now.bar) ? B.losingNow : B.beforeBack}</span>
        <span className="tl-next-a">
          {now.bar.label} · <span className="num">{now.bar.timeText}</span>
        </span>
        <span className="tl-next-tok">
          {where}
          {step ? (
            <>
              {' · '}
              {step}
            </>
          ) : null}
        </span>
      </span>
      <FixLink b={now.bar} s={s} className="tl-link tl-next-go" />
    </Frame>
  );
}

/** "How long are you away?": the Expected Return chips as one radio group (M10 FR-9, M21 FR-T1). */
function ReturnControl({ s }: { s: Session }) {
  const chips = s.view.expectedReturn.chips;
  if (!chips.length) return null;
  const on = chips.find((c) => c.pressed);
  return (
    <div className="tl-ret">
      <span className="tl-ret-l" aria-hidden="true">
        {B.away}
      </span>
      <SegmentedControl
        label={B.backInLabel}
        value={on ? String(on.seconds) : ''}
        options={chips.map((c) => ({ value: String(c.seconds), label: c.label }))}
        onChange={(x) => s.pick(Number(x))}
      />
    </div>
  );
}

/** The daily reset on the axis, when it falls inside it (the checklist's own clock). */
function resetOf(v: TimelineView, s: Session): { x: number; text: string } | null {
  const at = s.result.checklist?.clocks?.daily ?? null;
  if (at === null || at <= v.axis.start || at >= v.axis.end) return null;
  return { x: (at - v.axis.start) / (v.axis.end - v.axis.start), text: B.dailyReset(inSpan(at - s.now)) };
}

function Mark({ b }: { b: TimelineBarView }) {
  const cls = b.untimed
    ? 'is-unknown'
    : nowish(b)
      ? b.outlined
        ? 'is-losing'
        : 'is-full'
      : b.beforeReturn
        ? 'is-before'
        : 'is-after';
  const x = b.untimed ? 1 : nowish(b) ? 0 : (b.x ?? 1);
  return (
    <span className={cx('tl-mk', cls)} style={{ '--x': x } as Vars}>
      {b.untimed ? '?' : nowish(b) ? '!' : ''}
    </span>
  );
}

function Line({ b }: { b: TimelineBarView }) {
  const tone = b.untimed
    ? 'is-muted'
    : nowish(b)
      ? b.outlined
        ? 'is-losing'
        : 'is-full'
      : b.beforeReturn
        ? 'is-before'
        : 'is-muted';
  return (
    <li className={cx('tl-ln', tone)}>
      <span aria-hidden="true">
        {b.untimed ? (
          B.untimed(b.label)
        ) : (
          <>
            {b.label} · <span className="num">{b.timeText}</span>
          </>
        )}
      </span>
      <span className="sr-only">{b.a11y}</span>
    </li>
  );
}

function LaneHead({ lane, s }: { lane: TimelineLane; s: Session }) {
  const row = rowOf(s, lane.index);
  const sprite = systemSprite(lane.systemId);
  const href =
    lane.index !== null
      ? tabHref('now', lane.index)
      : formatRoute({ place: 'system', id: lane.systemId ?? '' });
  return (
    <a
      className="tl-lr-h"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (lane.index !== null) s.open(lane.index, 'now');
        else if (lane.systemId) s.navigate({ place: 'system', id: lane.systemId }, 'push');
      }}
    >
      {row ? (
        <WhoGlyph family={familyOf(s, row.index)} classLabel={row.classLabel} scale={1} decorative />
      ) : sprite ? (
        <Sprite name={sprite} size={24} decorative />
      ) : null}
      <span>{row ? `${row.classLabel} ${row.level}` : lane.short}</span>
    </a>
  );
}

function ChartRow({
  lane,
  v,
  reset,
}: {
  lane: TimelineLane;
  v: TimelineView;
  reset: { x: number } | null;
  s: Session;
}) {
  const bars = [...lane.bars, ...lane.untimed].filter(open);
  const stop = stopOf(lane);
  const back = v.axis.backX;
  return (
    <div
      className="tl-lr-t"
      aria-hidden="true"
      style={{ '--stop': stop, '--back': back, '--reset': reset?.x ?? -1 } as Vars}
    >
      <span className="tl-earn" />
      {stop < back ? <span className="tl-lose" /> : null}
      {stop < 1 ? <span className="tl-after" /> : null}
      <span className="tl-backl" />
      {reset ? <span className="tl-resetl" /> : null}
      {bars.map((b) => (
        <Mark key={b.barId} b={b} />
      ))}
    </div>
  );
}

function Chart({ v, s }: { v: TimelineView; s: Session }) {
  const { chars, account } = ordered(v);
  const reset = resetOf(v, s);
  const pressed = s.view.expectedReturn.chips.find((c) => c.pressed);
  const lane = (l: TimelineLane) => {
    const bars = [...l.bars, ...l.untimed].filter(open);
    return (
      <li key={l.id} className="tl-lr">
        <LaneHead lane={l} s={s} />
        <ChartRow lane={l} v={v} reset={reset} s={s} />
        <ul className="tl-lns">
          {bars.length ? (
            bars.map((b) => <Line key={b.barId} b={b} />)
          ) : (
            <li className="tl-ln is-muted">{W.nothingTimed}</li>
          )}
        </ul>
      </li>
    );
  };
  return (
    <section className="tl-chart" aria-label={B.chartLabel}>
      <div className="tl-ax" aria-hidden="true" style={{ '--back': v.axis.backX } as Vars}>
        <span className="tl-ax-t">
          <span className="tl-tk is-start">{W.now}</span>
          {v.axis.ticks
            .filter((t) => Math.abs(t.x - v.axis.backX) > 0.05 && (!reset || Math.abs(t.x - reset.x) > 0.08))
            .map((t) => (
              <span key={t.at} className="tl-tk" style={{ '--x': t.x } as Vars}>
                {t.label}
              </span>
            ))}
          <span className="tl-tk is-back" style={{ '--x': v.axis.backX } as Vars}>
            {B.back(pressed?.label ?? W.backShort)}
          </span>
          {reset ? (
            <span className="tl-tk is-reset" style={{ '--x': reset.x } as Vars}>
              {reset.text}
            </span>
          ) : null}
        </span>
      </div>
      {chars.length ? (
        <>
          <h3 className="a-cap tl-grp">{B.characters}</h3>
          <ol className="tl-lrs">{chars.map(lane)}</ol>
        </>
      ) : null}
      {account.length ? (
        <>
          <h3 className="a-cap tl-grp">{B.accountHead}</h3>
          <ol className="tl-lrs">{account.map(lane)}</ol>
        </>
      ) : null}
      {v.accountNote ? <p className="tl-quiet">{v.accountNote}</p> : null}
    </section>
  );
}

function Legend() {
  return (
    <ul className="tl-legend" aria-label={B.legend}>
      <li>
        <span className="tl-key is-earn" aria-hidden="true" /> {B.legendEarning}
      </li>
      <li>
        <span className="tl-key is-before" aria-hidden="true" /> {B.legendBefore}
      </li>
      <li>
        <span className="tl-key is-after" aria-hidden="true" /> {B.legendAfter}
      </li>
      <li>
        <span className="tl-key is-full" aria-hidden="true" /> {B.legendFullNow}
      </li>
      <li>
        <span className="tl-key is-unknown" aria-hidden="true" /> {B.legendUnknown}
      </li>
    </ul>
  );
}

// ---- The List: M17's lane lists, every limit as text with its fix link (TR-13) ----

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

function LaneList({ lane, s, level }: { lane: TimelineLane; s: Session; level: 3 | 4 }) {
  const items = [...lane.bars, ...lane.untimed].filter((b) => !b.group || b.group.first);
  // A lane whose bars are all said once on an earlier lane points there, never "Nothing timed here".
  const grouped = [...new Set([...lane.bars, ...lane.untimed].map((b) => b.label))];
  const H = level === 3 ? 'h3' : 'h4';
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

function Lists({ v, s }: { v: TimelineView; s: Session }) {
  return (
    <div className="tl-lists">
      {v.lanes.map((lane) => (
        <LaneList key={lane.id} lane={lane} s={s} level={3} />
      ))}
      {v.accountLanes.length || v.accountNote ? (
        <section className="tl-account" aria-labelledby="tl-account-h">
          <h3 id="tl-account-h" className="tl-account-h">
            {W.account}
          </h3>
          {v.accountNote ? <p className="tl-quiet">{v.accountNote}</p> : null}
          {v.accountLanes.map((lane) => (
            <LaneList key={lane.id} lane={lane} s={s} level={4} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

/** The limits before you're back, as the tab badge and the subtitle count them. */
export const limitsBefore = (v: TimelineView): number =>
  [...v.lanes, ...v.accountLanes].flatMap((l) => l.bars).filter((b) => open(b) && b.beforeReturn).length;

export function Lanes({ v, s }: { v: TimelineView; s: Session }) {
  const [mode, setMode] = useState<Mode>('chart');
  return (
    <div className="tl-lanes-part">
      <PageSources>{B.sources}</PageSources>
      <LosingNow v={v} s={s} />
      <div className="tl-toolbar">
        <ReturnControl s={s} />
        <SegmentedControl
          label={B.viewLabel}
          value={mode}
          options={[
            { value: 'chart', label: B.chart },
            { value: 'list', label: B.list },
          ]}
          onChange={(m) => setMode(m)}
        />
      </div>
      <p className="tl-back-text sr-only">{v.axis.backLabel}</p>
      {v.empty ? <p className="tl-quiet">{v.empty}</p> : null}
      {mode === 'chart' ? (
        <>
          <Chart v={v} s={s} />
          <Legend />
        </>
      ) : (
        <Lists v={v} s={s} />
      )}
    </div>
  );
}
