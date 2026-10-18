// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Parallel Slots grid (M21 FR-T3), the Timeline's `#slots` section: the Design Lab's `time.parallel-slots`
// pick "Slot grid". Characters by five slot columns, each cell a 16 px glyph that is solid (in use), dashed
// (empty: free value) or grey (not open yet), a column count under each, and one NOW cell from M20's fill
// order with its step under the grid. The runner-up "Unassigned tray" is its text partner: one line per
// slot kind with the characters said once. It renders `buildSlotsView` (built here, in the lazy chunk) and computes nothing else.
import { buildSlotsView, SLOTS_WORDS } from '@idleon-forge/engine/now';
import { useMemo } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { cx } from '../design/atoms';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import type { Session } from '../shell/session';
import { SLOT_ART } from './art';
import { slotTray } from './slots-tray';
import { BOARD_WORDS, SLOTS_UI_WORDS as W } from './words';

type Grid = NonNullable<ReturnType<typeof buildSlotsView>>;
type Cell = Grid['rows'][number]['cells'][number];

const familyOf = (s: Session, index: number): ClassFamily => s.view.families?.[index] ?? 'beginner';

function CellGlyph({ c }: { c: Cell }) {
  const name = c.kind === 'cauldron' && !c.filled ? 'v2-time-cauldron-empty' : SLOT_ART[c.kind];
  return <PixelArt name={name} decorative animate={false} />;
}

function SlotCell({ c, heading }: { c: Cell; heading: string }) {
  return (
    <td className={cx('sg-c', `is-${c.tone}`, c.now && 'is-now')}>
      <span className="sg-in">
        {/* R11 QA: on a phone the grid wraps, so each cell names its own column (hidden from assistive
            tech, which reads the column header). */}
        <span className="sg-k" aria-hidden="true">
          {heading}
        </span>
        <span className="sg-g">
          <CellGlyph c={c} />
        </span>
        <span className="sg-w">{c.stateWord}</span>
        <span className="sg-t">{c.text}</span>
        {c.now ? <span className="sg-nowtag">{W.nowBadge}</span> : null}
      </span>
    </td>
  );
}

export function ParallelSlots({ s }: { s: Session }) {
  // Built here, in the lazy Timeline chunk, so the builder stays out of the first load (TR-12).
  const v = useMemo(() => buildSlotsView(s.result, s.view), [s.result, s.view]);
  const tray = v ? slotTray(v) : [];
  return (
    <section className="tl-section slots" id="slots" aria-labelledby="slots-h">
      <h3 id="slots-h" className="tl-h">
        {W.title}
      </h3>
      {!v ? (
        <p className="tl-quiet">{W.none}</p>
      ) : (
        <>
          <p className="tl-intro">{W.intro}</p>
          {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must take keyboard focus (TR-13). */}
          <section className="sg-frame" tabIndex={0} aria-label={W.scrollLabel}>
            <table className="sg">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">{W.character}</span>
                  </th>
                  {v.columns.map((col) => (
                    <th key={col.kind} scope="col">
                      <PixelArt name={SLOT_ART[col.kind]} decorative animate={false} />
                      <span>{col.heading}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {v.rows.map((r) => (
                  <tr key={r.index}>
                    <th scope="row">
                      <WhoGlyph
                        family={familyOf(s, r.index)}
                        classLabel={r.classLabel}
                        scale={1}
                        decorative
                      />
                      <span>
                        {r.classLabel} {r.level}
                      </span>
                    </th>
                    {v.columns.map((col) => {
                      const c = r.cells.find((x) => x.kind === col.kind);
                      return c ? (
                        <SlotCell key={col.kind} c={c} heading={col.heading} />
                      ) : (
                        <td key={col.kind} className="sg-c" />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{W.footer}</th>
                  {v.columns.map((col) => (
                    <td key={col.kind}>
                      <span className="sg-k" aria-hidden="true">
                        {col.heading}
                      </span>
                      <span className="num">{col.count}</span>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </section>
          {v.now ? (
            <div className="tl-next">
              <span className="tl-now-badge">{W.nowBadge}</span>
              <span className="tl-next-a">{v.now.text}</span>
              <span className="tl-next-tok">
                <span className="tl-who">
                  <WhoGlyph family={familyOf(s, v.now.index)} classLabel={v.now.who} scale={1} decorative />
                  {v.now.who}
                </span>
              </span>
            </div>
          ) : null}
          <ul className="sg-legend" aria-label={BOARD_WORDS.legend}>
            <li>
              <span className="sg-key is-filled" aria-hidden="true" /> {W.legendInUse}
            </li>
            <li>
              <span className="sg-key is-empty" aria-hidden="true" /> {W.legendEmpty}
            </li>
            <li>
              <span className="sg-key is-full" aria-hidden="true" /> {W.legendFull}
            </li>
            <li>
              <span className="sg-key is-closed" aria-hidden="true" /> {W.legendClosed}
            </li>
          </ul>
          <h4 className="tl-sub-h">{W.trayTitle}</h4>
          {tray.length ? (
            <ol className="sg-trays">
              {tray.map((t) => (
                <li key={t.kind} className={cx('sg-tray', t.now && 'is-now')}>
                  <p className="sg-tray-h">
                    <PixelArt name={SLOT_ART[t.kind]} decorative animate={false} />
                    <b>{t.heading}</b>
                    <span className="sg-tray-c">{t.count}</span>
                  </p>
                  <p className="sg-chips">
                    {t.who.map((w) => (
                      <span key={w.index} className={cx('sg-chip', `is-${w.tone}`)}>
                        <WhoGlyph
                          family={familyOf(s, w.index)}
                          classLabel={w.classLabel}
                          scale={1}
                          decorative
                        />
                        <span>
                          {w.classLabel} {w.level}
                        </span>
                        <span className="sr-only">
                          : {w.tone === 'empty' ? SLOTS_WORDS.states.fillable : SLOTS_WORDS.states.capped}
                        </span>
                      </span>
                    ))}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="tl-quiet">{W.trayNone}</p>
          )}
        </>
      )}
    </section>
  );
}
