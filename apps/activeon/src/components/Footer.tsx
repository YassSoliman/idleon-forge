// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The footer (M24 rule 8: one line). Left: the page's Sources, or the default credit (numbers by IdleOn
// Toolbox, facts from the IdleOn Wiki); a place fills it with <PageSources> (shell/page-sources.tsx).
// Right: the legal line, kept short and always reachable ("Fan-made, read-only", the boards' words), then
// Suggest and Source. The full disclaimer, the links, your data and the versions
// live in the ••• menu. Paste, sign-in and the Account no longer sit under every page (rule 8).
import { FOOTER_WORDS as W } from '@idleon-forge/engine/now';
import { type Ref, useEffect, useRef } from 'react';

export const SOURCE_URL = 'https://github.com/YassSoliman/idleon-forge';

export function Footer({
  credit,
  slotRef,
  onSuggest,
}: {
  /** The default left half when no page set its Sources. */
  credit: string;
  /** Where <PageSources> portals its line. */
  slotRef?: Ref<HTMLSpanElement>;
  onSuggest(): void;
}) {
  // The Sources line ends in an ellipsis when it is longer than the line; its full text is its title.
  const src = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const el = src.current;
    if (!el || typeof MutationObserver === 'undefined') return;
    const sync = () => {
      el.title = (el.querySelector('.n-foot__page')?.textContent || el.textContent || '').trim();
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, []);
  return (
    <footer className="foot n-foot">
      <div className="n-foot__in">
        <p ref={src} className="n-foot__src">
          <span ref={slotRef} className="n-foot__page" />
          <span className="n-foot__default">{credit}</span>
        </p>
        <p className="n-foot__end">
          <span>{W.legal}</span>
          <button type="button" className="n-foot__link" onClick={onSuggest}>
            {W.suggest}
          </button>
          <a className="n-foot__link" href={SOURCE_URL} target="_blank" rel="noopener noreferrer">
            {W.source}
          </a>
        </p>
      </div>
    </footer>
  );
}
