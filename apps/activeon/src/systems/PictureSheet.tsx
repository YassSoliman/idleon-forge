// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M21 FR-S6: tapping any element of a System picture opens one sheet (the `Sheet` atom: a bottom sheet on
// a phone, a side panel from 1000 px) with its value, next value, cost and the System's Source. Level 2
// of DS-4's two levels: the sheet never opens another sheet. The words come from the engine's view
// words; the values from the picture's data.
import { PAGE_WORDS } from '@idleon-forge/engine/now';
import { FRAME_WORDS } from '@idleon-forge/engine/systems-ui';
import { type ReactNode, useCallback, useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import type { GameArt } from '../art/game/game-art';
import { wikiHref, wikiLabel } from '../art/game/wiki';
import { Sheet } from '../design/atoms';

export interface SheetItem {
  title: string;
  /** "Now", "Next", "Cost" rows; a null value is hidden (DS-3). */
  rows: { label: string; value: string | null }[];
  /** One extra line (how to get it, the Spend Plan note). */
  note?: string | null;
  /** M25: the thing's game sprite, drawn at the top of the sheet. */
  art?: GameArt | null;
  /** M25: the thing's display name when it has an IdleOn Wiki page of its own. */
  wikiName?: string | null;
}

export function usePictureSheet(wiki: string | null): {
  open(item: SheetItem): void;
  sheet: ReactNode;
} {
  const [item, setItem] = useState<SheetItem | null>(null);
  const open = useCallback((i: SheetItem) => setItem(i), []);
  const rows = item?.rows.filter((r) => r.value !== null) ?? [];
  const sheet = (
    <Sheet
      open={item !== null}
      title={item?.title ?? ''}
      onClose={() => setItem(null)}
      closeLabel={FRAME_WORDS.close}
    >
      {item ? (
        <div className="sy-sheet">
          {item.art ? (
            <span className="sy-sheet__art">
              <GameIcon art={item.art} size={64} decorative />
            </span>
          ) : null}
          {rows.length ? (
            <dl className="sy-sheet__rows">
              {rows.map((r) => (
                <div key={r.label}>
                  <dt>{r.label}</dt>
                  <dd className="num">{r.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {item.note ? <p>{item.note}</p> : null}
          {item.wikiName && wikiHref(item.wikiName) ? (
            <p className="sy-sheet__src">
              <a href={wikiHref(item.wikiName) ?? ''} target="_blank" rel="noopener noreferrer">
                {wikiLabel(item.wikiName)}
              </a>
            </p>
          ) : null}
          {wiki ? (
            <p className="sy-sheet__src">
              <a href={wiki} target="_blank" rel="noopener noreferrer">
                {PAGE_WORDS.wiki}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
  return { open, sheet };
}

/** The `is-now` element of a picture (FR-S6): the page's highlight when it names one, else the picture's own. */
export function litOf(
  elements: readonly { id: string; actionKey: string | null }[],
  highlight: string | null,
  own: string | null,
): string | null {
  if (highlight) {
    const hit = elements.find((e) => e.actionKey === highlight);
    if (hit) return hit.id;
  }
  return own;
}
