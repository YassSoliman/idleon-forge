// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// What's new as the patch notes scroll (owner override of `flows.whats-new`; D-16). It docks above the
// bottom bar as a 56 px tab ("What's new · 3") and opens on tap, so it never covers the counter (DS-1):
// a short scroll of up to 3 changes with "Got it", once per release, and "and N more" to every change.
import { NEWS_WORDS as W } from '@idleon-forge/engine/now';
import { useState } from 'react';
import { PixelArt } from '../../design/art/PixelArt';
import { Button } from '../../design/atoms/Button';
import { COMMITS_URL, type WhatsNewView } from '../release';
import { ModalSheet as Sheet } from './ModalSheet';

/** The scroll shows at most this many changes; the rest are "and N more". */
export const NEWS_SHOWN = 3;

export function newsItems(view: WhatsNewView) {
  const all = view.groups.flatMap((g) => g.entries);
  return { shown: all.slice(0, NEWS_SHOWN), more: all.length - Math.min(all.length, NEWS_SHOWN) + view.more };
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
        <div className="n-news">
          <div className="n-news__head">
            <PixelArt name="flows-patch-scroll" scale={2} decorative />
            <p className="n-muted">{W.count(total)}</p>
          </div>
          <ol className="n-news__list">
            {shown.map((e) => (
              <li key={e.id}>{e.text}</li>
            ))}
          </ol>
          {more > 0 ? (
            <p className="n-small">
              {W.more(more)}:{' '}
              <a href={COMMITS_URL} target="_blank" rel="noopener noreferrer">
                {W.everyChange}
              </a>
            </p>
          ) : null}
          <Button
            tone="primary"
            className="n-wide"
            onClick={() => {
              setOpen(false);
              onDismiss();
            }}
          >
            {W.gotIt}
          </Button>
        </div>
      </Sheet>
    </>
  );
}
