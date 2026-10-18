// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// Pills and the Verdict stamp (M21 FR-F5, TR-5, DS-5). Pill grammar: colour = urgency, glyph = kind,
// text = the fix verb ("Anvil full · collect"). A grey "fine" state exists; a cap that doesn't change
// the Verdict reads "optional". The words are the engine's; the atom adds none. Never letter-spaced
// and never in a pixel face (DS-14).

import type { ArtName } from '../art/names';
import { PixelArt } from '../art/PixelArt';
import { cx } from './Button';
import { VERDICT_GLYPH, type Verdict } from './glyphs';

export type Urgency = 'fix' | 'soon' | 'fine' | 'optional' | 'unknown' | 'skipped';

export interface PillProps {
  urgency: Urgency;
  glyph: ArtName;
  verb: string;
  /** How many characters it is on, for a roster-level finding ("on 6"): shown as a number chip. */
  count?: number;
  /** A roster-level finding is also a filter (DS-7): a toggle button. */
  filter?: { pressed: boolean; onToggle(): void };
}

export function Pill({ urgency, glyph, verb, count, filter }: PillProps) {
  const body = (
    <>
      <PixelArt name={glyph} decorative />
      <span className="a-pill__verb">{verb}</span>
      {count !== undefined ? <span className="a-pill__count num">{count}</span> : null}
    </>
  );
  const cls = cx('a-pill', `a-pill--${urgency}`, filter && 'a-pill--filter');
  if (filter)
    return (
      <button type="button" className={cls} aria-pressed={filter.pressed} onClick={filter.onToggle}>
        {body}
      </button>
    );
  return <span className={cls}>{body}</span>;
}

export interface VerdictStampProps {
  verdict: Verdict;
  /** The engine's word: "Ready", "Fix", "Unknown", "Skipped". */
  word: string;
  /** The long form, Focus only ("2 fixes before you leave"). */
  long?: string;
}

/** The Verdict stamp: glyph plus word, Atkinson 12 px bold (now.verdict-pill pick, DS-8). */
export function VerdictStamp({ verdict, word, long }: VerdictStampProps) {
  return (
    <span className={cx('a-stamp', `a-stamp--${verdict}`)}>
      <PixelArt name={VERDICT_GLYPH[verdict]} decorative />
      <span className="a-stamp__word">{word}</span>
      {long ? <span className="a-stamp__long">{long}</span> : null}
    </span>
  );
}
