// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/Systems.dc.html): the Systems place. Top to bottom: the title and one summary line;
// the answer, "Wasting now" (the screen's one frame: each wasting System's first step, fix before you
// leave) beside "Behind for World N" (each behind System's next step); then "All Systems", a dense
// grid of tiles by world with filters (Needs you, All, Not covered yet, Locked). Locked and "not covered
// yet" read differently: a lock glyph and "locked", or "not covered yet". Every word comes from the
// engine's `buildSystemsHubView` (`index`), never from this component.
// M25 (board m25/SystemsSearch.dc.html): a search field at the top (HubSearch.tsx: fuzzy, with a list of
// matches as you type) and quick filters by world and by status, combinable; the fragment keeps them
// (`#systems?q=…&w=…&s=…`, hub-search.ts), and a narrowed view hides the answer row so the matches sit
// right under the search.
import { HUB_WORDS } from '@idleon-forge/engine/now';
import {
  buildSystemsHubView,
  buildSystemsView,
  INDEX_WORDS,
  type IndexTileView,
} from '@idleon-forge/engine/systems-ui';
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Frame } from '../design/atoms/Surfaces';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { toNowPrefs } from '../now/prefs-store';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import { Pip } from './frame/SystemFrame';
import { HubSearch } from './HubSearch';
import {
  BUCKETS,
  bucketOf,
  formatHubHash,
  type HubQuery,
  isNarrowed,
  keeps,
  parseHubHash,
  type StatusBucket,
  searchSystems,
  toggle,
} from './hub-search';
import './hub.css';
import { SystemIcon } from './frame/SystemIcon';
import './frame/frame.css';

const go = (s: Session, id: string) => (e: MouseEvent) => {
  e.preventDefault();
  s.navigate({ place: 'system', id }, 'push');
};

/** Rule 3: the next three, the rest on demand. */
const WASTE_FOLD = 3;

// Read-only is grey: sky is for timers (QA P3).
const PIP = { wasting: 'coral', todo: 'gold', ok: 'mint', off: 'mut', readonly: 'mut' } as const;
const BUCKET_PIP = {
  wasting: 'coral',
  behind: 'gold',
  todo: 'gold',
  fine: 'mint',
  notCovered: 'mut',
  locked: 'mut',
} as const satisfies Record<StatusBucket, string>;

const readHash = (): HubQuery => {
  try {
    return parseHubHash(window.location.hash);
  } catch {
    return parseHubHash('');
  }
};
/** The view is kept in the fragment by replaceState: a link reopens it, Back is not flooded. */
const writeHash = (q: HubQuery) => {
  try {
    const next = formatHubHash(q);
    if (window.location.hash === next) return;
    const url = new URL(window.location.href);
    url.hash = next;
    window.history.replaceState(window.history.state, '', url);
  } catch {}
};

