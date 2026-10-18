// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The compact AFK strip (M21 FR-T5), the Design Lab's `flows.afk-timeline` pick "Compact strip": one strip
// on the Timeline's shared axis, a 16 px who-glyph at each character's first binding limit (outlined in
// the Fix colour when it binds before you're back), a flag at Back and one sentence under it. A tap
// opens the Timeline. Area T builds it from `buildAfkStripView`; Integration places it on Now (FR-I1).
// It is on the first screen, so it is small and draws only core art (TR-12).
import { AFK_STRIP_WORDS as W } from '@idleon-forge/engine/now';
import type { CSSProperties } from 'react';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import { formatRoute } from '../shell/route';
import type { Session } from '../shell/session';
import './afk-strip.css';

type Strip = NonNullable<Session['views']['afkStrip']>;
type Vars = CSSProperties & Record<`--${string}`, string | number>;
type Mark = Strip['marks'][number];

/** At most this many glyphs stack on one spot; the rest are a count. */
const STACK = 3;

/** Marks that land on the same spot of the axis (within 4 % of its length) stack instead of overlapping. */
function clusters(marks: readonly Mark[]): Mark[][] {
  const out: Mark[][] = [];
  for (const m of [...marks].sort((a, z) => a.x - z.x)) {
    const last = out[out.length - 1];
    const head = last?.[0];
    if (last && head && m.x - head.x < 0.04) last.push(m);
    else out.push([m]);
  }
  return out;
}

export interface AfkStripProps {
  strip: Strip | null;
  families?: Readonly<Record<number, ClassFamily>>;
  /** Opens the Timeline (a player move, pushState); the link's href works without it. */
  onOpen?(): void;
}

export function AfkStrip({ strip, families, onOpen }: AfkStripProps) {
  if (!strip) return null;
  return (
    <a
      className="afk-strip"
      href={formatRoute({ place: 'timeline', section: null })}
      aria-label={`${strip.sentence}. ${W.open}`}
      onClick={(e) => {
        if (!onOpen) return;
        e.preventDefault();
        onOpen();
      }}
    >
      <span className="afk-axis" aria-hidden="true" style={{ '--back': strip.backX } as Vars}>
        <span className="afk-rail" />
        {/* The flag at Back is drawn in CSS: `flows-back-flag` is not core art (a request for Integration). */}
        <span className="afk-back" />
        {clusters(strip.marks).map((group) => {
          const shown = group.slice(0, STACK);
          const more = group.length - shown.length;
          return shown.map((m, i) => (
            <span
              key={m.index}
              className={`afk-mark${m.beforeReturn ? ' is-fix' : ''}`}
              style={{ '--x': m.x, '--stack': i } as Vars}
              title={m.a11y}
            >
              <WhoGlyph
                family={families?.[m.index] ?? 'beginner'}
                classLabel={m.classLabel}
                scale={1}
                badge={m.classLabel.slice(0, 1)}
                decorative
              />
              {more > 0 && i === shown.length - 1 ? <span className="afk-more num">+{more}</span> : null}
            </span>
          ));
        })}
      </span>
      <span className="afk-sentence">{strip.sentence}</span>
    </a>
  );
}
