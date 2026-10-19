// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Build tab (M24 boards `Build`, `BuildPhone`; M21 FR-C1 to FR-C13 underneath). The engine orders
// and words every step (`view.builds`: the whole Build path per tab, banded done / can add now / part
// now / next after these / later, with running totals and exact or lower-bound point counts, ADR 0010);
// this lays it out as pictures:
// - two preset cards: the one with points waiting is the screen's one frame and is selected first, the
//   other is a quiet tile with its facts ("Class points all spent · 4 star points left");
// - the talent tabs as a segmented control with each tab's points, then the star tab as its own control
//   (star points are their own pool, so the sums add up: 366 + 310 + 193 = 869 talent points);
// - the talent book: every talent the Build names in this tab with its order number (filled: the points
//   you have cover it; outlined: next, when you get more points; grey: later or not in this build);
// - the selected talent's side panel and the attack bar as slots;
// - "The whole build, in order": every step with its running total, and the gold line where the known
//   points end.
import { asOfLine, CHARACTERS_WORDS, leadTab, pathMarker } from '@idleon-forge/engine/characters-ui';
import type { BuildRoadmapView } from '@idleon-forge/engine/now';
import type { BuildPathStepView, BuildPresetView, BuildTabView } from '@idleon-forge/engine/result';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import { spriteOf } from '../../art/sprites';
import { Sprite } from '../../art/sprites/Sprite';
import { PixelArt } from '../../design/art/PixelArt';
import { cx, Frame, GLYPH, Meter, SourceLabel, Tag } from '../../design/atoms';
import type { CharacterTabProps } from '../../now/character-tabs';
import { useNowActions } from '../../now/context';
import { PageSources, PageSourcesSlot } from '../../shell/page-sources';
import { BUILD_WORDS as B } from '../words';
import './build.css';

const W = CHARACTERS_WORDS;
const n = (x: number) => x.toLocaleString('en-US');

/** The save's age in minutes (NowView.saveAgeMinutes), for "as of your last save (12m ago)". */
const SaveAge = createContext<number | null>(null);

// ---------- numbers, straight from the engine's view ----------

/** A tab's known points (0 when none are known); without `known`, the M9 lower bound (as `tabBadge`). */
const pointsOf = (t: BuildTabView): number => Math.max(0, (t.known ? t.known.points : t.unspent) ?? 0);
/** Tabs 1–3 carry a lower bound unless the count is exact (M9 TR-7, ADR 0010). */
const atLeastOf = (t: BuildTabView): boolean => t.known?.kind !== 'exact' && pointsOf(t) > 0;

interface Pools {
  talent: number;
  atLeast: boolean;
  parts: number[];
  star: number;
}
function poolsOf(p: BuildPresetView): Pools {
  const withPoints = p.tabs.filter((t) => pointsOf(t) > 0);
  const star = p.star?.known?.kind === 'exact' && p.star.known.overBy === null ? pointsOf(p.star) : 0;
  return {
    talent: withPoints.reduce((s, t) => s + pointsOf(t), 0),
    atLeast: withPoints.some(atLeastOf),
    parts: withPoints.map(pointsOf),
    star,
  };
}

/** The preset to open on: the one with talent points waiting, then star points, then the lead, then in use. */
function firstPreset(r: BuildRoadmapView): number {
  const by = [...r.presets].sort(
    (a, b) =>
      poolsOf(b).talent - poolsOf(a).talent ||
      poolsOf(b).star - poolsOf(a).star ||
      Number(b.active) - Number(a.active),
  );
  const top = by[0];
  if (top && (poolsOf(top).talent > 0 || poolsOf(top).star > 0)) return top.slot;
  return leadTab(r.presets)?.preset.slot ?? r.presets.find((p) => p.active)?.slot ?? r.presets[0]?.slot ?? 0;
}

/** The tab to open on: the preset's lead tab, else the tab with the most points, else the first with a path. */
function firstTab(p: BuildPresetView): number {
  const lead = leadTab([p]);
  if (lead) return lead.tab.tab;
  const most = [...p.tabs].sort((a, b) => pointsOf(b) - pointsOf(a))[0];
  if (most && pointsOf(most) > 0) return most.tab;
  if (p.star && pointsOf(p.star) > 0) return 0;
  return p.tabs.find((t) => (t.path?.length ?? 0) > 0)?.tab ?? p.tabs[0]?.tab ?? (p.star ? 0 : 1);
}

