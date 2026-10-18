// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The fallback Roster (M21 `flows.cant-work-out` Fallback roster): while advice is paused it keeps the
// Roster's shape and order, with who is doing what and no Verdicts. No slot labels (DS-13): the
// who-glyph and class + level. The engine didn't run, so there are no class families: every character
// draws the plain blob, with its class word beside it.
import { type AccountState, humanize } from '@idleon-forge/account-state';
import { SETUP_WORDS, FLOW_WORDS as W } from '@idleon-forge/engine/now';
import { PixelArt } from '../design/art/PixelArt';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { describeActivity } from '../format';

type Row = { kind: 'read'; c: AccountState['characters'][number] } | { kind: 'unreadable'; index: number };

export function CharacterList({ state }: { state: AccountState }) {
  const { characters, diagnostics } = state;
  // A character that couldn't be read is an Unknown row in its slot, never dropped (FR-19b).
  const rows: Row[] = [
    ...characters.map((c) => ({ kind: 'read' as const, c })),
    ...diagnostics.unreadableCharacters.map((index) => ({ kind: 'unreadable' as const, index })),
  ].sort((a, b) => (a.kind === 'read' ? a.c.index : a.index) - (b.kind === 'read' ? b.c.index : b.index));
  return (
    <section aria-label="Characters" className="n-roster">
      <h2 className="n-section-h">Characters</h2>
      <ul className="roster n-rows n-fallback">
        {rows.map((row) =>
          row.kind === 'read' ? (
            <li key={row.c.index} className="r n-row n-fbrow">
              <WhoGlyph family="beginner" classLabel={humanize(row.c.class)} scale={2} decorative />
              <span className="n-row__l1">
                <b>
                  {humanize(row.c.class)} <span className="num">{row.c.level}</span>
                </b>
              </span>
              <span className="n-row__v">
                <span className="a-stamp a-stamp--unknown">
                  <PixelArt name="now-glyph-stale" decorative />
                  <span className="a-stamp__word">{W.pausedWord}</span>
                </span>
              </span>
              <span className="n-row__l2 n-muted">
                {[describeActivity(row.c), row.c.currentMap ? humanize(row.c.currentMap) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </li>
          ) : (
            <li key={row.index} className="r n-row unknown">
              <WhoGlyph family="beginner" classLabel="Unknown" scale={2} decorative />
              <span className="n-row__l1">
                <b>Character {row.index + 1}</b>
              </span>
              <span className="n-row__v">
                <span className="a-stamp a-stamp--unknown">
                  <PixelArt name="now-glyph-question" decorative />
                  <span className="a-stamp__word">Unknown</span>
                </span>
              </span>
              <span className="n-row__l2">{SETUP_WORDS.unreadable}</span>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
