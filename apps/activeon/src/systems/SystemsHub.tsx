// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/Systems.dc.html): the Systems place. Top to bottom: the title and one summary line;
// the answer, "Wasting now" (the screen's one frame: each wasting System's first step, fix before you
// leave) beside "Behind for World N" (each behind System's next step); then "All Systems", a dense
// grid of tiles by world with filters (Needs you, All, Not covered yet, Locked). Locked and "not covered
// yet" read differently: a lock glyph and "locked", or "not covered yet". Every word comes from the
// engine's `buildSystemsHubView` (`index`), never from this component.
import { HUB_WORDS, type TileStatus, type TileView } from '@idleon-forge/engine/now';
import {
  buildSystemsHubView,
  buildSystemsView,
  INDEX_WORDS,
  type IndexTileView,
} from '@idleon-forge/engine/systems-ui';
import { type MouseEvent, useMemo, useState } from 'react';
import { StatusGlyph as StatusMark } from '../design/atoms';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { toNowPrefs } from '../now/prefs-store';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import { Pip } from './frame/SystemFrame';
import './hub.css';
import { SystemIcon } from './frame/SystemIcon';
import './frame/frame.css';

/** The status glyph and word (DS-8): the design system's StatusGlyph atom. */
export function StatusGlyph({ status, word }: { status: TileStatus; word: string }) {
  return <StatusMark status={status} word={word} />;
}

/** The reason line; a leading piece equal to the status word isn't said twice on screen. */
export function Reason({ tile }: { tile: TileView }) {
  const parts = tile.reason[0]?.text === tile.statusWord.text ? tile.reason.slice(2) : tile.reason;
  if (parts.length === 0) return null;
  return (
    <span className="sy-reason">
      {parts.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reorder
        <span key={i}>{p.text}</span>
      ))}
    </span>
  );
}

const go = (s: Session, id: string) => (e: MouseEvent) => {
  e.preventDefault();
  s.navigate({ place: 'system', id }, 'push');
};

/** Rule 3: the next three, the rest on demand. */
const WASTE_FOLD = 3;

type Filter = 'needs' | 'all' | 'notCovered' | 'locked';
const FILTERS: readonly Filter[] = ['needs', 'all', 'notCovered', 'locked'];
const keep = (f: Filter) => (t: IndexTileView) =>
  f === 'all'
    ? true
    : f === 'needs'
      ? t.needsYou
      : f === 'notCovered'
        ? t.status === 'not-covered'
        : t.status === 'locked';
const PIP = { wasting: 'coral', todo: 'gold', ok: 'mint', off: 'mut' } as const;

function Tile({ t, s }: { t: IndexTileView; s: Session }) {
  const off = t.tone === 'off';
  return (
    <li>
      <a
        className={`sx-tile${off ? ' sx-tile--off' : ''}${t.status === 'locked' ? ' sx-tile--locked' : ''}`}
        href={formatRoute({ place: 'system', id: t.id })}
        aria-label={t.accessibleName}
        onClick={go(s, t.id)}
      >
        <span className="sx-tile__ic">
          <SystemIcon id={t.id} size={24} />
        </span>
        <span className="sx-tile__text">
          <span className="sx-tile__name">{t.name}</span>
          {t.sub ? <span className="sx-tile__sub">{t.sub}</span> : null}
        </span>
        {t.count ? (
          <span className={`sx-tile__n ${t.tone === 'wasting' ? 'sf-t--coral' : 'sf-t--gold'}`}>
            {t.count}
          </span>
        ) : null}
        {t.status === 'locked' ? (
          <svg
            className="sx-lock"
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 6 6"
            shapeRendering="crispEdges"
          >
            <rect x="1" y="0" width="4" height="1" fill="currentColor" />
            <rect x="1" y="1" width="1" height="2" fill="currentColor" />
            <rect x="4" y="1" width="1" height="2" fill="currentColor" />
            <rect x="0" y="3" width="6" height="3" fill="currentColor" />
          </svg>
        ) : (
          <Pip tone={PIP[t.tone]} />
        )}
      </a>
    </li>
  );
}