const isCovered = (s: BuildPathStepView) => s.band === 'now' || s.band === 'part';
const roleWord = (p: BuildPresetView) =>
  p.role ? `${p.role.charAt(0).toUpperCase()}${p.role.slice(1)}` : null;

/** "Eagle Eye" -> "EE"; "360 Noscope" -> "36"; "Stonks!" -> "ST". The book's monogram (no game sprites). */
export function monogram(label: string): string {
  const words = label
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const [a = '', b = ''] = words;
  if (/^\d/.test(a)) return a.slice(0, 2);
  return (b ? `${a[0] ?? ''}${b[0] ?? ''}` : a.slice(0, 2)).toUpperCase();
}

// ---------- small drawings ----------

/** The order number: filled (covered), outlined (next), grey (later), a tick (done). */
function Order({ k, num }: { k: 'covered' | 'next' | 'later' | 'done'; num: number | null }) {
  return (
    <span className="bd-ord" data-k={k} aria-hidden="true">
      {k === 'next' ? (
        <svg viewBox="0 0 22 22" shapeRendering="crispEdges" className="bd-ord-ring" aria-hidden="true">
          <rect x="1" y="1" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      ) : null}
      {k === 'done' ? <PixelArt name={GLYPH.check} decorative /> : <span>{num ?? ''}</span>}
    </span>
  );
}

const stepKind = (s: BuildPathStepView): 'covered' | 'next' | 'later' | 'done' =>
  s.band === 'done' ? 'done' : isCovered(s) ? 'covered' : s.band === 'next' ? 'next' : 'later';

// ---------- the preset cards ----------

function PresetHero({ p, who, onPick }: { p: BuildPresetView; who: string; onPick(): void }) {
  const pools = poolsOf(p);
  const empty = p.tabs.length > 0 && p.tabs.every((t) => t.spent === 0);
  const firstTalent = p.next[0]?.label ?? null;
  const firstStar = (p.star?.path ?? []).find(isCovered)?.label ?? null;
  const title =
    pools.talent > 0
      ? B.spend(pools.talent, pools.atLeast, firstTalent)
      : pools.star > 0
        ? B.spend(pools.star, false, firstStar, 'star')
        : (p.attackBar?.missing.length ?? 0) > 0
          ? B.addAttacks(p.attackBar?.missing ?? [])
          : B.allSpent;
  const why =
    p.role === 'skilling' ? B.skillingWhy(who) : p.role === 'fighting' ? B.fightingWhy(who) : p.roleText;
  return (
    <button
      type="button"
      className="bd-preset bd-preset--on"
      aria-pressed="true"
      data-slot={p.slot}
      onClick={onPick}
    >
      <Frame as="span" tone="gold" className="bd-preset-frame">
        <span className="bd-preset-main">
          <span className="a-cap bd-cap">
            {p.heading}
            {empty ? ` · ${B.empty}` : ''}
            {p.active ? (
              <span className="bd-inuse">
                <Tag tone="mint">{B.inUse}</Tag>
              </span>
            ) : null}
          </span>
          <span className="a-h1 bd-title">{title}</span>
          <span className="bd-why">{why}</span>
        </span>
        <span className="bd-bigs">
          <span className="bd-big">
            <b className="num">{n(pools.talent)}</b>
            <span>{B.talentPoints}</span>
          </span>
          {p.star ? (
            <span className="bd-big">
              <b className="num">{n(pools.star)}</b>
              <span>{B.starPoints}</span>
            </span>
          ) : null}
        </span>
      </Frame>
    </button>
  );
}

function PresetTile({ p, onPick }: { p: BuildPresetView; onPick(): void }) {
  const pools = poolsOf(p);
  const missing = p.attackBar?.missing.length ?? 0;
  const facts = [
    pools.talent > 0 ? B.classWaiting(pools.talent, pools.atLeast) : B.classAllSpent,
    pools.star > 0 ? B.starLeft(pools.star) : null,
    missing > 0 ? B.emptyAttacks(missing) : null,
  ].filter(Boolean);
  const fine = pools.talent === 0;
  return (
    <button
      type="button"
      className="a-tile bd-preset bd-preset--off"
      aria-pressed="false"
      data-slot={p.slot}
      onClick={onPick}
    >
      <span className="bd-tile-name">{p.heading}</span>
      {p.active ? (
        <span className="bd-inuse">
          <Tag tone="mint">{B.inUse}</Tag>
        </span>
      ) : null}
      <span className="bd-tile-facts">{facts.join(' · ')}</span>
      <span className={cx('bd-tile-word', fine ? 'is-fine' : 'is-open')}>{fine ? B.fine : B.toSpend}</span>
    </button>
  );
}

