// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Map place (M21 FR-M1 to FR-M5, area M), redrawn by M24 to the `Map`, `MapConstellations`,
// `MapDeathNote`, `MapCards` and `MapW4` boards. Four tabs that really switch the content (rule 3):
// - Route: the next door first in its one frame (the pusher's kills and time), then each world as a tile
//   with its boss gate and keys, the route path in walking order (the door's kills above each stop), the
//   side maps and the skilling maps; a world not open yet shows its door ladder. From four open worlds a
//   World switch shows one world at a time (`MapW4`);
// - Constellations: what starts or claims the next points, the next three, every constellation by world;
// - Death Note: the building's next level or the closest rank, the ranks map by map, the next level's cost;
// - Cards: the closest card level-up, the next three, a card on every fighting map.
// Every map node is a button that opens its sheet (FR-M2, `#map-<index>`). It renders `buildMapView`'s
// view and the engine's own Star Sign and Cards views, and computes nothing (D-18). The map is facts, not
// advice (FR-M7): the only steps are the engine's own Next Actions.
import {
  buildMapView,
  type MapBandView,
  type MapNodeView,
  type MapPlaceView,
  type MapStarView,
  MAP_WORDS as W,
} from '@idleon-forge/engine/map';
import type { NowView } from '@idleon-forge/engine/now';
import type { Goal } from '@idleon-forge/engine/result';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { Sprite } from '../art/sprites/Sprite';
import { PixelArt } from '../design/art/PixelArt';
import { cx, Frame, Meter, SegmentedControl, Sheet, Tabs, Tag } from '../design/atoms';
import { localOffsetMinutes } from '../design/format';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import { useNowSettings } from '../now/settings/context';
import { PageSources } from '../shell/page-sources';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import './map.css';
import { MAP_UI_WORDS as U } from './words';

type Tab = 'route' | 'constellations' | 'deathNote' | 'cards';
type Who = MapNodeView['here'][number];
type Sheet_ = MapPlaceView['sheets'][number];
type Vars = CSSProperties & Record<`--${string}`, string | number>;

const familyOf = (view: NowView, index: number): ClassFamily => view.families?.[index] ?? 'beginner';
const worldNo = (w: number) => (w >= 1 && w <= 7 ? w : 1);
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const allGoals = (s: Session): Goal[] => [
  ...s.result.account.goals,
  ...s.result.characters.flatMap((c) => c.goals),
];
const goalOf = (s: Session, id: string) => allGoals(s).find((g) => g.id === id) ?? null;

/** Who-glyphs stacked, at most `max`, then "+n". */
function Stack({ who, view, max = 3 }: { who: Who[]; view: NowView; max?: number }) {
  if (!who.length) return null;
  return (
    <span className="map-stack" aria-hidden="true">
      {who.slice(0, max).map((w) => (
        <WhoGlyph
          key={w.index}
          family={familyOf(view, w.index)}
          classLabel={w.classLabel}
          scale={1}
          decorative
        />
      ))}
      {who.length > max ? <span className="map-stack-n num">+{who.length - max}</span> : null}
    </span>
  );
}

/** A node's square: its state as a fill and a glyph (never colour alone; the button names it in words). */
function Dot({ n, next, side }: { n: MapNodeView; next?: boolean; side?: boolean }) {
  const look =
    n.state === 'town'
      ? 'town'
      : n.state === 'cleared'
        ? 'open'
        : n.state === 'frontier'
          ? 'front'
          : next
            ? 'next'
            : n.state === 'locked'
              ? side
                ? 'side'
                : 'shut'
              : n.state === 'reached'
                ? 'reached'
                : 'none';
  return (
    <span className={cx('map-dot', `is-${look}`)} aria-hidden="true">
      {look === 'town' ? (
        <PixelArt name="v2-map-town" decorative />
      ) : look === 'open' ? (
        <PixelArt name="ui-check" decorative />
      ) : look === 'front' ? (
        <PixelArt name="v2-map-flag" decorative />
      ) : null}
    </span>
  );
}

