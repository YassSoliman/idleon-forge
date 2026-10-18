// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-S1, FR-S2 (Design Lab `systems.hub`, pick "Stage report card" with "World bands of tiles" as
// the full index under it). Top to bottom: the "Wasting now" strip (glyph chips with their count), the
// report card (one Stage axis, one row per behind System with its gap drawn as length, the worst row
// open with its one step), then "All Systems": M17's world bands, each tile with its own glyph and a
// status glyph + word (never colour alone, DS-8), "not covered yet" said once per band (v2 #3). Every
// word comes from `buildSystemsView` (M17 TR-9): this component adds none of its own.
import { HUB_WORDS, type TileStatus, type TileView } from '@idleon-forge/engine/now';
import { BAND_WORDS, buildSystemsHubView, REPORT_WORDS } from '@idleon-forge/engine/systems-ui';
import { type CSSProperties, useMemo } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { cx } from '../design/atoms/Button';
import { StatusGlyph as StatusMark } from '../design/atoms/Marks';
import { TokenLine } from '../design/atoms/TokenLine';
import { toNowPrefs } from '../now/prefs-store';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import { systemArt } from './glyphs';

type Hub = ReturnType<typeof buildSystemsHubView>;
type ReportRow = NonNullable<Hub['report']>['rows'][number];

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

const go = (s: Session, id: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  s.navigate({ place: 'system', id }, 'push');
};

function Tile({ tile, s }: { tile: TileView; s: Session }) {
  const art = systemArt(tile.id);
  // v2 #3: "not covered yet" is said once per band, so its tile shows the glyph with the word as a title.
  const quiet = tile.status === 'not-covered';
  return (
    <li>
      <a
        className={cx('sy-tile', `sy-tile--${tile.status}`)}
        href={`#system-${tile.id}`}
        aria-label={tile.accessibleName}
        onClick={go(s, tile.id)}
      >
        <PixelArt name={art.name} ramp={art.ramp} decorative className="sy-tile__art" />
        <span className="sy-tile__name">{tile.name}</span>
        <StatusMark status={tile.status} word={tile.statusWord.text} glyphOnly={quiet} />
        <Reason tile={tile} />
      </a>
    </li>
  );
}

function ReportRowItem({ row, s, here }: { row: ReportRow; s: Session; here: number }) {
  const style = {
    '--at': `${(row.at ?? here) * 100}%`,
    '--gap': `${Math.max(0, here - (row.at ?? here)) * 100}%`,
  } as CSSProperties;
  return (
    <li className={cx('sy-rc__row', row.open && 'is-now')}>
      <a
        className="sy-rc__link"
        href={`#system-${row.id}`}
        onClick={go(s, row.id)}
        aria-label={row.accessibleName}
      >
        <span className="sy-rc__name">{row.name}</span>
        <span className="sy-rc__track" style={style} aria-hidden="true">
          {row.at !== null ? <span className="sy-rc__gap" /> : null}
          {row.at !== null ? <span className="sy-rc__tick" /> : null}
        </span>
        {row.behindText ? <span className="sy-rc__word">{row.behindText}</span> : null}
      </a>
      {row.open && row.step ? (
        <div className="sy-rc__detail">
          <span className="sy-nowtag">
            <PixelArt name="v2-systems-st-now" decorative />
            <span>{REPORT_WORDS.nextStep}</span>
          </span>
          <p className="sy-rc__act">{row.step.text}</p>
          <TokenLine who={row.step.who} />
        </div>
      ) : null}
    </li>
  );
}