// ---------- the book, the side panel and the ladder ----------

interface BookItem {
  key: string;
  label: string;
  /** The ladder row this talent first needs (1-based); null when not in this Build. */
  order: number | null;
  step: BuildPathStepView | null;
  k: 'covered' | 'next' | 'later' | 'done' | 'out';
  level: number | null;
}

function bookOf(tab: BuildTabView, other: BuildTabView | null): BookItem[] {
  const path = tab.path ?? [];
  const seen = new Map<number, BookItem>();
  path.forEach((s, i) => {
    const had = seen.get(s.talentId);
    // A talent's tile follows its first step that still takes points; done only when every step is.
    if (had && had.k !== 'done') return;
    seen.set(s.talentId, {
      key: s.key,
      label: s.label,
      order: i + 1,
      step: s,
      k: stepKind(s),
      level: s.current,
    });
  });
  const items = [...seen.values()];
  const named = new Set(items.map((x) => x.label));
  const out: BookItem[] = [];
  for (const s of other?.path ?? [])
    if (!named.has(s.label)) {
      named.add(s.label);
      out.push({ key: `o-${s.key}`, label: s.label, order: null, step: null, k: 'out', level: null });
    }
  for (const o of tab.others)
    if (!named.has(o.label)) {
      named.add(o.label);
      out.push({ key: `x-${o.label}`, label: o.label, order: null, step: null, k: 'out', level: o.level });
    }
  return [...items, ...out];
}

function bookLevel(b: BookItem): string {
  const s = b.step;
  if (b.k === 'out') return b.level ? n(b.level) : B.inBook.none;
  if (!s) return B.inBook.none;
  if (b.k === 'done') return `${n(s.goal)} ✓`;
  if (s.band === 'part') return B.inBook.covered(s.partNow ?? 0, s.need);
  if (s.band === 'now') return B.inBook.covered(s.need, s.need);
  return b.k === 'next' ? B.inBook.next : B.inBook.later;
}