function Node({
  n,
  view,
  need,
  next,
  side,
  labelled,
  onOpen,
  picked,
}: {
  n: MapNodeView;
  view: NowView;
  need: string | null;
  next?: boolean;
  side?: boolean;
  labelled: boolean;
  onOpen(i: number): void;
  picked: number | null;
}) {
  const named = labelled || n.state === 'town' || n.state === 'frontier' || next || n.here.length > 0;
  return (
    <li className="map-nd">
      <button
        type="button"
        className={cx('map-nd-b', picked === n.mapIndex && 'is-picked', next && 'is-next')}
        aria-label={n.label}
        onClick={() => onOpen(n.mapIndex)}
      >
        <span className="map-nd-who">
          <Stack who={n.here} view={view} />
        </span>
        <span
          className={cx('map-nd-k num', (next || n.state === 'frontier') && 'is-gold')}
          aria-hidden="true"
        >
          {need ?? ''}
        </span>
        <Dot n={n} next={next} side={side} />
        <span className={cx('map-nd-l', (next || n.state === 'frontier') && 'is-gold')} aria-hidden="true">
          {named ? n.name : ''}
        </span>
      </button>
    </li>
  );
}

/** A world not open yet: its fighting maps in order, each with the door kills of the map before it. */
function ladder(b: MapBandView): { node: MapNodeView; need: string | null; next: boolean }[] {
  if (b.route.length > 2 && b.state !== 'next') return b.route;
  const fights = b.nodes.filter((n) => n.kind === 'town' || n.kind === 'fight');
  return fights.map((node, i) => ({
    node,
    need: i > 0 ? (fights[i - 1]?.doorTag ?? null) : null,
    next: false,
  }));
}

