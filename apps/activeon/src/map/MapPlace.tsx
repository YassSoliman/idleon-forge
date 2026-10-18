// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Map place (M21 FR-M1 to FR-M5, area M), drawn to the Design Lab's picks:
// - phone: `map.world-map` Gate-first. Folded worlds, the boss gates with keys and crystals, the open world
//   with the frontier door as a ring; each band expands into its "Vertical route" (kept as the expanded
//   world), the open one expanded from the start;
// - from 1000 px: the "World strip" (Command Board's layout in Field Guide colours), bands of map nodes
//   with the frontier edge lit and the Now card under the open world (DS-22: the phone falls back to
//   Gate-first);
// - both: the "Overlay switcher", one overlay at a time with that overlay's one ring and the rest grey;
// - `map.map-sheet` Bottom sheet, a side panel from 1000 px (the Sheet atom), in the FR-M2 order.
// It renders `buildMapView`'s view and computes nothing (D-18). The map is facts, not advice (FR-M7).
// Two parts, one truth (TR-17): every map node is a button in world order with its state in words; the
// pixel pictures beside them are `aria-hidden`.
import { buildMapView, type MapPlaceView, MAP_WORDS as W } from '@idleon-forge/engine/map';
import type { NowView } from '@idleon-forge/engine/now';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';
import { Meter, Ring, SegmentedControl, Sheet, TokenLine } from '../design/atoms';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import type { Session } from '../shell/session';
import './map.css';

type Band = MapPlaceView['worlds'][number];
type Node = Band['nodes'][number];
type Who = Node['here'][number];
type Overlay = MapPlaceView['overlays'][number];
type Sheet_ = MapPlaceView['sheets'][number];

const familyOf = (view: NowView, index: number): ClassFamily => view.families?.[index] ?? 'beginner';
const worldNo = (w: number) => (w >= 1 && w <= 7 ? (w as 1 | 2 | 3 | 4 | 5 | 6 | 7) : undefined);

/** The node's glyph: its state, or under an overlay, that overlay's own mark. */
function nodeArt(n: Node, overlay: Overlay['overlay'], marked: boolean): ArtName | null {
  if (overlay === 'constellations' && marked) return 'v2-map-star';
  if (overlay === 'deathNote' && marked) return 'v2-map-skull';
  if (overlay === 'cards' && marked) return 'v2-map-card';
  if (n.state === 'town') return 'v2-map-town';
  if (n.state === 'cleared') return 'ui-check';
  if (n.state === 'frontier') return 'v2-map-flag';
  if (n.state === 'locked') return 'v2-map-lock';
  return null;
}

/** The world crest: the world's number on its tint (CSS-drawn, no game art). */
function Crest({ world }: { world: number }) {
  return (
    <span className={`map-crest map-w${worldNo(world) ?? 1}`} aria-hidden="true">
      <span className="num">{world > 4 ? '5+' : world}</span>
    </span>
  );
}

/** Who-glyphs stacked, with the 12 px class letter (D-19: they stand without their class word). */
function Stack({
  who,
  view,
  max = 3,
  scale = 2,
}: {
  who: Who[];
  view: NowView;
  max?: number;
  scale?: 1 | 2;
}) {
  if (!who.length) return null;
  const shown = who.slice(0, max);
  return (
    <span className="map-stack" aria-hidden="true">
      {shown.map((w) => (
        <WhoGlyph
          key={w.index}
          family={familyOf(view, w.index)}
          classLabel={w.classLabel}
          scale={scale}
          badge={w.classLabel.slice(0, 1)}
          decorative
        />
      ))}
      {who.length > max ? <span className="map-stack-n num">+{who.length - max}</span> : null}
    </span>
  );
}

interface NodeProps {
  n: Node;
  view: NowView;
  overlay: Overlay;
  onOpen(mapIndex: number): void;
  picked: number | null;
}

function overlayClass(n: Node, o: Overlay) {
  const marked = o.overlay === 'route' ? true : o.marked.includes(n.mapIndex);
  // Under Route the frontier is already drawn as the next door; the other overlays ring their one map.
  return { marked, grey: !marked, ring: o.overlay !== 'route' && o.ring === n.mapIndex };
}

