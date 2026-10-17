// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Roster (M10 variant A, FR-4 to FR-6): one numbered row per character in Visit Order. Each row
// is a button whose accessible name says everything on it (US-1, TR-14).
import type { NowView, RosterRow } from '@idleon-forge/engine/now';
import { forwardRef } from 'react';

export function Pill({ pill }: { pill: RosterRow['pill'] }) {
  return <span className={`pill ${pill.kind}`}>{pill.text}</span>;
}

const Row = forwardRef<HTMLButtonElement, { row: RosterRow; onOpen(i: number): void; onSpend(): void }>(
  function Row({ row, onOpen, onSpend }, ref) {
    return (
      <li className={`r ${row.pill.kind}`}>
        <button
          ref={ref}
          type="button"
          className="r-btn"
          aria-label={row.accessibleName}
          data-index={row.index}
          onClick={() => onOpen(row.index)}
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
          <span className="r-summary">{row.summary}</span>
        </button>
        {row.spendChip ? (
          <button type="button" className="chip spend" onClick={onSpend}>
            {row.spendChip}
          </button>
        ) : null}
      </li>
    );
  },
);

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
  return (
    <section aria-label="Characters">
      <h2 className="section-h">Characters</h2>
      <ol className="roster">
        {view.roster.map((row) => (
          <Row
            key={row.index}
            row={row}
            onOpen={onOpen}
            onSpend={onSpend}
            ref={(el) => rowRef(row.index, el)}
          />
        ))}
      </ol>
    </section>
  );
}