function WorldTile({
  b,
  view,
  onOpen,
  picked,
}: {
  b: MapBandView;
  view: NowView;
  onOpen(i: number): void;
  picked: number | null;
}) {
  if (b.beyond)
    return (
      <section className="a-tile map-tile is-beyond" aria-label={b.heading}>
        <div className="map-tile-h">
          <span className="map-crest num">5+</span>
          <h3 className="a-h2">{b.heading}</h3>
          <span className="map-line">{b.line}</span>
        </div>
      </section>
    );
  const route = ladder(b);
  const onPath = new Set(route.map((r) => r.node.mapIndex));
  const side = b.state === 'next' ? [] : b.side.filter((n) => !onPath.has(n.mapIndex));
  const skill = b.state === 'next' ? [] : b.skill;
  const keys = b.gate?.lines.find((l) => l.kind === 'keys');
  const crystal = b.gate?.lines.find((l) => l.kind === 'crystal');
  return (
    <section
      className={cx('a-tile map-tile', `map-w${worldNo(b.world)}`, `is-${b.state}`)}
      aria-label={b.heading}
    >
      <div className="map-tile-top">
        <div className="map-tile-h">
          <span className="map-crest num">{b.world}</span>
          <h3 className="a-h2">{b.heading}</h3>
          <span className="map-line">{b.line}</span>
        </div>
        {b.gate ? (
          <div className="a-tile2 map-boss">
            <Sprite name="item-key" size={32} decorative />
            <span className="map-boss-b">
              <b>{U.boss(b.gate.boss)}</b>
              {crystal ? <span className="map-boss-l">{crystal.text}</span> : null}
              {keys ? (
                <span className={cx('map-boss-k', /^No one/.test(keys.text) ? 'is-muted' : 'is-gold')}>
                  {keys.text}
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </div>
      {route.length ? (
        <ol className="map-row" aria-label={W.mainRoute}>
          {route.map((r) => (
            <Node
              key={r.node.mapIndex}
              n={r.node}
              view={view}
              need={r.node.state === 'cleared' ? null : r.need}
              next={r.next}
              labelled={b.state === 'next'}
              onOpen={onOpen}
              picked={picked}
            />
          ))}
        </ol>
      ) : null}
      {b.state === 'next' ? <p className="map-note">{U.ladderNote}</p> : null}
      {side.length ? (
        <div className="map-sub">
          <span className="map-sub-k">{U.sideMaps}</span>
          <ol className="map-row" aria-label={U.sideMaps}>
            {side.map((n) => (
              <Node
                key={n.mapIndex}
                n={n}
                view={view}
                need={null}
                side
                labelled={false}
                onOpen={onOpen}
                picked={picked}
              />
            ))}
          </ol>
        </div>
      ) : null}
      {skill.length ? (
        <div className="map-sub">
          <span className="map-sub-k">{U.skillMaps}</span>
          <ol className="map-row" aria-label={U.skillMaps}>
            {skill.map((n) => (
              <Node
                key={n.mapIndex}
                n={n}
                view={view}
                need={n.state === 'cleared' || n.state === 'reached' ? null : n.doorTag}
                labelled={false}
                onOpen={onOpen}
                picked={picked}
              />
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function RouteHero({ v, view }: { v: MapPlaceView; view: NowView }) {
  const f = v.frontier;
  if (!f) {
    const lit = v.worlds.find((b) => b.gate?.lit);
    const ring = v.overlays.find((o) => o.overlay === 'route');
    return (
      <Frame tone="gold" className="map-hero" aria-label={U.heroGateCap}>
        <span className="map-hero-b">
          <span className="a-cap map-cap">{U.heroGateCap}</span>
          <span className="map-hero-a">
            {lit?.gate ? W.ringGate(lit.gate.boss) : (ring?.ringText ?? W.ringNone)}
          </span>
        </span>
      </Frame>
    );
  }
  return (
    <Frame tone="gold" className="map-hero" aria-label={U.heroCap}>
      <div className="map-hero-row">
        <span className="map-hero-b">
          <span className="a-cap map-cap">{U.heroCap}</span>
          <span className="map-hero-a">{f.step}</span>
          {f.who ? (
            <span className="map-hero-w">
              <WhoGlyph
                family={familyOf(view, f.who.index)}
                classLabel={f.who.classLabel}
                scale={1}
                decorative
              />
              {U.heroWho(f.who.label, f.when)}
            </span>
          ) : null}
        </span>
        <span className="map-hero-n">
          <span className="map-big num">{fmt(f.done)}</span>
          <span className="map-quiet">{U.heroOf(f.requirement)}</span>
        </span>
      </div>
      <Meter value={f.done} max={f.requirement} label={f.killsText} />
    </Frame>
  );
}

function RouteTab({
  v,
  view,
  onOpen,
  picked,
  world,
}: {
  v: MapPlaceView;
  view: NowView;
  onOpen(i: number): void;
  picked: number | null;
  world: number | null;
}) {
  const bands = world === null ? v.worlds : v.worlds.filter((b) => b.world === world);
  return (
    <div className="map-panel">
      <PageSources>{U.srcRoute}</PageSources>
      <RouteHero v={v} view={view} />
      <div className="map-legend-row">
        <span className="map-quiet">{W.tapHint}</span>
        <ul className="map-legend" aria-label={U.legendOpen}>
          <li>
            <span className="map-key is-open" aria-hidden="true" />
            {U.legendOpen}
          </li>
          <li>
            <span className="map-key is-shut" aria-hidden="true" />
            {U.legendShut}
          </li>
          <li>
            <span className="map-key is-side" aria-hidden="true" />
            {U.legendSide}
          </li>
          <li>
            <span className="map-key is-none" aria-hidden="true" />
            {U.legendNoDoor}
          </li>
        </ul>
      </div>
      {bands.map((b) => (
        <WorldTile key={b.world} b={b} view={view} onOpen={onOpen} picked={picked} />
      ))}
    </div>
  );
}

// ---- Constellations ----

function StarTile({ x }: { x: MapStarView }) {
  const short =
    x.state === 'claimed'
      ? U.starClaimed
      : x.state === 'ready'
        ? U.starReady(x.progress)
        : x.state === 'reach'
          ? U.starReach(x.progress)
          : U.starFar;
  return (
    <li
      className={cx('ms-star', `is-${x.state}`)}
      title={`${x.code}: ${x.requirement}${x.map ? ` · ${x.map}` : ''}`}
    >
      <Sprite name="item-star" size={24} decorative />
      <span className="ms-code">{x.code}</span>
      <span className="ms-short">{short}</span>
      <span className="sr-only">
        {x.requirement}
        {x.map ? `, ${x.map}` : ''}
      </span>
    </li>
  );
}

/**
 * QA P2 (no text walls): the hero's why line keeps its first sentences up to about two lines; the rest
 * (how Star Chart Points work, what comes after) is the Star Signs page's to say.
 */
export function leadOf(text: string, max = 200): string {
  let out = '';
  for (const p of text.split(/(?<=[.!?])\s+/)) {
    if (out && out.length + 1 + p.length > max) break;
    out = out ? `${out} ${p}` : p;
  }
  return out;
}

function StarsTab({ v, s }: { v: MapPlaceView; s: Session }) {
  const sv = s.result.starSigns ?? null;
  const stars = v.stars ?? [];
  const telescope = sv && !sv.questDone ? goalOf(s, 'star-signs.goal.telescope') : null;
  const next = sv?.next.slice(0, 3) ?? [];
  const lead = telescope?.nextAction.text ?? next[0]?.text ?? null;
  const why = telescope?.nextAction.why ?? sv?.plan ?? null;
  const worlds = [...new Set(stars.map((x) => x.world))];
  return (
    <div className="map-panel">
      <PageSources>{U.srcStars}</PageSources>
      {lead ? (
        <Frame tone="gold" className="map-hero" aria-label={U.starsCap}>
          <div className="map-hero-row">
            <span className="map-hero-ic" aria-hidden="true">
              <Sprite name="sys-star-signs" size={48} decorative />
            </span>
            <span className="map-hero-b">
              <span className="a-cap map-cap">{U.starsCap}</span>
              <span className="map-hero-a">{lead}</span>
              {why ? <span className="map-quiet">{leadOf(why)}</span> : null}
            </span>
            {sv?.milestone ? <span className="map-hero-m">{sv.milestone}</span> : null}
          </div>
        </Frame>
      ) : null}
      {next.length ? (
        <section className="map-sec" aria-labelledby="ms-next-h">
          <h3 id="ms-next-h" className="a-h2">
            {U.starsNext}
          </h3>
          <ol className="ms-next">
            {next.map((n, i) => {
              const x = stars.find((y) => y.code === n.name);
              return (
                <li key={n.name}>
                  <span className={cx('ms-n', i === 0 && 'is-first')} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="ms-c">{n.name}</span>
                  <span className="ms-t">{n.text}</span>
                  <span className={cx('ms-p', x?.state === 'ready' && 'is-gold')}>{x ? x.progress : ''}</span>
                  <span className="ms-pts">
                    <b>{U.starsPoints(n.points)}</b>
                    <span>{U.pointsWord}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}
      {stars.length ? (
        <section className="map-sec" aria-labelledby="ms-all-h">
          <div className="map-sec-h">
            <h3 id="ms-all-h" className="a-h2">
              {U.starsAll}
            </h3>
            <ul className="map-legend">
              <li>
                <span className="ms-key is-claimed" aria-hidden="true" />
                {U.legendClaimed}
              </li>
              <li>
                <span className="ms-key is-ready" aria-hidden="true" />
                {U.legendReady}
              </li>
              <li>
                <span className="ms-key is-reach" aria-hidden="true" />
                {U.legendReach}
              </li>
              <li>
                <span className="ms-key is-far" aria-hidden="true" />
                {U.legendFar}
              </li>
            </ul>
          </div>
          {worlds.map((w) => {
            const these = stars.filter((x) => x.world === w);
            const band = v.worlds.find((b) => b.world === w);
            return (
              <div key={w} className={cx('a-tile map-tile', `map-w${worldNo(w)}`)}>
                <div className="map-tile-h">
                  <span className="map-crest num">{w}</span>
                  <h4 className="map-h4">{band?.heading ?? U.worldTab(w)}</h4>
                  <span className="map-line">
                    {U.starsLine(
                      these.filter((x) => x.state === 'ready').length,
                      these.filter((x) => x.state === 'reach').length,
                    )}
                  </span>
                </div>
                <ul className="ms-grid">
                  {these.map((x) => (
                    <StarTile key={x.code} x={x} />
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}

// ---- Death Note ----

function DeathNoteTab({ v, s }: { v: MapPlaceView; s: Session }) {
  const b = v.deathNoteBuilding;
  const goal = goalOf(s, 'death-note.check.build') ?? goalOf(s, 'death-note.check.build-slot');
  const closest = v.deathNote[0] ?? null;
  const top = v.deathNote.reduce((m, r) => Math.max(m, r.ranks.length), 0);
  const ranks = v.deathNote.find((r) => r.ranks.length === top)?.ranks ?? [];
  const ticks = ['0', ...ranks.slice(0, -1).map((r) => (r >= 1e6 ? `${r / 1e6}M` : `${r / 1000}k`))];
  return (
    <div className="map-panel">
      <PageSources>{U.srcDeathNote}</PageSources>
      {goal || closest ? (
        <Frame tone="gold" className="map-hero" aria-label={goal ? U.dnCap : U.dnCloseCap}>
          <div className="map-hero-row">
            <span className="map-hero-ic" aria-hidden="true">
              <Sprite name="sys-death-note" size={48} decorative />
            </span>
            <span className="map-hero-b">
              <span className="a-cap map-cap">{goal ? U.dnCap : U.dnCloseCap}</span>
              <span className="map-hero-a">
                {goal ? goal.nextAction.text : `${closest?.map}: ${closest?.next}`}
              </span>
              {goal ? <span className="map-quiet">{goal.nextAction.why}</span> : null}
            </span>
            {b && b.level !== null ? (
              <span className="map-hero-n">
                <span className="map-big num">{U.dnBadge(b.level)}</span>
                <span className="map-quiet">{U.dnBuilding}</span>
              </span>
            ) : null}
          </div>
        </Frame>
      ) : null}
      <div className="map-cols">
        <section className="map-sec" aria-labelledby="dn-h">
          <div className="map-sec-h">
            <h3 id="dn-h" className="a-h2">
              {U.dnRanks}
            </h3>
            <span className="map-quiet">{U.dnAll}</span>
          </div>
          {v.deathNote.length ? (
            <>
              <div className="dn-ticks" aria-hidden="true">
                {ticks.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <ul className="dn-rows">
                {v.deathNote.map((r, i) => (
                  <li key={r.mapIndex} className={cx('dn-row', i === 0 && 'is-closest')}>
                    <span className="dn-name">
                      <span className="dn-name-t">
                        <b>{r.map}</b>
                        {i === 0 ? <Tag tone="gold">{U.dnClosest}</Tag> : null}
                      </span>
                      <span className="map-quiet">{U.dnFight(r.who.map((w) => w.label))}</span>
                    </span>
                    <span className="dn-cells" aria-hidden="true">
                      {r.ranks.map((at, k) => {
                        const from = k === 0 ? 0 : (r.ranks[k - 1] ?? 0);
                        const w = r.kills >= at ? 1 : r.kills > from ? (r.kills - from) / (at - from) : 0;
                        return (
                          <span key={at} className="dn-cell">
                            <span
                              className={cx('dn-fill', r.kills >= at ? 'is-done' : 'is-on')}
                              style={{ '--w': Math.max(w, w > 0 ? 0.02 : 0) } as Vars}
                            />
                          </span>
                        );
                      })}
                    </span>
                    <span className="dn-k">
                      <b className="num">{W.deathNoteKills(r.kills)}</b>
                      <span className={cx('map-quiet', i === 0 && 'is-gold')}>{r.next}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ul className="map-legend">
                <li>
                  <span className="dn-key is-done" aria-hidden="true" />
                  {U.dnRankReached}
                </li>
                <li>
                  <span className="dn-key is-on" aria-hidden="true" />
                  {U.dnOnTheWay}
                </li>
                {ranks.length ? <li>{U.dnRanksAt(ranks)}</li> : null}
              </ul>
              <p className="map-quiet">{U.dnCover(v.deathNote.length)}</p>
            </>
          ) : (
            <p className="map-quiet">{U.dnNone}</p>
          )}
        </section>
        {b ? (
          <aside className="map-aside" aria-labelledby="dn-b-h">
            <h3 id="dn-b-h" className="a-cap">
              {U.dnFirst}
            </h3>
            <dl className="dn-facts">
              <div>
                <dt>{U.dnWhere}</dt>
                <dd>{U.dnWhereV}</dd>
              </div>
              <div>
                <dt>{U.dnNow}</dt>
                <dd>{b.inBuildSlot ? U.dnYes : U.dnNo}</dd>
              </div>
              {b.cost ? (
                <>
                  <div>
                    <dt>{U.dnCosts}</dt>
                    <dd>
                      {fmt(b.cost.amount)} {b.cost.item}
                    </dd>
                  </div>
                  <div>
                    <dt>{U.dnHold}</dt>
                    <dd>
                      <b>{U.dnHeld(b.cost.held, b.cost.amount)}</b>
                    </dd>
                  </div>
                </>
              ) : null}
            </dl>
            {b.cost ? (
              <Meter
                value={Math.min(b.cost.held, b.cost.amount)}
                max={b.cost.amount}
                label={U.dnHeld(b.cost.held, b.cost.amount)}
              />
            ) : null}
            <ul className="map-links">
              <li>
                <a
                  href={formatRoute({ place: 'system', id: 'refinery' })}
                  onClick={(e) => {
                    e.preventDefault();
                    s.navigate({ place: 'system', id: 'refinery' }, 'push');
                  }}
                >
                  <b>{U.dnRefinery}</b>
                  <span className="map-links-w">{U.dnRefineryWhy}</span>
                </a>
              </li>
              <li>
                <a
                  href={formatRoute({ place: 'system', id: 'construction' })}
                  onClick={(e) => {
                    e.preventDefault();
                    s.navigate({ place: 'system', id: 'construction' }, 'push');
                  }}
                >
                  <b>{U.dnConstruction}</b>
                  <span className="map-links-w">{U.dnConstructionWhy}</span>
                </a>
              </li>
            </ul>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

// ---- Cards ----

function CardsTab({
  v,
  s,
  view,
  onOpen,
}: {
  v: MapPlaceView;
  s: Session;
  view: NowView;
  onOpen(i: number): void;
}) {
  const grind = s.result.cards?.account.grind ?? [];
  const top = grind[0] ?? null;
  const also = grind.slice(1, 4);
  const sheets = v.sheets;
  const bands = v.worlds.filter((b) => !b.beyond);
  const whoOf = (labels: string[]) => {
    const r = view.roster.find((x) => labels.includes(`${x.classLabel} ${x.level}`));
    return r ?? null;
  };
  const farmer = top ? whoOf(top.farmingNow) : null;
  return (
    <div className="map-panel">
      <PageSources>{U.srcCards}</PageSources>
      {top ? (
        <Frame tone="gold" className="map-hero" aria-label={U.cardsCap}>
          <div className="map-hero-row">
            <span className="map-hero-ic" aria-hidden="true">
              <Sprite name="item-card-frame" size={48} decorative />
            </span>
            <span className="map-hero-b">
              <span className="a-cap map-cap">{U.cardsCap}</span>
              <span className="map-hero-a">{U.cardTitle(top.name, top.missing, top.next.label)}</span>
              <span className="map-hero-w">
                {farmer ? (
                  <WhoGlyph
                    family={familyOf(view, farmer.index)}
                    classLabel={farmer.classLabel}
                    scale={1}
                    decorative
                  />
                ) : null}
                {top.farmingNow.length ? U.cardFarming(top.farmingNow, top.map) : U.cardWhere(top.map)}
                {' · '}
                {top.etaText}
              </span>
            </span>
            <span className="map-hero-n">
              <span className="map-big num">{fmt(top.owned)}</span>
              <span className="map-quiet">{U.cardOf(top.owned + top.missing)}</span>
            </span>
          </div>
          <Meter value={top.owned} max={top.owned + top.missing} label={U.cardOf(top.owned + top.missing)} />
        </Frame>
      ) : null}
      {also.length ? (
        <section className="map-sec" aria-labelledby="mc-also-h">
          <h3 id="mc-also-h" className="a-h2">
            {U.alsoClose}
          </h3>
          <ul className="mc-also">
            {also.map((g) => (
              <li key={g.rawName}>
                <button type="button" className="mc-also-b" onClick={() => onOpen(g.mapIndex)}>
                  <span className="mc-also-h">
                    <b>{g.map}</b>
                    <span className={g.owned > 0 ? 'is-ok' : 'is-gold'}>{g.next.label}</span>
                  </span>
                  <span className="map-quiet">
                    {g.name} · {g.farmingNow.length ? U.cardFarming(g.farmingNow, g.map) : g.etaText}
                  </span>
                  <span className="mc-odds">{g.chanceText}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="map-sec" aria-labelledby="mc-all-h">
        <div className="map-sec-h">
          <h3 id="mc-all-h" className="a-h2">
            {U.cardsAll}
          </h3>
          <ul className="map-legend">
            <li>
              <span className="mc-pips" aria-hidden="true">
                <span className="mc-pip is-on" />
                <span className="mc-pip is-on" />
                <span className="mc-pip" />
              </span>
              {U.cardLevelKey}
            </li>
            <li>
              <span className="mc-key is-reached" aria-hidden="true" />
              {U.cardReached}
            </li>
            <li>
              <span className="mc-key" aria-hidden="true" />
              {U.cardNotReached}
            </li>
          </ul>
        </div>
        {bands.map((b) => {
          const cards = b.nodes.flatMap((n) => {
            const c = sheets[n.mapIndex]?.card;
            return n.kind === 'fight' && c ? [{ n, c }] : [];
          });
          if (!cards.length) return null;
          const have = cards.filter((x) => x.c.level !== null).length;
          return (
            <div key={b.world} className={cx('a-tile map-tile', `map-w${worldNo(b.world)}`)}>
              <div className="map-tile-h">
                <span className="map-crest num">{b.world}</span>
                <h4 className="map-h4">{b.heading}</h4>
                <span className="map-line">{U.cardsLine(have, cards.length)}</span>
              </div>
              <ul className="mc-grid">
                {cards.map(({ n, c }) => {
                  const reached = n.state !== 'locked' && n.state !== 'unknown';
                  const ring = top?.mapIndex === n.mapIndex;
                  return (
                    <li key={n.mapIndex}>
                      <button
                        type="button"
                        className={cx(
                          'mc-card',
                          c.level !== null ? 'is-have' : reached ? 'is-reached' : 'is-far',
                          ring && 'is-ring',
                        )}
                        title={U.cardTile(n.name, c.level, c.chance)}
                        aria-label={U.cardTile(n.name, c.level, c.chance)}
                        onClick={() => onOpen(n.mapIndex)}
                      >
                        <span className="mc-face" aria-hidden="true">
                          {c.level !== null ? `Lv${c.level}` : '?'}
                        </span>
                        <span className="mc-pips" aria-hidden="true">
                          {[1, 2, 3, 4, 5].map((k) => (
                            <span
                              key={k}
                              className={cx('mc-pip', c.level !== null && k <= c.level && 'is-on')}
                            />
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <p className="map-quiet">{U.cardsHint}</p>
      </section>
    </div>
  );
}

/** FR-M2: the map sheet, in its order: who, doors, card, Death Note, constellations. */
function SheetBody({ sh, view }: { sh: Sheet_; view: NowView }) {
  return (
    <div className="map-sheet">
      <p className="map-sheet-sub">
        <span>{sh.world}</span>
        {sh.chip ? (
          <span className="map-chip">
            <PixelArt name="v2-map-flag" decorative />
            {sh.chip}
          </span>
        ) : null}
      </p>
      <section className="map-sh-sec">
        <h3>{W.sheetWho}</h3>
        {sh.who.length ? (
          <ul className="map-sh-who">
            {sh.who.map((w) => (
              <li key={w.index}>
                <WhoGlyph family={familyOf(view, w.index)} classLabel={w.classLabel} scale={2} decorative />
                <b>{w.label}</b>
              </li>
            ))}
          </ul>
        ) : (
          <p className="map-sh-l">{W.sheetNobody}</p>
        )}
      </section>
      {sh.doors.map((d) => (
        <section key={d.heading} className="map-sh-sec">
          <h3>{d.heading}</h3>
          <p className="map-sh-l">
            {d.line} {d.openLine}
          </p>
          <ul className="map-sh-door">
            {d.rows.slice(0, 6).map((r) => (
              <li key={r.who.index} className={r.pusher ? 'is-now' : undefined}>
                <span className="map-sh-door-who">
                  <WhoGlyph
                    family={familyOf(view, r.who.index)}
                    classLabel={r.who.classLabel}
                    scale={1}
                    decorative
                  />
                  <b>{r.who.label}</b>
                </span>
                <Meter value={r.done} max={r.requirement} label={r.text} tone={r.open ? 'ok' : 'accent'} />
                <span className="num">{r.text}</span>
                {r.when ? (
                  <span className="map-sh-eta">
                    <PixelArt name="now-glyph-stale" decorative />
                    {r.when}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {sh.card ? (
        <section className="map-sh-sec">
          <h3>{W.sheetCard}</h3>
          <p className="map-sh-l map-sh-ico">
            <PixelArt name="v2-map-card" decorative />
            <span>
              <b>{sh.card.text}</b>
              {sh.card.chance ? <span className="map-sh-m">{sh.card.chance}</span> : null}
            </span>
          </p>
        </section>
      ) : null}
      {sh.deathNote ? (
        <section className="map-sh-sec">
          <h3>{W.sheetDeathNote}</h3>
          <p className="map-sh-l map-sh-ico">
            <PixelArt name="v2-map-skull" decorative />
            <span>
              <b className="num">{sh.deathNote.kills}</b>
              <span className="map-sh-m">{sh.deathNote.next}</span>
            </span>
          </p>
        </section>
      ) : null}
      {sh.constellations.length ? (
        <section className="map-sh-sec">
          <h3>{W.sheetStars}</h3>
          <ul className="map-sh-cs">
            {sh.constellations.map((c) => (
              <li key={c}>
                <PixelArt name="v2-map-star" decorative />
                <b>{c}</b>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function MapPlace({ s }: { s: Session }) {
  const heading = useRef<HTMLHeadingElement | null>(null);
  const { takeArrivalFocus } = s;
  useEffect(() => {
    if (takeArrivalFocus()) heading.current?.focus({ preventScroll: true });
  }, [takeArrivalFocus]);
  // M21 G10: the frontier's time follows the Times setting.
  const { times } = useNowSettings();
  const v = useMemo(
    () => buildMapView(s.result, s.view, { now: s.now, times, tzOffsetMinutes: localOffsetMinutes(s.now) }),
    [s.result, s.view, s.now, times],
  );
  const [tab, setTab] = useState<Tab>('route');
  const open = v ? v.worlds.filter((b) => !b.beyond && b.state !== 'next') : [];
  const current = open.find((b) => b.state === 'open')?.world ?? open.at(-1)?.world ?? null;
  // MapW4: from four open worlds, one world at a time.
  const pickable = open.length >= 4;
  const [world, setWorld] = useState<number | null>(null);
  const shown = pickable ? (world ?? current) : null;
  const picked = s.route.place === 'map' ? s.route.mapIndex : null;
  const sheet = picked !== null && v ? (v.sheets[picked] ?? null) : null;
  const onOpen = (mapIndex: number) => s.navigate({ place: 'map', mapIndex }, 'push');
  const onClose = () => s.navigate({ place: 'map', mapIndex: null }, 'replace');

  const stars = v?.stars ?? [];
  const cardsAll = v
    ? v.worlds.flatMap((b) => b.nodes.filter((n) => n.kind === 'fight' && v.sheets[n.mapIndex]?.card))
    : [];
  const cardsHave = cardsAll.filter((n) => v?.sheets[n.mapIndex]?.card?.level != null).length;
  const dnLevel = v?.deathNoteBuilding?.level ?? null;
  const badge = (text: string | null, gold = false) =>
    text ? <Tag tone={gold ? 'gold' : undefined}>{text}</Tag> : undefined;

  return (
    <section className="map-place" aria-labelledby="map-h">
      <div className="map-head">
        <div className="map-head-t">
          <h2 ref={heading} id="map-h" className="place-h a-h1 map-title" data-place-heading tabIndex={-1}>
            {W.title}
          </h2>
          {v ? <p className="map-sum">{v.summary}</p> : null}
        </div>
        {pickable && tab === 'route' ? (
          <SegmentedControl
            label={U.worldLabel}
            value={String(shown)}
            options={open.map((b) => ({ value: String(b.world), label: U.worldTab(b.world) }))}
            onChange={(x) => setWorld(Number(x))}
          />
        ) : null}
      </div>
      {!v ? (
        <p className="map-sum">{W.empty}</p>
      ) : (
        <>
          <Tabs<Tab>
            label={U.tabsLabel}
            value={tab}
            idBase="map"
            onChange={setTab}
            tabs={[
              { value: 'route', label: W.overlayRoute },
              {
                value: 'constellations',
                label: W.overlayStars,
                badge: badge(
                  stars.length
                    ? U.starsBadge(stars.filter((x) => x.state === 'claimed').length, stars.length)
                    : null,
                  stars.some((x) => x.state === 'ready'),
                ),
              },
              {
                value: 'deathNote',
                label: W.overlayDeathNote,
                badge: badge(dnLevel !== null ? U.dnBadge(dnLevel) : null, dnLevel === 0),
              },
              {
                value: 'cards',
                label: W.overlayCards,
                badge: badge(cardsAll.length ? U.cardsBadge(cardsHave, cardsAll.length) : null),
              },
            ]}
          />
          <div role="tabpanel" id={`map-panel-${tab}`} aria-labelledby={`map-tab-${tab}`}>
            {tab === 'route' ? (
              <RouteTab v={v} view={s.view} onOpen={onOpen} picked={picked} world={shown} />
            ) : tab === 'constellations' ? (
              <StarsTab v={v} s={s} />
            ) : tab === 'deathNote' ? (
              <DeathNoteTab v={v} s={s} />
            ) : (
              <CardsTab v={v} s={s} view={s.view} onOpen={onOpen} />
            )}
          </div>
          <Sheet open={sheet !== null} title={sheet?.title ?? ''} onClose={onClose} closeLabel={W.close}>
            {sheet ? <SheetBody sh={sheet} view={s.view} /> : null}
          </Sheet>
        </>
      )}
    </section>
  );
}