/** One stop of a world's Vertical route: a 44 px row button. */
function Stop({ n, view, overlay, onOpen, picked }: NodeProps) {
  const { marked, grey, ring } = overlayClass(n, overlay);
  const art = nodeArt(n, overlay.overlay, overlay.overlay !== 'route' && marked);
  return (
    <li>
      <button
        type="button"
        className={`map-stop${grey ? ' is-grey' : ''}${ring ? ' is-ring' : ''}${picked === n.mapIndex ? ' is-picked' : ''}`}
        data-st={n.state}
        aria-label={ring ? `${n.label}, ${W.ringLabel}` : n.label}
        onClick={() => onOpen(n.mapIndex)}
      >
        <span className="map-dot" aria-hidden="true">
          {art ? <PixelArt name={art} decorative /> : null}
        </span>
        <span className="map-stop-n">{n.name}</span>
        <Stack who={n.here} view={view} />
        {n.doorTag && n.state !== 'cleared' ? (
          <span className="map-stop-req num" aria-hidden="true">
            {n.doorTag}
          </span>
        ) : null}
      </button>
    </li>
  );
}

/** One node of the World strip (desktop): a 44 px tile with its label under it. */
function StripNode({ n, view, overlay, onOpen, picked }: NodeProps) {
  const { marked, grey, ring } = overlayClass(n, overlay);
  const art = nodeArt(n, overlay.overlay, overlay.overlay !== 'route' && marked);
  const named = n.here.length > 0 || n.state === 'frontier' || n.state === 'town';
  return (
    <li className="map-n" data-st={n.state}>
      <button
        type="button"
        className={`map-n-b${grey ? ' is-grey' : ''}${ring ? ' is-ring' : ''}${picked === n.mapIndex ? ' is-picked' : ''}`}
        aria-label={ring ? `${n.label}, ${W.ringLabel}` : n.label}
        onClick={() => onOpen(n.mapIndex)}
      >
        <span className="map-n-who">
          <Stack who={n.here} view={view} max={2} scale={1} />
        </span>
        <span className="map-dot" aria-hidden="true">
          {art ? <PixelArt name={art} decorative /> : null}
        </span>
        {named ? (
          <span className="map-n-lbl" aria-hidden="true">
            {n.name}
          </span>
        ) : null}
      </button>
      {n.doorTag && n.state !== 'town' ? (
        <span
          className={`map-e${n.state === 'frontier' ? ' is-now' : ''}`}
          data-st={n.state}
          aria-hidden="true"
        >
          {n.state === 'frontier' || n.state === 'locked' ? (
            <span className="map-e-req num">{n.doorTag}</span>
          ) : null}
        </span>
      ) : (
        <span className="map-e" data-st={n.state} aria-hidden="true" />
      )}
    </li>
  );
}