function ReportCard({ v, s }: { v: Hub; s: Session }) {
  const r = v.report;
  return (
    <section className="sy-card sy-rc" aria-labelledby="sy-rc-h">
      <header className="sy-card__head">
        <h3 id="sy-rc-h" className="sy-h3">
          {REPORT_WORDS.title}
        </h3>
        {v.wastingLabel ? (
          <span className="sy-rc__count">
            <PixelArt name="v2-systems-st-waste" decorative />
            <span>{v.wastingLabel}</span>
          </span>
        ) : null}
      </header>
      {r ? (
        <>
          <p className="sy-rc__lede">{r.lede}</p>
          <div
            className="sy-rc__axis"
            style={{ '--here': `${r.here * 100}%` } as CSSProperties}
            aria-hidden="true"
          >
            {r.axis.map((a) => (
              <span key={a.id} className={cx('sy-rc__ax', a.here && 'is-here')}>
                {a.short ?? ''}
              </span>
            ))}
            <span className="sy-rc__you">{REPORT_WORDS.you}</span>
          </div>
          <ol className="sy-rc__rows">
            {r.rows.map((row) => (
              <ReportRowItem key={row.id} row={row} s={s} here={r.here} />
            ))}
          </ol>
          <button
            type="button"
            className="a-btn a-btn--quiet sy-rc__all"
            onClick={() => {
              // The hash is the route (M17 TR-3), so this moves focus to the bands instead of linking.
              const h = document.getElementById('sy-all-h');
              h?.focus();
              h?.scrollIntoView?.({ block: 'start' });
            }}
          >
            {r.allSystems}
          </button>
        </>
      ) : (
        <p className="sy-muted">{REPORT_WORDS.nothingBehind}</p>
      )}
    </section>
  );
}

function Band({ g, v, s }: { g: Hub['groups'][number]; v: Hub; s: Session }) {
  const b = v.bands[g.world];
  return (
    <section
      className="sy-band"
      aria-labelledby={`world-${g.world}-h`}
      style={g.world > 0 && g.world <= 7 ? ({ '--band': `var(--w${g.world})` } as CSSProperties) : undefined}
    >
      <h4 id={`world-${g.world}-h`} className="sy-band__h">
        <span>{g.heading}</span>
        {b?.needYou ? <span className="sy-band__sub">{b.needYou}</span> : null}
      </h4>
      <ul className="sy-tiles">
        {g.tiles.map((t) => (
          <Tile key={t.id} tile={t} s={s} />
        ))}
      </ul>
      {b?.notCovered ? (
        <p className="sy-band__nc">
          <StatusMark status="not-covered" word={b.notCovered} />
        </p>
      ) : null}
    </section>
  );
}

export function SystemsHub({ s }: { s: Session }) {
  // M21 FR-S1: the hub's report card is built here, in the lazy hub, from the same result and
  // preferences as the session's M17 view (which the nav badge keeps reading).
  const v = useMemo(
    () =>
      buildSystemsHubView(s.result, toNowPrefs(s.prefs.data, null), {
        now: s.now,
        lastCloudSave: s.lastCloudSave,
      }),
    [s.result, s.prefs.data, s.now, s.lastCloudSave],
  );
  return (
    <section className="systems-hub" aria-labelledby="systems-h">
      <h2 id="systems-h" className="place-h sy-place-h" data-place-heading tabIndex={-1}>
        {HUB_WORDS.title}
      </h2>
      {v.wastingNow.length > 0 ? (
        <section className="sy-wasting" aria-labelledby="sy-wasting-h">
          <h3 id="sy-wasting-h" className="sy-h3">
            {REPORT_WORDS.wastingTitle}
          </h3>
          <ul className="sy-chips">
            {v.wastingNow.map((n) => {
              const art = systemArt(n.id);
              return (
                <li key={n.id}>
                  <a
                    className="a-chip sy-chip"
                    href={formatRoute({ place: 'system', id: n.id })}
                    onClick={go(s, n.id)}
                  >
                    <PixelArt name={art.name} ramp={art.ramp} decorative />
                    <span>{n.name}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <ReportCard v={v} s={s} />
      <section className="sy-all" aria-labelledby="sy-all-h">
        <h3 id="sy-all-h" className="sy-h3" tabIndex={-1}>
          {BAND_WORDS.title}
        </h3>
        {v.groups.map((g) => (
          <Band key={g.world} g={g} v={v} s={s} />
        ))}
        {v.later ? (
          <details className="sy-later">
            <summary>{v.later.label}</summary>
            <ul className="sy-tiles">
              {v.later.tiles.map((t) => (
                <Tile key={t.id} tile={t} s={s} />
              ))}
            </ul>
          </details>
        ) : null}
        {v.beyond ? <p className="sy-muted">{v.beyond}</p> : null}
        {v.otherGaps.length > 0 ? (
          <section className="sy-gaps" aria-labelledby="other-gaps-h">
            <h4 id="other-gaps-h" className="sy-band__h">
              {HUB_WORDS.otherGaps}
            </h4>
            <ul>
              {v.otherGaps.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </section>
  );
}
