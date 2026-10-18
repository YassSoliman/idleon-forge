// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M17 FR-16 to FR-22: the Systems hub. One tile per game System of the registry, grouped by world in
// game order, each with a status glyph and word (never colour alone, TR-13) and one reason line of
// counts and view words. "Needs you" lists the wasting tiles, then the behind ones; later worlds fold
// into one line; the gaps that aren't whole Systems close the hub. Every word comes from
// `buildSystemsView` (TR-9): this component adds none of its own beyond the headings it is given.
import { HUB_WORDS, type TileStatus, type TileView } from '@idleon-forge/engine/now';
import type { Session } from '../shell/session';

/** The status glyph (Design Lab P8: glyph plus word plus colour). */
export function StatusGlyph({ status }: { status: TileStatus }) {
  const d: Record<TileStatus, React.ReactNode> = {
    wasting: <path d="M12 3 2 20h20Z" fill="currentColor" />,
    behind: <path d="M4 12h12M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="3" />,
    locked: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.5" />
      </>
    ),
    'cant-tell': (
      <path
        d="M9 9a3 3 0 1 1 4 2.8c-1 .4-1 1.2-1 2.2M12 18v.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    ),
    'not-covered': (
      <circle
        cx="12"
        cy="12"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeDasharray="3 3"
      />
    ),
    ok: <path d="m5 12 4 4 10-10" fill="none" stroke="currentColor" strokeWidth="3" />,
  };
  return (
    <svg className="st-glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      {d[status]}
    </svg>
  );
}

/** The reason line; a leading piece equal to the status word isn't said twice on screen. */
export function Reason({ tile }: { tile: TileView }) {
  const parts = tile.reason[0]?.text === tile.statusWord.text ? tile.reason.slice(2) : tile.reason;
  if (parts.length === 0) return null;
  return (
    <span className="st-reason small">
      {parts.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: segments are positional and never reorder
        <span key={i}>{p.text}</span>
      ))}
    </span>
  );
}

function Tile({ tile, s }: { tile: TileView; s: Session }) {
  return (
    <li>
      <a
        className={`st st-${tile.status}`}
        href={`#system-${tile.id}`}
        aria-label={tile.accessibleName}
        onClick={(e) => {
          e.preventDefault();
          s.navigate({ place: 'system', id: tile.id }, 'push');
        }}
      >
        <span className="st-name">{tile.name}</span>
        <span className="st-status">
          <StatusGlyph status={tile.status} />
          <span>{tile.statusWord.text}</span>
        </span>
        <Reason tile={tile} />
      </a>
    </li>
  );
}

export function SystemsHub({ s }: { s: Session }) {
  const v = s.systems;
  return (
    <section className="systems-hub" aria-labelledby="systems-h">
      <h2 id="systems-h" className="section-h place-h" data-place-heading tabIndex={-1}>
        {HUB_WORDS.title}
      </h2>
      {v.needsYou.length > 0 ? (
        <section className="needs-you" aria-labelledby="needs-you-h">
          <h3 id="needs-you-h" className="sub-h">
            {HUB_WORDS.needsYou}
          </h3>
          <ul className="ny-list">
            {v.needsYou.map((n) => (
              <li key={n.id}>
                <a
                  className={`chip ny st-${n.status}`}
                  href={`#system-${n.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    s.navigate({ place: 'system', id: n.id }, 'push');
                  }}
                >
                  <StatusGlyph status={n.status} />
                  <span>{n.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {v.groups.map((g) => (
        <section key={g.world} className="st-group" aria-labelledby={`world-${g.world}-h`}>
          <h3 id={`world-${g.world}-h`} className="sub-h">
            {g.heading}
          </h3>
          <ul className="st-grid">
            {g.tiles.map((t) => (
              <Tile key={t.id} tile={t} s={s} />
            ))}
          </ul>
        </section>
      ))}
      {v.later ? (
        <details className="st-later">
          <summary>{v.later.label}</summary>
          <ul className="st-grid">
            {v.later.tiles.map((t) => (
              <Tile key={t.id} tile={t} s={s} />
            ))}
          </ul>
        </details>
      ) : null}
      {v.beyond ? <p className="small muted st-beyond">{v.beyond}</p> : null}
      {v.otherGaps.length > 0 ? (
        <section className="st-gaps" aria-labelledby="other-gaps-h">
          <h3 id="other-gaps-h" className="sub-h">
            {HUB_WORDS.otherGaps}
          </h3>
          <ul className="small">
            {v.otherGaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
