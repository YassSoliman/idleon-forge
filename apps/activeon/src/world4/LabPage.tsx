// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the Laboratory page body (board `after/sys/Laboratory`), a read-only view of the save:
// the framed answer, then four tabs. Board: the Mainframe drawn from the game's own coordinates (prism,
// bonus nodes, jewel spots, uploaded characters, the beam and each lit character's reach), the bonuses
// in reach order and who is in the Lab. Chips: the Repository and the slots per character. Jewels: the
// Spinner and the jewels owned. Weekly shop: the save week's two chips and a jewel. M25: the game's own
// sprites for classes, bonuses, chips and jewels (ADR 0009 as amended 2026-10-19), our kit as fallback.
import type { LabBoard, LabPageView } from '@idleon-forge/engine/world4';
import { useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { chipArt, jewelArt, jewelArtOfName, keyIndex, labBonusArt } from '../art/game/w4-art';
import { cx, Meter, Tabs } from '../design/atoms';
import type { Session } from '../shell/session';
import { ClassArt, Frame, Rows, SourceLine, Tag, toneClass } from './parts';

function Board({ b }: { b: LabBoard }) {
  const grid: number[] = [];
  for (let x = 0; x <= b.width; x += 80) grid.push(x);
  const rows: number[] = [];
  for (let y = Math.ceil(b.top / 80) * 80; y <= b.top + b.height; y += 80) rows.push(y);
  return (
    <svg
      className="w4-board"
      role="img"
      aria-label={b.accessibleName}
      viewBox={`${b.left} ${b.top} ${b.width} ${b.height}`}
      preserveAspectRatio="xMinYMin meet"
    >
      <rect className="w4-board__bg" x={b.left} y={b.top} width={b.width} height={b.height} />
      {grid.map((x) => (
        <rect key={`gx${x}`} className="w4-board__grid" x={x} y={b.top} width={1} height={b.height} />
      ))}
      {rows.map((y) => (
        <rect key={`gy${y}`} className="w4-board__grid" x={b.left} y={y} width={b.width} height={1} />
      ))}
      {b.jewels.map((j) => (
        <rect
          key={j.key}
          className={cx('w4-board__jewel', j.owned && 'is-owned', j.lit && 'is-lit')}
          x={j.x - 6}
          y={j.y - 6}
          width={12}
          height={12}
          transform={`rotate(45 ${j.x} ${j.y})`}
        />
      ))}
      {b.links.map((l) => (
        <circle key={`r${l.x2}-${l.y2}`} className="w4-board__reach" cx={l.x2} cy={l.y2} r={b.reach} />
      ))}
      {b.links.map((l) => (
        <line key={`l${l.x2}-${l.y2}`} className="w4-board__beam" x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
      {b.nodes.map((n) => (
        <g key={n.key} className={cx('w4-board__node', `is-${n.state}`)}>
          <title>{n.label}</title>
          <rect x={n.x - 12} y={n.y - 12} width={24} height={24} />
          {/* QA P2: a label is 12 px or more on screen, so only the lit and next bonuses carry one; the
              rest are named in "Bonuses in reach order" and on hover. */}
          {n.state === 'lit' || n.state === 'next' ? (
            <text x={n.x} y={n.y + 44} textAnchor="middle">
              {n.label}
            </text>
          ) : null}
        </g>
      ))}
      <g className="w4-board__prism">
        <rect
          x={b.prism.x - 14}
          y={b.prism.y - 14}
          width={28}
          height={28}
          transform={`rotate(45 ${b.prism.x} ${b.prism.y})`}
        />
        <text x={b.prism.x} y={b.prism.y - 30} textAnchor="middle">
          Prism
        </text>
      </g>
      {b.characters.map((c) => (
        <g
          key={c.key}
          className={cx('w4-board__char', c.connected && 'is-on')}
          transform={`translate(${c.x - 16} ${c.y - 16})`}
        >
          <title>{c.label}</title>
          <rect className="w4-board__char-bg" x={-2} y={-2} width={36} height={36} />
          {/* An HTML <img> inside SVG needs a foreignObject. */}
          <foreignObject x={0} y={0} width={32} height={32}>
            <ClassArt cls={c.cls} size={32} />
          </foreignObject>
        </g>
      ))}
    </svg>
  );
}

type LabTab = 'board' | 'chips' | 'jewels' | 'shop';
/** The Repository's picture: the first chip the game lists. */
const CHIP_ICON = 'Grounded_Nanochip';

export function LabBody({ s, v, framed = true }: { s: Session; v: LabPageView; framed?: boolean }) {
  const [tab, setTab] = useState<LabTab>('board');
  return (
    <div className="w4-page">
      {framed ? <Frame f={v.frame} s={s} /> : null}
      <Tabs<LabTab>
        label="Laboratory sections"
        value={tab}
        idBase="w4-lab"
        onChange={setTab}
        tabs={v.tabs.map((t) => ({
          value: t.id as LabTab,
          label: t.label,
          badge: t.badge ? <Tag>{t.badge}</Tag> : undefined,
        }))}
      />
      <div
        id={`w4-lab-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`w4-lab-tab-${tab}`}
        className="w4-panel"
      >
        {tab === 'board' ? (
          <>
            <section className="w4-sec" aria-labelledby="w4-board-h">
              <header className="w4-sec__head">
                <h3 id="w4-board-h" className="sy-h3">
                  Your board
                </h3>
                <span className="w4-muted w4-small">{v.board.summary}</span>
              </header>
              <div className="a-tile w4-board-wrap">
                <Board b={v.board} />
              </div>
              <ul className="w4-legend w4-small w4-muted" aria-label="Board key">
                <li>
                  <span className="w4-key w4-key--beam" aria-hidden="true" />
                  beam: connected
                </li>
                <li>
                  <span className="w4-key w4-key--reach" aria-hidden="true" />
                  each lit character reaches 80 px
                </li>
                <li>
                  <span className="w4-key w4-key--lit" aria-hidden="true" />
                  bonus lit
                </li>
                <li>
                  <span className="w4-key w4-key--next" aria-hidden="true" />
                  next to light
                </li>
                <li>
                  <span className="w4-key w4-key--off" aria-hidden="true" />
                  not reached
                </li>
                <li>
                  <span className="w4-key w4-key--jewel" aria-hidden="true" />
                  jewel spot
                </li>
              </ul>
            </section>
            <div className="w4-split">
              <section className="w4-sec" aria-labelledby="w4-nodes-h">
                <header className="w4-sec__head">
                  <h3 id="w4-nodes-h" className="sy-h3">
                    Bonuses in reach order
                  </h3>
                  <span className="w4-muted w4-small">distance from the prism</span>
                </header>
                <Rows
                  rows={v.nodes}
                  label="Mainframe bonuses, nearest first"
                  art={{
                    of: (r) => labBonusArt(keyIndex(r.key)),
                    fallback: 'item-chip',
                    dim: (r) => !!r.quiet,
                  }}
                />
                <p className="w4-small w4-muted">{v.boardNote}</p>
              </section>
              <aside className="w4-sec" aria-labelledby="w4-who-h">
                <h3 id="w4-who-h" className="w4-cap">
                  Who is in the Lab
                </h3>
                <p className="w4-small w4-muted">{v.charactersLede}</p>
                <ul className="w4-rows">
                  {v.characters.map((c) => (
                    <li key={c.key} className="w4-row">
                      <ClassArt cls={c.cls} />
                      <span className="w4-row__main">
                        <span className="w4-strong w4-small">{c.label}</span>
                        <span className="w4-muted w4-xs">{c.note}</span>
                      </span>
                      <span className="w4-row__end">
                        <span className="w4-strong w4-xs">{c.labLevel}</span>
                        <span className={cx('w4-xs', toneClass(c.tone))}>{c.now}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </>
        ) : null}
        {tab === 'chips' ? (
          <section className="w4-sec" aria-labelledby="w4-chips-h">
            <header className="w4-sec__head">
              <h3 id="w4-chips-h" className="sy-h3">
                Chips
              </h3>
              <span className="w4-muted w4-small">bought with meals and spices, never dropped</span>
            </header>
            <div className="w4-cards">
              {v.openers.map((o) => (
                <div key={o.key} className="a-tile w4-card">
                  <div className="w4-card__head">
                    <GameIcon
                      art={o.key === 'repo' ? chipArt(CHIP_ICON) : jewelArt(0)}
                      fallback={o.key === 'repo' ? 'item-chip' : 'item-jewel'}
                      size={32}
                      decorative
                    />
                    <span className="w4-strong">{o.title}</span>
                    <Tag tone={o.open ? 'mint' : 'muted'}>{o.badge}</Tag>
                  </div>
                  <p className="w4-small w4-muted">{o.text}</p>
                  {o.need !== null ? (
                    <>
                      <span className="num">
                        <span className="w4-big">{o.have ?? 0}</span>{' '}
                        <span className="w4-muted w4-small">of {o.need} held</span>
                      </span>
                      <Meter value={o.have ?? 0} max={o.need} label={`${o.have ?? 0} of ${o.need} held`} />
                    </>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="a-tile">
              <table className="w4-slots">
                <caption className="w4-small w4-muted">
                  Chip slots per character; the numbers are the Lab level each slot opens at
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="w4-cap">
                      Character
                    </th>
                    {v.slotLevels.map((l) => (
                      <th key={l} scope="col" className="w4-xs w4-muted num">
                        Lab {l}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {v.chipsBySlot.map((c) => (
                    <tr key={c.key}>
                      <th scope="row" className="w4-small">
                        <span className="w4-who">
                          <ClassArt cls={c.cls} size={24} />
                          {c.label}
                        </span>
                      </th>
                      {c.slots.map((x, i) => (
                        <td
                          // biome-ignore lint/suspicious/noArrayIndexKey: slots are positional
                          key={i}
                          className={cx('w4-slot', x ? 'is-full' : i < c.open ? 'is-open' : 'is-locked')}
                        >
                          <span className="w4-slot__in">
                            {x ? (
                              <GameIcon art={chipArt(x)} fallback="item-chip" size={16} decorative />
                            ) : null}
                            <span className="w4-xs">{x ?? (i < c.open ? 'empty' : 'locked')}</span>
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
        {tab === 'jewels' ? (
          <section className="w4-sec" aria-labelledby="w4-jewels-h">
            <header className="w4-sec__head">
              <h3 id="w4-jewels-h" className="sy-h3">
                Jewels
              </h3>
              <span className="w4-muted w4-small">{v.jewelsLine}</span>
            </header>
            {v.jewels.length > 0 ? (
              <Rows
                rows={v.jewels}
                label="Jewels owned"
                numbered={false}
                art={{ of: (r) => jewelArt(keyIndex(r.key)), fallback: 'item-jewel' }}
              />
            ) : (
              <p className="w4-small w4-muted">{v.openers[1]?.text}</p>
            )}
            <p className="w4-small w4-muted">
              A jewel works only while a connected character reaches its spot on the board.
            </p>
          </section>
        ) : null}
        {tab === 'shop' ? (
          <section className="w4-sec" aria-labelledby="w4-shop-h">
            <header className="w4-sec__head">
              <h3 id="w4-shop-h" className="sy-h3">
                Weekly shop
              </h3>
              <span className="w4-muted w4-small">{v.shop?.week ?? ''}</span>
            </header>
            {v.shop ? (
              <>
                <ul className="w4-rows" aria-label="This week's chips and jewel">
                  {v.shop.rows.map((r) => (
                    <li key={r.key} className="w4-row">
                      <GameIcon
                        art={r.detail === 'jewel' ? jewelArtOfName(r.name) : chipArt(r.name)}
                        fallback={r.detail === 'jewel' ? 'item-jewel' : 'item-chip'}
                        size={32}
                        decorative
                      />
                      <span className="w4-row__main">
                        <span className="w4-strong">
                          {r.name} <span className="w4-muted w4-xs">{r.detail}</span>
                        </span>
                        <span className="w4-muted w4-small">{r.extra}</span>
                      </span>
                      <span className={cx('w4-row__status w4-small', toneClass(r.tone))}>{r.status}</span>
                    </li>
                  ))}
                </ul>
                <p className="w4-small w4-muted">{v.shop.note}</p>
              </>
            ) : (
              <p className="w4-small w4-muted">The shop couldn't be read from this save.</p>
            )}
          </section>
        ) : null}
      </div>
      <SourceLine sources={[v.source]} />
    </div>
  );
}
