// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the pieces the three read-only pages share (the framed answer, a numbered row list, a
// tag, the class icon of a character, the Source line). Every word comes from EngineResult.world4.
// M25: game sprites (class icons, and a row's own sprite via `art`), our kit as the fallback.
import type { W4Frame, W4Row, W4Tone, World4Source } from '@idleon-forge/engine/world4';
import type { ReactNode } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import type { GameArt } from '../art/game/game-art';
import { classArtOfName } from '../art/game/w4-art';
import { spriteOf } from '../art/sprites';
import { Sprite } from '../art/sprites/Sprite';
import { Frame as AFrame, Tag as ATag, cx, Meter } from '../design/atoms';
import { PageSources } from '../shell/page-sources';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';

/** A Toolbox class name -> our kit's fallback sprite ("Bubonic_Conjuror" -> "class-bubonic-conjurer"). */
export function classSprite(cls: string): string {
  const fallback = `class-${cls.toLowerCase().replace(/_/g, '-').replace('conjuror', 'conjurer')}`;
  return spriteOf(fallback) ? fallback : 'class-beginner'; // the fallback's own fallback
}

export const toneClass = (t: W4Tone) => `w4-t--${t}`;

/** The shell's Tag; sky and grey read as the plain tag (a timer or later is said by its word). */
export function Tag({ tone = 'muted', children }: { tone?: W4Tone; children: ReactNode }) {
  return (
    <ATag tone={tone === 'gold' || tone === 'coral' || tone === 'mint' ? tone : undefined}>{children}</ATag>
  );
}

/** A link to another System page, as the shell routes it. */
export function SystemLink({ s, system, children }: { s: Session; system: string; children: ReactNode }) {
  return (
    <a
      className="sy-link"
      href={formatRoute({ place: 'system', id: system })}
      onClick={(e) => {
        e.preventDefault();
        s.navigate({ place: 'system', id: system }, 'push');
      }}
    >
      {children}
    </a>
  );
}

/** The page's one framed answer (`.a-frame`, DS rule 1). */
export function Frame({ f, s }: { f: W4Frame; s: Session }) {
  const meterTone = f.tone === 'coral' ? 'fix' : f.tone === 'mint' ? 'ok' : 'accent';
  return (
    <AFrame
      tone={f.tone === 'coral' ? 'coral' : f.tone === 'mint' ? 'ok' : 'gold'}
      pad={false}
      className={cx('w4-frame', toneClass(f.tone))}
      aria-labelledby="w4-frame-h"
    >
      <div className="w4-frame__text">
        <span className="w4-cap w4-cap--tone">{f.cap}</span>
        <h3 id="w4-frame-h" className="w4-frame__title">
          {f.title}
        </h3>
        <p className="w4-muted">{f.why}</p>
      </div>
      <div className="w4-frame__num">
        <span className="w4-big num">
          {f.value} <span className="w4-big__unit">{f.unit}</span>
        </span>
        {f.meter !== null ? (
          <Meter value={f.meter} max={1} label={`${f.value} ${f.unit}`} tone={meterTone} />
        ) : null}
        {f.link ? (
          <SystemLink s={s} system={f.link.system}>
            {f.link.label} ›
          </SystemLink>
        ) : null}
      </div>
    </AFrame>
  );
}

/** A numbered (or plain) hairline list of rows: name and detail, an extra column, a status word. */
export function Rows({
  rows,
  label,
  numbered = true,
  art,
}: {
  rows: W4Row[];
  label: string;
  numbered?: boolean;
  /** M25: each row's game sprite (from its key), with our kit sprite `fallback` when it fails. */
  art?: { of: (r: W4Row) => GameArt | null; fallback: string; dim?: (r: W4Row) => boolean };
}) {
  return (
    <ol className="w4-rows" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} className={cx('w4-row', r.quiet && 'is-quiet')}>
          {numbered && r.n !== undefined ? (
            <span className={cx('w4-num', toneClass(r.tone))} aria-hidden="true">
              {r.n}
            </span>
          ) : null}
          {art ? (
            <span className={cx('w4-row__ic', art.dim?.(r) && 'w4-dim')}>
              <GameIcon art={art.of(r)} fallback={art.fallback} size={24} decorative />
            </span>
          ) : null}
          <span className="w4-row__main">
            <span className="w4-strong">{r.name}</span>
            {r.detail ? <span className="w4-muted w4-small">{r.detail}</span> : null}
          </span>
          {r.extra ? <span className="w4-row__extra w4-muted w4-small num">{r.extra}</span> : null}
          <span className={cx('w4-row__status w4-small', toneClass(r.tone))}>{r.status}</span>
        </li>
      ))}
    </ol>
  );
}

/** A character's class: the game's class icon, our class sprite as the fallback. */
export function ClassArt({ cls, size = 32 }: { cls: string; size?: 24 | 32 | 48 }) {
  return (
    <GameIcon
      art={classArtOfName(cls)}
      fallback={<Sprite name={classSprite(cls)} size={size} decorative className="w4-class" />}
      size={size}
      decorative
      className="w4-class"
    />
  );
}

/** The one quiet Source line under a page (DS rule 4). */
export function SourceLine({ sources }: { sources: World4Source[] }) {
  return (
    <PageSources>
      Read-only page, no checks yet ·{' '}
      {sources.map((x, i) => (
        <span key={x.url}>
          {i > 0 ? ' · ' : ''}
          <a href={x.url} target="_blank" rel="noopener noreferrer">
            {x.title}
          </a>
        </span>
      ))}{' '}
      · IdleOn Toolbox 2.3.540
    </PageSources>
  );
}