function Book({
  items,
  sel,
  onSel,
  label,
}: {
  items: BookItem[];
  sel: string | null;
  onSel(key: string): void;
  label: string;
}) {
  return (
    <ul className="bd-book" aria-label={label}>
      {items.map((b) => {
        const body = (
          <>
            {b.k !== 'out' && b.k !== 'done' ? <Order k={b.k} num={b.order} /> : null}
            <span className="bd-mono" data-k={b.k} aria-hidden="true">
              {monogram(b.label)}
            </span>
            <span className="bd-tal-name">{b.label}</span>
            <span className="bd-tal-lv num" data-k={b.k}>
              {bookLevel(b)}
            </span>
          </>
        );
        return (
          <li key={b.key} className="bd-tal" data-k={b.k} data-sel={sel === b.key ? 'yes' : 'no'}>
            {b.step ? (
              <button
                type="button"
                className="bd-tal-btn"
                aria-pressed={sel === b.key}
                aria-label={`${b.order ? `${n(b.order)}. ` : ''}${b.label}: ${bookLevel(b)}`}
                onClick={() => onSel(b.key)}
              >
                {body}
              </button>
            ) : (
              <span className="bd-tal-btn" title={B.legend.out}>
                {body}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Legend() {
  return (
    <p className="bd-legend">
      <span>
        <Order k="covered" num={1} />
        {B.legend.covered}
      </span>
      <span>
        <Order k="next" num={3} />
        {B.legend.next}
      </span>
      <span>
        <span className="bd-legend-out" aria-hidden="true" />
        {B.legend.out}
      </span>
    </p>
  );
}

function SidePanel({ tab, stepKey }: { tab: BuildTabView; stepKey: string | null }) {
  const path = tab.path ?? [];
  const at = path.findIndex((s) => s.key === stepKey);
  const s = at >= 0 ? path[at] : null;
  if (!s) return null;
  const then = path.slice(at + 1).find((x) => x.talentId !== s.talentId && x.band !== 'done');
  const range = s.band === 'done' ? n(s.goal) : `${n(s.from ?? s.current)} → ${n(s.goal)}`;
  const added = s.band === 'part' ? (s.partNow ?? 0) : s.band === 'now' ? s.need : 0;
  const fill = s.goal > 0 ? Math.min(s.goal, s.current + added) : 0;
  return (
    <section className="bd-sel" aria-label={B.selected}>
      <h3 className="a-cap bd-cap">{B.selected}</h3>
      <div className="bd-sel-id">
        <span className="bd-mono bd-mono--big" data-k={stepKind(s)} aria-hidden="true">
          {monogram(s.label)}
        </span>
        <span className="bd-sel-t">
          <b>{s.label}</b>
          <span className="bd-xs">
            {range} · {B.stepOf(at + 1, path.length)}
          </span>
        </span>
      </div>
      {s.goal > 0 && s.band !== 'later' ? (
        <Meter
          value={fill}
          max={s.goal}
          label={`${s.label}: ${n(fill)} of ${n(s.goal)}`}
          tone={s.band === 'done' ? 'mint' : 'gold'}
        />
      ) : null}
      {s.condition || s.note ? <p className="bd-xs">{s.condition ?? s.note}</p> : null}
      <dl className="bd-sel-rows">
        {s.band === 'done' ? (
          <div>
            <dt>{B.side.level}</dt>
            <dd>{B.side.done}</dd>
          </div>
        ) : null}
        {isCovered(s) ? (
          <>
            <div>
              <dt>{B.side.canAdd}</dt>
              <dd>
                <b>{B.side.addOf(added, s.need)}</b>
              </dd>
            </div>
            {s.need - added > 0 ? (
              <div>
                <dt>{B.side.toFinish}</dt>
                <dd>{B.side.more(s.need - added)}</dd>
              </div>
            ) : null}
          </>
        ) : null}
        {!isCovered(s) && s.band !== 'done' && s.cumulative !== null ? (
          <div>
            <dt>{B.pointsIn}</dt>
            <dd>{n(s.cumulative)}</dd>
          </div>
        ) : null}
        {then ? (
          <div>
            <dt>{B.side.nextUp}</dt>
            <dd>{then.label}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function AttackBar({ p }: { p: BuildPresetView }) {
  const bar = p.attackBar;
  if (!bar) return null;
  const role = roleWord(p);
  const title = role ? B.attackBar(role) : W.attackBar.heading;
  return (
    <section className="a-tile2 bd-atk" aria-label={title}>
      <h3 className="a-cap bd-cap">{title}</h3>
      <ol className="bd-atk-row">
        {bar.set.map((a) => (
          <li key={`s-${a}`} className="bd-slot" title={a}>
            <span aria-hidden="true">{monogram(a)}</span>
            <span className="sr-only">{a}</span>
          </li>
        ))}
        {bar.missing.map((a) => (
          <li key={`m-${a}`} className="bd-slot" data-ghost="yes" title={B.wants(a)}>
            <span aria-hidden="true">+</span>
            <span className="sr-only">
              {W.attackBar.empty}, {B.wants(a)}
            </span>
          </li>
        ))}
      </ol>
      <p className="bd-xs">{bar.text}</p>
    </section>
  );
}

function stepStatus(s: BuildPathStepView, last: boolean): { text: string; tone: string } {
  if (s.band === 'done') return { text: B.status.done, tone: 'mint' };
  if (s.band === 'now') return { text: B.status.add(s.need), tone: 'gold' };
  if (s.band === 'part')
    return { text: B.status.part(s.partNow ?? 0, s.need - (s.partNow ?? 0)), tone: 'gold' };
  if (s.band === 'next') return { text: last ? B.status.last : B.status.next, tone: 'mut' };
  return { text: s.condition ?? B.status.later, tone: 'mut' };
}

/** The whole Build of one tab, in spend order, with the gold line where the known points end. */
export function Ladder({ tab, preset, id }: { tab: BuildTabView; preset: string; id: string }) {
  const age = useContext(SaveAge);
  const path = tab.path ?? [];
  const known = pointsOf(tab);
  const lastCovered = path.reduce((m, s, i) => (isCovered(s) ? i : m), -1);
  const firstOpen = path.findIndex((s) => s.band !== 'done');
  // Known points: the line sits under the last step they reach. None: it sits where the open steps start.
  const cut = known > 0 && lastCovered >= 0 ? lastCovered + 1 : firstOpen < 0 ? path.length : firstOpen;
  const lastNext = path.reduce((m, s, i) => (s.band === 'next' ? i : m), -1);
  const toFinish = path.reduce((m, s) => Math.max(m, s.cumulative ?? 0), 0);
  const tabName = tab.tab === 0 ? B.starTab : `${tab.name} tab`;
  const pool = tab.tab === 0 ? 'star' : `${tab.name} tab`;
  const partAt = lastCovered >= 0 && path[lastCovered]?.band === 'part' ? lastCovered : -1;
  const part = partAt >= 0 ? path[partAt] : null;
  // The known points pay for every open step: the build is complete there, and the rest has no talent yet.
  const coveredAll = known > 0 && lastCovered >= 0 && !part && !path.some((s) => s.band === 'next');
  const completeAt = coveredAll ? (path[lastCovered]?.cumulative ?? 0) : 0;
  const cutText = coveredAll
    ? B.complete(completeAt, known - completeAt, atLeastOf(tab))
    : known > 0 && lastCovered >= 0
      ? `${B.endsHere(known, atLeastOf(tab), pool)}${part ? B.finishStep(part.need - (part.partNow ?? 0), partAt + 1) : ''}`
      : pathMarker(tab, age);
  const cutRow = (
    <li key="cut" className="bd-cut bv-marker" data-known={known > 0 ? 'yes' : 'no'}>
      <span className="bd-cut-line" aria-hidden="true" />
      <span className="bd-cut-t">
        {cutText}
        {tab.known?.kind === 'exact' || tab.known?.kind === 'lower-bound' ? (
          <span className="bd-asof"> · {asOfLine(age)}</span>
        ) : null}
      </span>
      <span className="bd-cut-line" aria-hidden="true" />
    </li>
  );
  const rows: React.ReactNode[] = [];
  let page: number | null = null;
  path.forEach((s, i) => {
    if (i === cut) rows.push(cutRow);
    if (tab.tab === 0 && s.page !== null && s.page !== page) {
      page = s.page;
      rows.push(
        <li key={`page-${s.page}-${s.key}`} className="bd-page">
          {B.page(s.page)}
        </li>,
      );
    }
    const st = stepStatus(s, i === lastNext);
    const added = s.band === 'part' ? (s.partNow ?? 0) : s.band === 'now' ? s.need : 0;
    const fill = s.band === 'done' ? s.goal : Math.min(s.goal, s.current + added);
    const range = s.band === 'done' ? n(s.goal) : `${n(s.from ?? s.current)} → ${n(s.goal)}`;
    rows.push(
      <li key={s.key} className="bd-step bv-ps" data-band={s.band}>
        <Order k={stepKind(s)} num={i + 1} />
        <span className="bd-mono" data-k={stepKind(s)} aria-hidden="true">
          {monogram(s.label)}
        </span>
        <span className="bd-step-main">
          <span className="bd-step-name bv-ps-name">{s.label}</span>
          <span className="bd-step-lv bv-ps-lv num">{range}</span>
          {s.note && s.band !== 'later' ? <span className="bd-xs bv-ps-note">{s.note}</span> : null}
        </span>
        <span className="bd-step-st">
          <span className={`bd-st bd-st--${st.tone}`}>{st.text}</span>
          {s.band !== 'later' && s.goal > 0 ? (
            <Meter
              value={fill}
              max={s.goal}
              label={`${s.label}: ${n(fill)} of ${n(s.goal)}`}
              tone={s.band === 'done' ? 'mint' : s.band === 'next' ? 'muted' : 'gold'}
            />
          ) : null}
        </span>
        <span className="bd-cum">
          {s.cumulative !== null ? (
            <>
              <b className="num">{n(s.cumulative)}</b>
              <span className="bd-xs">{B.pointsIn}</span>
            </>
          ) : null}
        </span>
      </li>,
    );
  });
  if (cut >= path.length && path.length > 0) rows.push(cutRow);
  return (
    <section className="bd-ladder" id={id} aria-labelledby={`${id}-h`} data-tab={tab.tab}>
      <div className="bd-ladder-h">
        <h3 id={`${id}-h`} className="a-h2">
          {B.ladderH(preset, tabName)}
        </h3>
        <span className="bd-xs">
          <span className="bd-spent num">{B.spent(tab.spent)}</span> ·{' '}
          {toFinish > 0 ? B.toFinish(toFinish) : B.finished}
        </span>
      </div>
      {path.length === 0 ? <p className="bd-xs">{W.buildPath.noPoints}</p> : null}
      {toFinish > 0 && !coveredAll ? <p className="bd-xs">{B.keepGoing}</p> : null}
      {path.length > 0 ? <ol className="bd-steps">{rows}</ol> : null}
      {tab.others.length > 0 ? (
        <p className="bd-xs">
          {B.alsoHas}: {tab.others.map((o) => `${o.label} ${n(o.level)}`).join(', ')}
        </p>
      ) : null}
    </section>
  );
}

/** The selected preset: the tab control, the book, the side panel, the attack bar and the ladder. */
function PresetBody({
  r,
  p,
  other,
}: {
  r: BuildRoadmapView;
  p: BuildPresetView;
  other: BuildPresetView | null;
}) {
  const [tabSel, setTabSel] = useState<number>(() => firstTab(p));
  const tabs = p.tabs;
  const all = [...tabs, ...(p.star ? [p.star] : [])];
  const tab = all.find((t) => t.tab === tabSel) ?? all[0];
  const pools = poolsOf(p);
  const otherTab =
    other && tab
      ? ([...other.tabs, ...(other.star ? [other.star] : [])].find((t) => t.tab === tab.tab) ?? null)
      : null;
  const items = useMemo(() => (tab ? bookOf(tab, otherTab) : []), [tab, otherTab]);
  const defaultSel = useMemo(() => {
    const path = tab?.path ?? [];
    const pick =
      path.find((s) => s.band === 'part') ??
      [...path].reverse().find((s) => s.band === 'now') ??
      path.find((s) => s.band === 'next') ??
      path.find((s) => s.band !== 'done') ??
      path[0];
    return pick?.key ?? null;
  }, [tab]);
  const [sel, setSel] = useState<string | null>(null);
  const picked = sel && (tab?.path ?? []).some((s) => s.key === sel) ? sel : defaultSel;
  const atk = p.attackBar ? p : other?.attackBar ? other : null;
  if (!tab) return null;
  const key = `bv-${r.index}-p${p.slot}`;
  const tabName = tab.tab === 0 ? B.starTab : `${tab.name} tab`;
  const tp = pointsOf(tab);
  return (
    <div className="bd-body">
      <div className="bd-top">
        <div className="bd-segs">
          {tabs.length > 0 ? (
            <fieldset className="bd-seg" aria-label={B.segTabs(p.heading)}>
              {tabs.map((t) => (
                <button
                  key={t.tab}
                  type="button"
                  className="bd-segbtn"
                  data-tab={t.tab}
                  aria-pressed={t.tab === tab.tab}
                  aria-controls={`${key}-t${t.tab}`}
                  onClick={() => {
                    setTabSel(t.tab);
                    setSel(null);
                  }}
                >
                  {spriteOf(`talent-tab-${t.tab}`) ? (
                    <Sprite name={`talent-tab-${t.tab}`} size={16} decorative />
                  ) : null}
                  {t.name}
                  {pointsOf(t) > 0 ? <span className="bd-segpts num">{n(pointsOf(t))}</span> : null}
                </button>
              ))}
            </fieldset>
          ) : null}
          {p.star ? (
            <>
              <fieldset className="bd-seg" aria-label={B.segStar(p.heading)}>
                <button
                  type="button"
                  className="bd-segbtn"
                  data-tab={0}
                  aria-pressed={tab.tab === 0}
                  aria-controls={`${key}-t0`}
                  onClick={() => {
                    setTabSel(0);
                    setSel(null);
                  }}
                >
                  {B.starTab}
                  {pools.star > 0 ? <span className="bd-segpts num">{n(pools.star)}</span> : null}
                </button>
              </fieldset>
            </>
          ) : null}
        </div>
        <p className="bd-xs bd-pools">
          {B.pools(pools.talent, pools.atLeast, tabs.length, p.star ? pools.star : null)}
        </p>
        <p className="bd-tabline">
          {B.tabLine(p.heading, tabName)}: <b>{tp > 0 ? B.toPlace(tp, atLeastOf(tab)) : B.noneToPlace}</b>
        </p>
      </div>
      <div className="bd-bookwrap">
        <Book items={items} sel={picked} onSel={setSel} label={B.book(tabName)} />
        <Legend />
      </div>
      <aside className="bd-side">
        <SidePanel tab={tab} stepKey={picked} />
        {atk ? <AttackBar p={atk} /> : null}
      </aside>
      <Ladder tab={tab} preset={p.heading} id={`${key}-t${tab.tab}`} />
    </div>
  );
}

function ComingUp({ r }: { r: BuildRoadmapView }) {
  if (r.comingUp.length === 0) return null;
  return (
    <section aria-labelledby={`bv-${r.index}-cu`} className="bd-coming">
      <h3 id={`bv-${r.index}-cu`} className="a-cap bd-cap">
        {W.comingUp.heading}
      </h3>
      <ul>
        {r.comingUp.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </section>
  );
}

/** The level-gate line (FR-C5): the class pick at Lv 10 and the second preset at 15. */
function GateRuler({ r }: { r: BuildRoadmapView }) {
  const gates = [
    { at: 10, word: 'class pick' },
    { at: 15, word: 'second preset' },
  ].filter((g) => r.level < g.at);
  if (gates.length === 0) return null;
  return (
    <p className="bd-xs bd-ruler">
      {gates.map((g) => `Lv ${g.at}: ${g.word} (${n(g.at - r.level)} levels to go)`).join(' · ')}
    </p>
  );
}

/**
 * M24 rule 4: the Build's Sources go in the footer's one quiet line (shell/page-sources). Without the
 * footer on screen (a bare Now screen) they stay in the tab, so the Source is never lost.
 */
function FooterSources({ children }: { children: ReactNode }) {
  const slot = useContext(PageSourcesSlot);
  return slot ? <PageSources>{children}</PageSources> : <p className="bd-xs">{children}</p>;
}

/** One character's whole Build. */
export function BuildRoadmap({ r, mismatch = null }: { r: BuildRoadmapView; mismatch?: string | null }) {
  const [order] = useState(() => {
    const first = firstPreset(r);
    return [...r.presets]
      .sort((a, b) => Number(b.slot === first) - Number(a.slot === first))
      .map((p) => p.slot);
  });
  const [sel, setSel] = useState<number>(order[0] ?? 0);
  const presets = order.flatMap((s) => r.presets.filter((p) => p.slot === s));
  const p = presets.find((x) => x.slot === sel) ?? presets[0];
  const other = presets.find((x) => x !== p) ?? null;
  const who = `${r.classLabel} ${r.level}`;
  return (
    <div className="build-view bd">
      {mismatch ? (
        <p className="bd-banner" role="note">
          <PixelArt name="now-glyph-wrench" decorative />
          <span>{mismatch}</span>
        </p>
      ) : null}
      {r.note ? <p className="bd-note">{r.note}</p> : <p className="sr-only bv-status">{r.status}</p>}
      <GateRuler r={r} />
      {!r.note && p ? (
        <>
          <fieldset className="bd-presets" aria-label={B.presets}>
            {presets.map((x) =>
              x === p ? (
                <PresetHero key={x.slot} p={x} who={who} onPick={() => setSel(x.slot)} />
              ) : (
                <PresetTile key={x.slot} p={x} onPick={() => setSel(x.slot)} />
              ),
            )}
          </fieldset>
          <PresetBody key={p.slot} r={r} p={p} other={other} />
        </>
      ) : null}
      <ComingUp r={r} />
      {r.quiet || r.source ? (
        <FooterSources>
          <span className="bd-quiet">
            {r.quiet ? `${r.quiet} ` : ''}
            {r.source ? <SourceLabel source={r.source} /> : null}
          </span>
        </FooterSources>
      ) : null}
    </div>
  );
}

/** The character page's Build tab. */
export function BuildTab({ view, index }: CharacterTabProps) {
  const actions = useNowActions();
  const r = view.builds.find((b) => b.index === index);
  if (!r) return <p className="bd-xs">No build data for this character yet.</p>;
  // The wrong-preset blocker's own words as the banner (FR-C3), when M9's blocker fires.
  const c = actions.result?.characters.find((x) => x.index === index);
  const wrong = c?.goals.find((g) => g.id === 'talent-presets.check.wrong-preset');
  return (
    <SaveAge.Provider value={view.saveAgeMinutes ?? null}>
      <BuildRoadmap r={r} mismatch={wrong ? wrong.nextAction.text : null} />
    </SaveAge.Provider>
  );
}