function GateCard({ band }: { band: Band }) {
  const g = band.gate;
  if (!g) return null;
  return (
    <div className={`map-gate${g.lit ? ' is-now' : ''}`} data-st={g.state}>
      <span className="map-gate-art" aria-hidden="true">
        <PixelArt name="v2-map-gate" scale={2} decorative />
      </span>
      <div>
        <b>{g.boss}</b>
        {g.lines.map((l) => (
          <span key={l.kind} className="map-gate-l">
            <PixelArt name={l.kind === 'crystal' ? 'v2-map-crystal' : 'v2-map-key'} decorative />
            <span>{l.text}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** The frontier ring and its tokens (FR-M1): the next door, the pusher's kills and the time. */
function Frontier({ v, view }: { v: MapPlaceView; view: NowView }) {
  const f = v.frontier;
  if (!f) return null;
  const pct = f.requirement > 0 ? Math.floor((f.done / f.requirement) * 100) : 0;
  return (
    <div className="map-front">
      <div className="map-front-ring">
        <span className="map-ring-wrap">
          <Ring value={f.done} max={f.requirement} label={f.killsText} size={64} />
          <span className="map-ring-pct num" aria-hidden="true">
            {f.done > 0 && pct < 1 ? '<1%' : `${pct}%`}
          </span>
        </span>
        <div>
          <span className="map-now-tag">{W.now}</span>
          <p className="map-front-door">{f.to ? W.doorTo(f.map, f.to) : f.map}</p>
          <p className="map-front-n num">{f.killsText}</p>
        </div>
      </div>
      <TokenLine
        who={f.who ? { family: familyOf(view, f.who.index), label: f.who.label } : null}
        where={f.map}
        howLong={f.when}
      />
    </div>
  );
}

function GateFirst({ v, view, overlay, onOpen, picked }: Omit<NodeProps, 'n'> & { v: MapPlaceView }) {
  const [open, setOpen] = useState<ReadonlySet<number>>(
    () => new Set(v.worlds.filter((b) => b.state === 'open' && !b.beyond).map((b) => b.world)),
  );
  // The overlay's one ring is always on screen: its world unfolds when the overlay changes.
  const ringWorld = v.worlds.find((b) => b.nodes.some((n) => n.mapIndex === overlay.ring))?.world;
  useEffect(() => {
    if (ringWorld === undefined || overlay.overlay === 'route') return;
    setOpen((prev) => (prev.has(ringWorld) ? prev : new Set([...prev, ringWorld])));
  }, [ringWorld, overlay.overlay]);
  const toggle = (w: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  return (
    <ol className="map-gf">
      {v.worlds.flatMap((b) => {
        const isNow = b.state === 'open' && !b.beyond;
        const expanded = open.has(b.world);
        const front = isNow && v.frontier && v.frontier.world === b.world;
        const others = front ? b.here.filter((h) => h.index !== v.frontier?.who?.index) : b.here;
        const items = [
          <li
            key={`w${b.world}`}
            className={`map-gf-i${isNow ? ' is-now' : ''}`}
            data-st={b.beyond ? 'beyond' : b.state}
          >
            <div className={`map-gf-tile map-w map-w${worldNo(b.world) ?? 1}`}>
              <div className="map-gf-h">
                <Crest world={b.world} />
                <div>
                  <h3>{b.heading}</h3>
                  <span>{b.line}</span>
                  {b.state === 'done' && b.total > 0 ? (
                    <Meter value={b.cleared} max={b.total} label={b.line} tone="ok" />
                  ) : null}
                </div>
                {!isNow ? <Stack who={b.here} view={view} /> : null}
              </div>
              {front ? <Frontier v={v} view={view} /> : null}
              {isNow && others.length ? (
                <p className="map-gf-who">
                  {front ? W.alsoHere(b.heading) : W.here}
                  <Stack who={others} view={view} max={6} />
                </p>
              ) : null}
              {b.nodes.length && b.state !== 'next' ? (
                <button
                  type="button"
                  className="map-more"
                  aria-expanded={expanded}
                  onClick={() => toggle(b.world)}
                >
                  {expanded ? W.hideMaps : W.showMaps(b.nodes.length)}
                </button>
              ) : null}
              {expanded ? (
                <ol className="map-vr" aria-label={b.heading}>
                  {b.nodes.map((n) => (
                    <Stop
                      key={n.mapIndex}
                      n={n}
                      view={view}
                      overlay={overlay}
                      onOpen={onOpen}
                      picked={picked}
                    />
                  ))}
                </ol>
              ) : null}
            </div>
          </li>,
        ];
        if (b.gate)
          items.push(
            <li key={`g${b.world}`} className="map-gf-i map-gf-i--gate">
              <GateCard band={b} />
            </li>,
          );
        return items;
      })}
    </ol>
  );
}

function WorldStrip({ v, view, overlay, onOpen, picked }: Omit<NodeProps, 'n'> & { v: MapPlaceView }) {
  return (
    <div className="map-ws">
      {v.worlds.map((b) => {
        const isNow = b.state === 'open' && !b.beyond;
        const main = b.nodes.filter((n) => n.kind === 'town' || n.kind === 'fight' || n.kind === 'other');
        const skill = b.nodes.filter((n) => n.kind === 'skill');
        return (
          <div key={b.world} className="map-band-wrap">
            <section
              className={`map-band map-w map-w${worldNo(b.world) ?? 1}${isNow ? ' is-now' : ''}`}
              data-st={b.beyond ? 'beyond' : b.state}
              aria-label={b.heading}
            >
              <div className="map-band-h">
                <Crest world={b.world} />
                <div>
                  <h3>{b.heading}</h3>
                  <em>{b.line}</em>
                </div>
              </div>
              <GateCard band={b} />
              {b.nodes.length ? (
                <div className="map-band-body">
                  <ol className="map-track" aria-label={W.mainRoute}>
                    {main.map((n) => (
                      <StripNode
                        key={n.mapIndex}
                        n={n}
                        view={view}
                        overlay={overlay}
                        onOpen={onOpen}
                        picked={picked}
                      />
                    ))}
                  </ol>
                  {skill.length ? (
                    <div className="map-sub">
                      <span className="map-sub-k">{W.skillMaps}</span>
                      <ol className="map-track map-track--sub" aria-label={W.skillMaps}>
                        {skill.map((n) => (
                          <StripNode
                            key={n.mapIndex}
                            n={n}
                            view={view}
                            overlay={overlay}
                            onOpen={onOpen}
                            picked={picked}
                          />
                        ))}
                      </ol>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
            {isNow && v.frontier ? <NowCard v={v} view={view} /> : null}
          </div>
        );
      })}
    </div>
  );
}

/** The World strip's Now card under the open world: the push step, its tokens and the kills bar. */
function NowCard({ v, view }: { v: MapPlaceView; view: NowView }) {
  const f = v.frontier;
  if (!f) return null;
  return (
    <div className="map-nowcard">
      <span className="map-now-tag">{W.now}</span>
      <p className="map-nowcard-step">{f.step}</p>
      <TokenLine
        who={f.who ? { family: familyOf(view, f.who.index), label: f.who.label } : null}
        where={f.map}
        howLong={f.when}
      />
      <div className="map-nowcard-bar">
        <Meter value={f.done} max={f.requirement} label={f.killsText} />
        <span className="num">{f.killsText}</span>
      </div>
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
  const v = useMemo(() => buildMapView(s.result, s.view, { now: s.now }), [s.result, s.view, s.now]);
  const [overlay, setOverlay] = useState<Overlay['overlay']>('route');
  const picked = s.route.place === 'map' ? s.route.mapIndex : null;
  const sheet = picked !== null && v ? (v.sheets[picked] ?? null) : null;
  const onOpen = (mapIndex: number) => s.navigate({ place: 'map', mapIndex }, 'push');
  const onClose = () => s.navigate({ place: 'map', mapIndex: null }, 'replace');
  const o = v?.overlays.find((x) => x.overlay === overlay) ?? v?.overlays[0];

  return (
    <section className="map-place" aria-labelledby="map-h">
      <h2 ref={heading} id="map-h" className="place-h" data-place-heading tabIndex={-1}>
        {W.title}
      </h2>
      {!v || !o ? (
        <p className="map-sum">{W.empty}</p>
      ) : (
        <>
          <p className="map-sum">{v.summary}</p>
          <div className="map-ov">
            <SegmentedControl
              label={W.overlayLabel}
              value={o.overlay}
              options={v.overlays.map((x) => ({ value: x.overlay, label: x.label }))}
              onChange={(x) => setOverlay(x as Overlay['overlay'])}
            />
            <p className="map-ring-l" aria-live="polite">
              {o.ringText}
            </p>
          </div>
          <GateFirst v={v} view={s.view} overlay={o} onOpen={onOpen} picked={picked} />
          <WorldStrip v={v} view={s.view} overlay={o} onOpen={onOpen} picked={picked} />
          <p className="map-hint">{W.tapHint}</p>
          <Sheet open={sheet !== null} title={sheet?.title ?? ''} onClose={onClose} closeLabel={W.close}>
            {sheet ? <SheetBody sh={sheet} view={s.view} /> : null}
          </Sheet>
        </>
      )}
    </section>
  );
}
