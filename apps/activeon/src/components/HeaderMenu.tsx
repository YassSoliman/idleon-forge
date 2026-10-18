// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 G1: the header's overflow menu, in its sheet (a side panel from 1000 px). In order: Family level,
// Settings, Suggest something, Your suggestions, Something confusing here?, the versions line, the
// history note, and Sign out (signed in) or Sign in. Every row is 44 px with a 16 px glyph. A row that
// opens something else closes the menu first, so a sheet never opens inside a sheet (DS-4).
import { HEADER_WORDS as W } from '@idleon-forge/engine/now';
import type { ReactNode } from 'react';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';

export interface HeaderMenuProps {
  familyLevel: number | null;
  onSettings(): void;
  onSuggest(): void;
  /** Your suggestions: only for a signed-in player (M13 FR-16). */
  onYourSuggestions: (() => void) | null;
  onConfusing(): void;
  /** "ActiveOn 0.1.0 · knowledge #ec89 · game build 142". */
  versions: string;
  /** M1's history note ("History is kept for 30 days on this browser"), when there is one. */
  historyNote: string | null;
  /** M12: the patch note when the game is newer than the parser was built for. */
  patchNote: string | null;
  /** Failed checks, with a Report (the footer's old line). */
  failedChecks: { text: string; onReport(): void } | null;
  /** Sign out (with its confirm) when signed in, Sign in when signed out with a save; else nothing. */
  account: ReactNode;
}

function Row({ glyph, children, onClick }: { glyph: ArtName; children: ReactNode; onClick(): void }) {
  return (
    <li>
      <button type="button" className="n-menu-row" onClick={onClick}>
        <PixelArt name={glyph} decorative />
        <span>{children}</span>
      </button>
    </li>
  );
}

function Line({ glyph, children }: { glyph: ArtName; children: ReactNode }) {
  return (
    <li className="n-menu-line">
      <PixelArt name={glyph} decorative />
      <span>{children}</span>
    </li>
  );
}

export function HeaderMenu(p: HeaderMenuProps) {
  return (
    <div className="n-menu">
      <ul className="n-menu-list">
        {p.familyLevel !== null ? (
          <Line glyph="now-blob-beginner">
            <span className="num">{W.familyLevel(p.familyLevel)}</span>
          </Line>
        ) : null}
        <Row glyph="cards-src-gear" onClick={p.onSettings}>
          {W.settings}
        </Row>
        <Row glyph="now-signpost" onClick={p.onSuggest}>
          {W.suggest}
        </Row>
        {p.onYourSuggestions ? (
          <Row glyph="cards-src-book" onClick={p.onYourSuggestions}>
            {W.yourSuggestions}
          </Row>
        ) : null}
        <Row glyph="now-glyph-question" onClick={p.onConfusing}>
          {W.confusing}
        </Row>
        {p.failedChecks ? (
          <Row glyph="now-glyph-wrench" onClick={p.failedChecks.onReport}>
            {p.failedChecks.text}
          </Row>
        ) : null}
        <Line glyph="cards-src-scroll">
          <span className="num">{p.versions}</span>
          {p.patchNote ? <span className="n-muted"> · {p.patchNote}</span> : null}
        </Line>
        {p.historyNote ? <Line glyph="now-hourglass">{p.historyNote}</Line> : null}
      </ul>
      {p.account ? <div className="n-menu-account">{p.account}</div> : null}
    </div>
  );
}
