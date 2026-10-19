// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What's new as the patch notes scroll (owner override of `flows.whats-new`; D-16). It docks above the
// bottom bar as a 56 px tab ("What's new · 3") and opens on tap, so it never covers the counter (DS-1):
// a short scroll of up to 3 changes with "Got it", once per release, and "and N more" to every change.
// M24 (canvas board WhatsNew): the scroll is drawn as parchment between two wooden rollers, centred on
// a desktop, its changes under their section titles (Advice changes, App changes), each with a mark.
import { NEWS_WORDS as W } from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { Button } from '../../design/atoms/Button';
import { COMMITS_URL, type WhatsNewView } from '../release';
import { ModalSheet as Sheet } from './ModalSheet';
import './whats-new.css';

/** The scroll shows at most this many changes; the rest are "and N more". */
export const NEWS_SHOWN = 3;

export function newsItems(view: WhatsNewView) {
  const all = view.groups.flatMap((g) => g.entries);
  return { shown: all.slice(0, NEWS_SHOWN), more: all.length - Math.min(all.length, NEWS_SHOWN) + view.more };
}

/** The shown changes under their section titles, in the feed's section order (M24). */
export function newsGroups(view: WhatsNewView) {
  let left = NEWS_SHOWN;
  return view.groups
    .map((g) => {
      const entries = g.entries.slice(0, Math.max(0, left));
      left -= entries.length;
      return { section: g.section, title: g.title, entries };
    })
    .filter((g) => g.entries.length > 0);
}

/** A roller of the scroll: two wooden knobs and the rolled paper between them. */
function Roller({ at }: { at: 'top' | 'bottom' }) {
  return (
    <span className={`wn-roller wn-roller--${at}`} aria-hidden="true">
      <i className="wn-roller__knob" />
      <i className="wn-roller__paper" />
      <i className="wn-roller__knob" />
    </span>
  );
}

export function WhatsNewDock({ view, onDismiss }: { view: WhatsNewView; onDismiss(): void }) {
  const [open, setOpen] = useState(false);
  const { shown, more } = newsItems(view);
  const total = shown.length + more;
  return (
    <>
      <div className="n-news-dock">
        <button
          type="button"
          className="n-news-tab"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <PixelArt name="flows-patch-scroll" decorative />
          <span>{W.tab(total)}</span>
        </button>
      </div>
      <Sheet open={open} title={W.title} onClose={() => setOpen(false)}>
        <div className="n-news wn-scroll">
          <Roller at="top" />
          <div className="wn-paper">
            <p className="wn-count">{W.count(total)}</p>
            {newsGroups(view).map((g) => (
              <section key={g.section} className="wn-group" aria-label={g.title}>
                <h3 className="wn-group__h">{g.title}</h3>
                <ol className="n-news__list wn-list">
                  {g.entries.map((e) => (
                    <li key={e.id} className={`wn-item is-${g.section}`}>
                      {e.text}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
            {more > 0 ? <p className="wn-more">{W.more(more)}</p> : null}
            <div className="wn-foot">
              <a href={COMMITS_URL} target="_blank" rel="noopener noreferrer" className="wn-link">
                Every change, on GitHub ↗
              </a>
              <Button
                tone="primary"
                onClick={() => {
                  setOpen(false);
                  onDismiss();
                }}
              >
                {W.gotIt}
              </Button>
            </div>
          </div>
          <Roller at="bottom" />
        </div>
      </Sheet>
    </>
  );
}
