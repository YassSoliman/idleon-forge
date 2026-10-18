// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Roster (M10 variant A, FR-4 to FR-6): one numbered row per character in Visit Order. Each row
// is a button whose accessible name says everything on it (US-1, TR-14).
import { LINK_WORDS, type NowView, type RosterRow } from '@idleon-forge/engine/now';
import { forwardRef } from 'react';
import { formatRoute } from '../shell/route';
import { useNowActions } from './context';
import { capOpenId } from './parts';

export function Pill({ pill }: { pill: RosterRow['pill'] }) {
  return <span className={`pill ${pill.kind}`}>{pill.text}</span>;
}

/**
 * R-PILL-1: the row's cap pills, before the summary, at most 3 then "+n". They sit inside the row's
 * button, so a tap on one opens Focus with that pill already open (its Why, Source and refill time).
 */
function RowCaps({ row }: { row: RosterRow }) {
  if (row.caps.length === 0) return null;
  return (
    <span className="r-caps">
      {row.caps.map((c) => (
        <span key={c.key} className={`cap${c.fullNow ? ' full' : ''}`} data-cap={c.key}>
          {c.label}
        </span>
      ))}
      {row.moreCaps > 0 ? <span className="cap more">+{row.moreCaps}</span> : null}
    </span>
  );
}

const Row = forwardRef<
  HTMLButtonElement,
  { row: RosterRow; buildable: boolean; carded: boolean; onOpen(i: number): void; onSpend(): void }
>(function Row({ row, buildable, carded, onOpen, onSpend }, ref) {
  const actions = useNowActions();
  const onClick = (e: React.MouseEvent) => {
    const cap = (e.target as HTMLElement).closest<HTMLElement>('[data-cap]')?.dataset.cap;
    if (cap && !actions.expanded.has(capOpenId(cap))) actions.toggle(capOpenId(cap));
    onOpen(row.index);
  };
  return (
    <li className={`r ${row.pill.kind}`}>
      <button
        ref={ref}
        type="button"
        className="r-btn"
        aria-label={row.accessibleName}
        data-index={row.index}
        onClick={onClick}
      >
        <span className="r-top">
          <span className="r-num num">{row.position}</span>
          <span className="r-name">{row.name}</span>
          <span className="r-class">
            {row.classLabel} · lv {row.level}
          </span>
          <Pill pill={row.pill} />
        </span>
        <span className="r-doing">
          {row.playing ? <span className="playing">● playing</span> : null}
          {row.nextUp ? <span className="playing">Next up</span> : null}
          <span className="r-where">{[row.activity, row.map].filter(Boolean).join(' · ')}</span>
        </span>
        <RowCaps row={row} />
        {row.summary ? <span className="r-summary">{row.summary}</span> : null}
      </button>
      {buildable || carded ? (
        <span className="r-tabs">
          {buildable ? (
            <a
              className="chip build"
              href={`#build-${row.index}`}
              aria-label={`${row.name}: build`}
              onClick={(e) => {
                e.preventDefault();
                actions.openTab(row.index, 'build');
              }}
            >
              Build
            </a>
          ) : null}
          {carded ? (
            <a
              className="chip build"
              href={`#cards-${row.index}`}
              aria-label={`${row.name}: cards`}
              onClick={(e) => {
                e.preventDefault();
                actions.openTab(row.index, 'cards');
              }}
            >
              Cards
            </a>
          ) : null}
        </span>
      ) : null}
      {row.spendChip ? (
        <button type="button" className="chip spend" onClick={onSpend}>
          {row.spendChip}
        </button>
      ) : null}
    </li>
  );
});

export function Roster({
  view,
  onOpen,
  onSpend,
  rowRef,
}: {
  view: NowView;
  onOpen(i: number): void;
  onSpend(): void;
  rowRef(index: number, el: HTMLButtonElement | null): void;
}) {
  const actions = useNowActions();
  return (
    <section aria-label="Characters">
      <h2 className="section-h roster-h">
        Characters
        {view.builds.length > 0 || view.cards ? (
          // M17 D-7: the Builds and Cards overviews live in Characters now; the row chips stay.
          <span className="roster-links">
            <a
              className="roster-builds"
              href={formatRoute({ place: 'characters', section: null })}
              onClick={(e) => {
                if (!actions.navigate) return;
                e.preventDefault();
                actions.navigate({ place: 'characters', section: null });
              }}
            >
              {LINK_WORDS.toCharacters}
            </a>
          </span>
        ) : null}
      </h2>
      <ol className="roster">
        {view.roster.map((row) => (
          <Row
            key={row.index}
            row={row}
            buildable={view.builds.some((b) => b.index === row.index)}
            carded={view.cards?.characters.some((c) => c.index === row.index) ?? false}
            onOpen={onOpen}
            onSpend={onSpend}
            ref={(el) => rowRef(row.index, el)}
          />
        ))}
      </ol>
    </section>
  );
}