export function SystemsHub({ s }: { s: Session }) {
  // The view is built here, in the lazy hub, so it never weighs on the first load (M21 TR-12).
  const v = useMemo(() => {
    const prefs = toNowPrefs(s.prefs.data, null);
    const ui = { now: s.now, lastCloudSave: s.lastCloudSave };
    return buildSystemsHubView(s.result, prefs, ui, buildSystemsView(s.result, prefs, ui));
  }, [s.result, s.prefs.data, s.now, s.lastCloudSave]);
  const ix = v.index;
  const [filter, setFilter] = useState<Filter>('all');
  const [allWaste, setAllWaste] = useState(false);
  const waste = allWaste ? ix.wasting : ix.wasting.slice(0, WASTE_FOLD);
  const worlds = ix.worlds
    .map((w) => ({ ...w, shown: w.tiles.filter(keep(filter)) }))
    .filter((w) => w.shown.length > 0 || (filter === 'all' && w.how));
  const later = v.later?.tiles ?? [];
  return (
    <section className="systems-hub sx" aria-labelledby="systems-h">
      <div className="sx-title">
        <h2 id="systems-h" className="sx-h1" data-place-heading tabIndex={-1}>
          {HUB_WORDS.title}
        </h2>
        <p className="sf-muted">{ix.summary}</p>
      </div>

      {ix.wasting.length > 0 || ix.behind.length > 0 ? (
        <div className={`sx-top${ix.wasting.length > 0 && ix.behind.length > 0 ? ' sx-top--two' : ''}`}>
          {ix.wasting.length > 0 ? (
            <section className="a-frame sx-waste" aria-labelledby="sy-wasting-h">
              <div className="sf-sec__head">
                <h3 id="sy-wasting-h" className="sf-cap sf-t--coral">
                  {INDEX_WORDS.wastingTitle}
                </h3>
                <span className="sf-muted">{INDEX_WORDS.wastingHint}</span>
              </div>
              <ul className="sx-waste__rows">
                {waste.map((w, i) => (
                  <li key={w.id} className="sx-waste__row">
                    <span className="sx-waste__ic">
                      <SystemIcon id={w.id} size={32} />
                    </span>
                    <span className="sx-waste__text">
                      <span className="sx-waste__title">{w.step?.text ?? w.name}</span>
                      <span className={`sf-small ${i === 0 ? 'sf-t--coral' : 'sf-muted'}`}>
                        {[w.step?.who?.label, w.sub].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <a
                      className={`a-btn ${i === 0 ? 'a-btn--primary' : 'a-btn--quiet'} sx-waste__go`}
                      href={formatRoute({ place: 'system', id: w.id })}
                      onClick={go(s, w.id)}
                      aria-label={`${i === 0 ? INDEX_WORDS.seeFix : INDEX_WORDS.open}: ${w.name}`}
                    >
                      {i === 0 ? INDEX_WORDS.seeFix : INDEX_WORDS.open} →
                    </a>
                  </li>
                ))}
              </ul>
              {ix.wasting.length > WASTE_FOLD ? (
                <button
                  type="button"
                  className="sf-link sf-linkbtn"
                  aria-expanded={allWaste}
                  onClick={() => setAllWaste((x) => !x)}
                >
                  {allWaste ? INDEX_WORDS.fewer : INDEX_WORDS.moreWasting(ix.wasting.length - WASTE_FOLD)}
                </button>
              ) : null}
            </section>
          ) : null}
          {ix.behind.length > 0 && ix.behindTitle ? (
            <section className="sf-sec sx-behind" aria-labelledby="sx-behind-h">
              <div className="sf-sec__head">
                <h3 id="sx-behind-h" className="sf-h">
                  {ix.behindTitle}
                </h3>
                <span className="sf-hint">{INDEX_WORDS.behindHint}</span>
              </div>
              <ul className="sf-hair">
                {ix.behind.map((b) => {
                  return (
                    <li key={b.id}>
                      <a
                        className="sx-behind__row"
                        href={formatRoute({ place: 'system', id: b.id })}
                        onClick={go(s, b.id)}
                      >
                        <span className="sx-behind__top">
                          <span className="sf-strong">{b.name}</span>
                          {b.by ? <span className="sf-hint">{b.by}</span> : null}
                        </span>
                        {b.step ? (
                          <span className="sx-behind__step">
                            <Pip tone="gold" />
                            {b.step.who ? (
                              <WhoGlyph
                                family={b.step.who.family}
                                classLabel={b.step.who.label}
                                scale={1}
                                decorative
                              />
                            ) : null}
                            <span className="sf-grow">
                              {b.step.who ? `${b.step.who.label}: ` : ''}
                              {b.step.text}
                            </span>
                            <span className="sf-muted" aria-hidden="true">
                              ›
                            </span>
                          </span>
                        ) : null}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      <section className="sx-all" aria-labelledby="sy-all-h">
        <div className="sx-all__head">
          <h3 id="sy-all-h" className="sf-h" tabIndex={-1}>
            {INDEX_WORDS.allTitle}
          </h3>
          <fieldset className="a-seg sx-seg">
            <legend className="sr-only">{INDEX_WORDS.filterLabel}</legend>
            {FILTERS.map((f) => {
              const n = ix.counts[f];
              const on = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  className={`a-seg__option sx-seg__opt sf-seg-opt${on ? ' a-seg__option--on' : ''}`}
                  aria-pressed={on}
                  onClick={() => setFilter(f)}
                >
                  {INDEX_WORDS.filters[f]}{' '}
                  <span className={f === 'needs' && n > 0 ? 'sf-t--gold' : ''}>{n}</span>
                </button>
              );
            })}
          </fieldset>
        </div>

        {worlds.map((w) => (
          <section key={w.world} className="sx-world" aria-labelledby={`world-${w.world}-h`}>
            <div className="sx-world__head">
              <h4 id={`world-${w.world}-h`} className="sx-world__h">
                {w.heading}
              </h4>
              <span className="sf-hint">{w.sub}</span>
            </div>
            {w.how && (filter === 'all' || filter === 'locked') ? (
              <p className="sx-how">
                <Pip tone="gold" />
                <span className="sf-grow">{w.how}</span>
                <a
                  className="sf-link"
                  href={formatRoute({ place: 'map', mapIndex: null })}
                  onClick={(e) => {
                    e.preventDefault();
                    s.navigate({ place: 'map', mapIndex: null }, 'push');
                  }}
                >
                  {INDEX_WORDS.seeOnMap} ›
                </a>
              </p>
            ) : null}
            <ul className="sx-tiles">
              {w.shown.map((t) => (
                <Tile key={t.id} t={t} s={s} />
              ))}
            </ul>
          </section>
        ))}
        {worlds.length === 0 ? <p className="sf-muted">{INDEX_WORDS.nothingHere}</p> : null}

        {later.length > 0 && filter === 'all' && v.later ? (
          <details className="sy-later">
            <summary>{v.later.label}</summary>
            <ul className="sx-tiles">
              {later.map((t) => (
                <Tile
                  key={t.id}
                  t={{
                    id: t.id,
                    name: t.name,
                    status: t.status,
                    tone: 'off',
                    count: null,
                    sub: INDEX_WORDS.tileSub[t.status] ?? null,
                    accessibleName: t.accessibleName,
                    needsYou: false,
                  }}
                  s={s}
                />
              ))}
            </ul>
          </details>
        ) : null}
        {v.beyond && filter === 'all' ? <p className="sf-muted">{v.beyond}</p> : null}
        {v.otherGaps.length > 0 && filter === 'all' ? (
          <section className="sy-gaps" aria-labelledby="other-gaps-h">
            <h4 id="other-gaps-h" className="sx-world__h">
              {HUB_WORDS.otherGaps}
            </h4>
            <ul>
              {v.otherGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="sf-legend" aria-hidden="true">
          <span>
            <Pip tone="coral" />
            {INDEX_WORDS.legend.wasting}
          </span>
          <span>
            <Pip tone="gold" />
            {INDEX_WORDS.legend.todo}
          </span>
          <span>
            <Pip tone="mint" />
            {INDEX_WORDS.legend.ok}
          </span>
          <span>
            <Pip tone="mut" />
            {INDEX_WORDS.legend.notCovered}
          </span>
          <span>
            <svg width="10" height="10" viewBox="0 0 6 6" shapeRendering="crispEdges" aria-hidden="true">
              <rect x="1" y="0" width="4" height="1" fill="currentColor" />
              <rect x="1" y="1" width="1" height="2" fill="currentColor" />
              <rect x="4" y="1" width="1" height="2" fill="currentColor" />
              <rect x="0" y="3" width="6" height="3" fill="currentColor" />
            </svg>
            {INDEX_WORDS.legend.locked}
          </span>
        </p>
      </section>
    </section>
  );
}
