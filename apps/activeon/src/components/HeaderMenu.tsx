// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The ••• menu (M24 Menu and MenuPhone boards; M21 G1, G10), in its sheet: a side panel from 1000 px, a
// bottom sheet on a phone. Five sections, in order:
//   Your save: signed in and live, a pasted save, or none, with Sign out / Sign in; "Paste a save
//     instead" opens the paste box right here (rule 8: paste and sign-in left the foot of every page).
//   Look: Theme, Times and Back in (the Settings rows, inline; no second sheet, DS-4).
//   Tell us: Suggest something, Your suggestions, Something confusing here?, a failed check.
//   Your data on this browser: Clear my data, Goes / Stays and the hold.
//   Links: IdleOn Toolbox, IdleOn Wiki, the source code; Family level and the versions; the full
//     fan-made disclaimer (the footer keeps its one-line version).
// Every row is a real button or link, 44 px. A row that opens something else closes the menu first.

import { MENU_WORDS as W } from '@idleon-forge/engine/menu-text';
import { HEADER_WORDS } from '@idleon-forge/engine/now';
import { type ReactNode, useId, useState } from 'react';
import type { ArtName } from '../design/art/names';
import { PixelArt } from '../design/art/PixelArt';
import { Blob } from '../design/atoms/Blob';
import { Pip } from '../design/atoms/Surfaces';
import { SOURCE_URL } from './Footer';

export type MenuSaveKind = 'live' | 'paste' | 'none';

export interface HeaderMenuProps {
  familyLevel: number | null;
  /** Your save: live (signed in), a paste, or none yet; `action` is Sign out or Sign in. */
  save?: { kind: MenuSaveKind; action: ReactNode | null };
  /** The paste box, opened by "Paste a save instead". Null: no paste here (it is the page already). */
  paste?: ReactNode | null;
  /** The Look section's rows (Theme, Times, Back in). */
  settings?: ReactNode;
  /** Settings in their own sheet (kept for callers that have no inline rows). */
  onSettings?: (() => void) | null;
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
  /** Failed checks, with a Report. */
  failedChecks: { text: string; onReport(): void } | null;
  /** Clear my data, when there is anything to clear. */
  clear?: ReactNode | null;
  /** Legacy slot (Sign out / Sign in); `save.action` replaces it. */
  account?: ReactNode;
}

function Row({ glyph, children, onClick }: { glyph: ArtName; children: ReactNode; onClick(): void }) {
  return (
    <li>
      <button type="button" className="n-menu-row" onClick={onClick}>
        <PixelArt name={glyph} decorative />
        <span className="n-menu-row__text">{children}</span>
      </button>
    </li>
  );
}

const SAVE_LINE: Record<MenuSaveKind, [string, string]> = {
  live: [W.live, W.liveHint],
  paste: [W.pasted, W.pastedHint],
  none: [W.none, W.noneHint],
};

function YourSave({ save, paste }: { save: NonNullable<HeaderMenuProps['save']>; paste: ReactNode | null }) {
  const [open, setOpen] = useState(false);
  const pasteId = useId();
  const [line, hint] = SAVE_LINE[save.kind];
  return (
    <section className="n-menu-sec" aria-label={W.yourSave}>
      <h3 className="a-cap">{W.yourSave}</h3>
      <div className="a-tile n-save-tile">
        <Blob size={40} />
        <div className="n-save-tile__text">
          <span className="n-save-tile__line">
            {save.kind === 'live' ? <span className="n-fresh" aria-hidden="true" /> : <Pip />}
            {line}
          </span>
          <span className="n-save-tile__hint">{hint}</span>
        </div>
        {save.action ? <div className="n-save-tile__action">{save.action}</div> : null}
      </div>
      {paste ? (
        <>
          <button
            type="button"
            className="n-menu-row"
            aria-expanded={open}
            aria-controls={pasteId}
            onClick={() => setOpen((o) => !o)}
          >
            <PixelArt name="flows-clipboard-empty" decorative />
            <span className="n-menu-row__text">{W.paste}</span>
            <span className="n-menu-row__aside">{W.pasteFrom}</span>
          </button>
          <div id={pasteId} hidden={!open} className="n-menu-paste">
            {open ? paste : null}
          </div>
        </>
      ) : null}
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a className="n-menu-link" href={href} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">↗</span>
      <span className="sr-only"> {W.opensNewTab}</span>
    </a>
  );
}

export function HeaderMenu(p: HeaderMenuProps) {
  const versions = [p.familyLevel !== null ? HEADER_WORDS.familyLevel(p.familyLevel) : null, p.versions]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="n-menu">
      {p.save ? <YourSave save={p.save} paste={p.paste ?? null} /> : null}

      {p.settings ? (
        <section className="n-menu-sec" aria-label={W.look}>
          <h3 className="a-cap">{W.look}</h3>
          {p.settings}
        </section>
      ) : null}

      <section className="n-menu-sec n-menu-sec--tight" aria-label={W.tellUs}>
        <h3 className="a-cap">{W.tellUs}</h3>
        <ul className="n-menu-list">
          {p.onSettings ? (
            <Row glyph="cards-src-gear" onClick={p.onSettings}>
              {HEADER_WORDS.settings}
            </Row>
          ) : null}
          <Row glyph="now-signpost" onClick={p.onSuggest}>
            {HEADER_WORDS.suggest}
          </Row>
          {p.onYourSuggestions ? (
            <Row glyph="cards-src-book" onClick={p.onYourSuggestions}>
              {HEADER_WORDS.yourSuggestions}
            </Row>
          ) : null}
          <Row glyph="now-glyph-question" onClick={p.onConfusing}>
            {HEADER_WORDS.confusing}
          </Row>
          {p.failedChecks ? (
            <Row glyph="now-glyph-wrench" onClick={p.failedChecks.onReport}>
              {p.failedChecks.text}
            </Row>
          ) : null}
        </ul>
      </section>

      {p.clear ? (
        <section className="n-menu-sec" aria-label={W.yourData}>
          <h3 className="a-cap">{W.yourData}</h3>
          {p.clear}
        </section>
      ) : null}

      {p.account ? <div className="n-menu-account">{p.account}</div> : null}

      <section className="n-menu-sec n-menu-sec--tight n-menu-about" aria-label="About">
        <p className="n-menu-links">
          <ExternalLink href="https://github.com/Morta1/IdleonToolbox">{W.toolbox}</ExternalLink>
          <ExternalLink href="https://idleon.wiki/wiki/Main_Page">{W.wiki}</ExternalLink>
          <ExternalLink href={SOURCE_URL}>{W.source}</ExternalLink>
        </p>
        <p className="n-menu-note num">
          {versions}
          {p.patchNote ? ` · ${p.patchNote}` : null}
        </p>
        {p.historyNote ? <p className="n-menu-note">{p.historyNote}</p> : null}
        <p className="n-menu-note">{W.legal}</p>
      </section>
    </div>
  );
}