const LockGlyph = ({ size }: { size: number }) => (
  <svg
    className="sx-lock"
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 6 6"
    shapeRendering="crispEdges"
  >
    <rect x="1" y="0" width="4" height="1" fill="currentColor" />
    <rect x="1" y="1" width="1" height="2" fill="currentColor" />
    <rect x="4" y="1" width="1" height="2" fill="currentColor" />
    <rect x="0" y="3" width="6" height="3" fill="currentColor" />
  </svg>
);

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
        {/* M25: the count and the pip are one column that never shrinks, so they never cover the name. */}
        <span className="sx-tile__end">
          {t.count ? (
            <span className={`sx-tile__n ${t.tone === 'wasting' ? 'sf-t--coral' : 'sf-t--gold'}`}>
              {t.count}
            </span>
          ) : null}
          {t.status === 'locked' ? <LockGlyph size={12} /> : <Pip tone={PIP[t.tone]} />}
        </span>
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
  const [allWaste, setAllWaste] = useState(false);
  const waste = allWaste ? ix.wasting : ix.wasting.slice(0, WASTE_FOLD);
  const later = useMemo(() => v.later?.tiles ?? [], [v.later]);
  const laterTiles: IndexTileView[] = useMemo(
    () =>
      later.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        tone: 'off',
        count: null,
        sub: INDEX_WORDS.tileSub[t.status] ?? null,
        accessibleName: t.accessibleName,
        needsYou: false,
        readOnly: false,
      })),
    [later],
  );

  // M25: the search and filters, kept in the fragment.
  const [hq, setHq] = useState<HubQuery>(readHash);
  const update = useCallback((next: HubQuery) => {
    setHq(next);
    writeHash(next);
  }, []);
  useEffect(() => {
    const onHash = () => setHq(readHash());
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);
  const narrowed = isNarrowed(hq);
  /** Every tile with its world: the shown worlds, then the folded later ones (a filter reaches them). */
  const everything = useMemo(() => {
    const out: { t: IndexTileView; world: number }[] = ix.worlds.flatMap((w) =>
      w.tiles.map((t) => ({ t, world: w.world })),
    );
    later.forEach((t, i) => {
      const view = laterTiles[i];
      if (view) out.push({ t: view, world: t.world });
    });
    return out;
  }, [ix.worlds, later, laterTiles]);
  const worldIds = useMemo(
    () => [...new Set(everything.map((x) => x.world))].sort((a, b) => a - b),
    [everything],
  );
  const results = useMemo(
    () =>
      searchSystems(
        hq.q,
        everything.map((x) => ({ id: x.t.id, name: x.t.name, world: x.world })),
      ),
    [hq.q, everything],
  );
  const matched = useMemo(() => (hq.q.trim() ? new Set(results.map((r) => r.id)) : null), [hq.q, results]);
  const byId = useMemo(() => new Map(everything.map((x) => [x.t.id, x])), [everything]);
  const listResults = results.filter((r) => {
    const x = byId.get(r.id);
    return x ? keeps(x.t, x.world, hq, matched) : false;
  });
  /** Status counts under the query and the world filter (each bucket's own toggle left out). */
  const counts = useMemo(() => {
    const c = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<StatusBucket, number>;
    for (const x of everything)
      if (keeps(x.t, x.world, { ...hq, status: [] }, matched)) c[bucketOf(x.t)] += 1;
    return c;
  }, [everything, hq, matched]);
  const worlds = narrowed
    ? worldIds
        .map((world) => {
          const head = ix.worlds.find((w) => w.world === world);
          return {
            world,
            heading: head?.heading ?? INDEX_WORDS.worldName(world),
            sub: head?.sub ?? '',
            how: head?.how ?? null,
            shown: everything
              .filter((x) => x.world === world && keeps(x.t, x.world, hq, matched))
              .map((x) => x.t),
          };
        })
        .filter((w) => w.shown.length > 0)
    : ix.worlds.map((w) => ({ ...w, shown: w.tiles }));
  const shownN = worlds.reduce((n, w) => n + w.shown.length, 0);
  const open = (id: string) => s.navigate({ place: 'system', id }, 'push');
  return (
    <section className="systems-hub sx" aria-labelledby="systems-h">
      <div className="sx-title">
        <h2 id="systems-h" className="a-h1" data-place-heading tabIndex={-1}>
          {HUB_WORDS.title}
        </h2>
        <p className="sf-muted">{ix.summary}</p>
      </div>

      <HubSearch query={hq.q} onQuery={(q) => update({ ...hq, q })} results={listResults} onOpen={open} />

      {!narrowed && (ix.wasting.length > 0 || ix.behind.length > 0) ? (
        <div className={`sx-top${ix.wasting.length > 0 && ix.behind.length > 0 ? ' sx-top--two' : ''}`}>
          {ix.wasting.length > 0 ? (
            <Frame tone="coral" pad className="sx-waste" aria-labelledby="sy-wasting-h">
              <div className="sf-sec__head">
                <h3 id="sy-wasting-h" className="a-cap sf-t--coral">
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
                      className={`a-btn ${i === 0 ? 'a-btn--primary' : 'a-btn--ghost'} sx-waste__go`}
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
            </Frame>
          ) : null}
          {ix.behind.length > 0 && ix.behindTitle ? (
            <section className="sf-sec sx-behind" aria-labelledby="sx-behind-h">
              <div className="sf-sec__head">
                <h3 id="sx-behind-h" className="a-h2">
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
          <h3 id="sy-all-h" className="a-h2" tabIndex={-1}>
            {INDEX_WORDS.allTitle}
          </h3>
          {narrowed ? <span className="sf-hint">{INDEX_WORDS.shown(shownN, everything.length)}</span> : null}
        </div>
        <div className="sx-filters">
          <fieldset className="sx-fset">
            <legend className="sx-fset__legend">{INDEX_WORDS.worldLegend}</legend>
            <div className="sx-chips">
              {worldIds.map((w) => {
                const on = hq.worlds.includes(w);
                return (
                  <button
                    key={w}
                    type="button"
                    className={`sx-chip${on ? ' sx-chip--on' : ''}`}
                    aria-pressed={on}
                    aria-label={INDEX_WORDS.worldName(w)}
                    onClick={() => update({ ...hq, worlds: toggle(hq.worlds, w, worldIds) })}
                  >
                    {INDEX_WORDS.worldShort(w)}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <fieldset className="sx-fset">
            <legend className="sx-fset__legend">{INDEX_WORDS.statusLegend}</legend>
            <div className="sx-chips">
              {BUCKETS.map((b) => {
                const on = hq.status.includes(b);
                return (
                  <button
                    key={b}
                    type="button"
                    className={`sx-chip${on ? ' sx-chip--on' : ''}`}
                    aria-pressed={on}
                    onClick={() => update({ ...hq, status: toggle(hq.status, b, BUCKETS) })}
                  >
                    {b === 'locked' ? <LockGlyph size={10} /> : <Pip tone={BUCKET_PIP[b]} />}
                    {INDEX_WORDS.statusFilters[b]} <span className="sx-chip__n">{counts[b]}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
          {hq.worlds.length > 0 || hq.status.length > 0 ? (
            <button
              type="button"
              className="sf-link sf-linkbtn sx-clear"
              onClick={() => update({ ...hq, worlds: [], status: [] })}
            >
              {INDEX_WORDS.clearAll}
            </button>
          ) : null}
        </div>

        {worlds.map((w) => (
          <section key={w.world} className="sx-world" aria-labelledby={`world-${w.world}-h`}>
            <div className="sx-world__head">
              <h4 id={`world-${w.world}-h`} className="sx-world__h">
                {w.heading}
              </h4>
              <span className="sf-hint">{w.sub}</span>
            </div>
            {w.how ? (
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
        {narrowed && worlds.length === 0 ? (
          <div className="sx-empty" role="status">
            <p className="sx-empty__title">{INDEX_WORDS.emptyTitle}</p>
            <p className="sf-muted">
              {hq.q.trim() ? INDEX_WORDS.emptyQuery(hq.q.trim()) : INDEX_WORDS.emptyFilters}{' '}
              {hq.q.trim() ? INDEX_WORDS.emptyHint : INDEX_WORDS.emptyHintFilters}
            </p>
            <div className="sx-empty__do">
              {hq.q.trim() ? (
                <button type="button" className="a-btn a-btn--ghost" onClick={() => update({ ...hq, q: '' })}>
                  {INDEX_WORDS.search.clearQuery}
                </button>
              ) : null}
              {hq.worlds.length > 0 || hq.status.length > 0 ? (
                <button
                  type="button"
                  className="a-btn a-btn--ghost"
                  onClick={() => update({ ...hq, worlds: [], status: [] })}
                >
                  {INDEX_WORDS.clearAll}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {laterTiles.length > 0 && !narrowed && v.later ? (
          <details className="sy-later">
            <summary>{v.later.label}</summary>
            <ul className="sx-tiles">
              {laterTiles.map((t) => (
                <Tile key={t.id} t={t} s={s} />
              ))}
            </ul>
          </details>
        ) : null}
        {v.beyond && !narrowed ? <p className="sf-muted">{v.beyond}</p> : null}
        {v.otherGaps.length > 0 && !narrowed ? (
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
          {ix.worlds.some((w) => w.tiles.some((t) => t.readOnly)) ? (
            <span>
              <Pip tone="mut" />
              {INDEX_WORDS.legend.readOnly}
            </span>
          ) : null}
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
