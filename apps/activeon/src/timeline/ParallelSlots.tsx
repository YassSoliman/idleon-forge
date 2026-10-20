// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Parallel slots tab (`#slots`), M24's `TimelineSlots` board over M21 FR-T3: the one move first in its
// frame (the fill-order Goal's own step, who, why, and the link to it), then the grid of characters by the
// five slots (a filled cell earns, an amber one is full, a gold-edged one is empty: free value, a grey one
// is not open yet; the NOW cell carries the tag), and beside it what else is worth a minute (the
// Unassigned tray: empty and full slots, characters said once) and what is not open yet. It renders
// `buildSlotsView` (built here, in the lazy chunk, TR-12) and computes nothing else.
import { buildSlotsView, SLOTS_WORDS } from '@idleon-forge/engine/now';
import type { SlotKind } from '@idleon-forge/engine/result';
import { useMemo } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { bubbleArt } from '../art/game/game-art';
import { KitSprite } from '../art/game/KitSprite';
import { Sprite } from '../art/sprites/Sprite';
import { PixelArt } from '../design/art/PixelArt';
import { cx, Frame } from '../design/atoms';
import { type ClassFamily, WhoGlyph } from '../design/who/WhoGlyph';
import { PageSources } from '../shell/page-sources';
import type { Session } from '../shell/session';
import { linkFix } from './ChecklistRow';
import { slotTray } from './slots-tray';
import { BOARD_WORDS, SLOTS_UI_WORDS as W } from './words';

type Grid = NonNullable<ReturnType<typeof buildSlotsView>>;
type Cell = Grid['rows'][number]['cells'][number];

const familyOf = (s: Session, index: number): ClassFamily => s.view.families?.[index] ?? 'beginner';

/** Each slot kind's System sprite name: KitSprite draws the System's game sprite, our kit as fallback. */
const SLOT_SYSTEM: Record<SlotKind, string> = {
  cauldron: 'alchemy',
  trap: 'trapping',
  worship: 'worship',
  cog: 'construction',
  printer: 'printer',
};
export const slotSprite = (kind: SlotKind) => `sys-${SLOT_SYSTEM[kind]}`;
/**
 * A brewing cell's cauldron, by the colour M20's words name ("brews (Power)"): the game draws every
 * cauldron alike, so the cauldron's own colour of bubble stands for it (Power orange, Quicc green, High-IQ
 * purple, Kazam yellow), with our coloured cauldron as the fallback.
 */
const CAULDRON: Record<string, { fallback: string; bubble: string }> = {
  power: { fallback: 'cauldron-power', bubble: 'aUpgradesO0' },
  quicc: { fallback: 'cauldron-quicc', bubble: 'aUpgradesG0' },
  'high-iq': { fallback: 'cauldron-high-iq', bubble: 'aUpgradesP0' },
  kazam: { fallback: 'cauldron-kazam', bubble: 'aUpgradesY0' },
};
const cauldronOf = (text: string): { fallback: string; bubble: string } | null => {
  const m = /\(([^)]+)\)/.exec(text)?.[1]?.toLowerCase().replace(/\s+/g, '-');
  return m ? (CAULDRON[m] ?? null) : null;
};

/** The board's four looks, from M20's pip state: earning, full, empty (free value), not open yet. */
type Look = 'earn' | 'full' | 'free' | 'shut';
const lookOf = (c: Cell): Look =>
  c.state === 'filled' ? 'earn' : c.state === 'capped' ? 'full' : c.state === 'fillable' ? 'free' : 'shut';

/** The grid's tab badge: the slot kinds with an empty or a full slot to see to. */
export function slotsBadge(s: Session): number | null {
  const v = buildSlotsView(s.result, s.view);
  return v ? v.columns.filter((c) => c.free > 0 || c.full > 0).length : null;
}

function SlotCell({ c, heading }: { c: Cell; heading: string }) {
  const look = lookOf(c);
  const brew = c.kind === 'cauldron' && look === 'earn' ? cauldronOf(c.text) : null;
  return (
    <td className={cx('sg-c', `is-${look}`, c.now && 'is-now')} title={`${heading}: ${c.text}`}>
      <span className="sg-in">
        {/* On a phone the grid wraps, so each cell names its own column (hidden from assistive tech,
            which reads the column header). */}
        <span className="sg-k" aria-hidden="true">
          {heading}
        </span>
        <span className="sg-w">
          {look === 'shut' ? (
            <span className="sg-g">
              <Sprite name="status-lock" size={16} decorative />
            </span>
          ) : look === 'earn' ? (
            <span className="sg-g">
              {brew ? (
                <GameIcon art={bubbleArt(brew.bubble)} fallback={brew.fallback} size={16} decorative />
              ) : (
                <Sprite name="status-check" size={16} decorative />
              )}
            </span>
          ) : null}
          <span>{c.stateWord}</span>
        </span>
        <span className="sg-t">{c.text}</span>
        {c.now ? <span className="sg-nowtag">{W.nowBadge}</span> : null}
      </span>
    </td>
  );
}

/** The one move (M20 FR-29's fill order): the step, who, why, and the link to the Goal. */
function Hero({ v, s }: { v: Grid; s: Session }) {
  const now = v.now;
  if (!now) return null;
  const goal = s.result.account.goals.find((g) => g.nextAction.key === now.key);
  return (
    <Frame tone="gold" className="sg-hero" aria-label={W.heroCap}>
      <span className="sg-hero-ic" aria-hidden="true">
        <KitSprite name={slotSprite(now.kind)} size={48} />
      </span>
      <span className="sg-hero-b">
        <span className="a-cap tl-now-badge">{W.heroCap}</span>
        <span className="sg-hero-a">{now.text}</span>
        <span className="tl-next-tok">
          <span className="tl-who">
            <WhoGlyph family={familyOf(s, now.index)} classLabel={now.who} scale={1} decorative />
            {now.who}
          </span>
        </span>
        {goal?.nextAction.why ? <span className="sg-hero-why">{goal.nextAction.why}</span> : null}
      </span>
      <a
        className="tl-link tl-next-go"
        href={`#na-${encodeURIComponent(now.key)}`}
        onClick={(e) => {
          e.preventDefault();
          s.toFix(linkFix({ kind: 'goal', key: now.key }, false));
        }}
      >
        {W.showWhere}
        <PixelArt name="ui-arrow-right" decorative />
      </a>
    </Frame>
  );
}

/** "Also worth a minute": the Unassigned tray (empty and full slots, characters said once). */
function Also({ v, s }: { v: Grid; s: Session }) {
  const tray = slotTray(v).filter((t) => !t.now || t.who.length > 1);
  if (!tray.length) return null;
  return (
    <section className="sg-side" aria-labelledby="sg-also-h">
      <h3 id="sg-also-h" className="a-cap">
        {W.alsoTitle}
      </h3>
      <ul className="sg-also">
        {tray.map((t) => (
          <li key={t.kind}>
            <KitSprite name={slotSprite(t.kind)} size={24} />
            <span className="sg-also-b">
              <b>{W.alsoLine(t.heading, t.count)}</b>
              <span className="sg-chips">
                {t.who.map((w) => (
                  <span key={w.index} className={cx('sg-chip', `is-${w.tone}`)}>
                    <WhoGlyph family={familyOf(s, w.index)} classLabel={w.classLabel} scale={1} decorative />
                    <span>
                      {w.classLabel} {w.level}
                    </span>
                    <span className="sr-only">
                      : {w.tone === 'empty' ? SLOTS_WORDS.states.fillable : SLOTS_WORDS.states.capped}
                    </span>
                  </span>
                ))}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Not open yet": the slot kinds with closed cells, and M20's own words for why. */
function Closed({ v }: { v: Grid }) {
  const lines = v.columns.flatMap((col) => {
    const cells = v.rows.flatMap((r) => r.cells.filter((c) => c.kind === col.kind));
    const shut = cells.filter((c) => lookOf(c) === 'shut');
    if (!shut.length) return [];
    const why = [...new Set(shut.map((c) => c.text))].join(' · ');
    return [
      {
        kind: col.kind,
        title:
          shut.length === cells.length
            ? W.closedAll(col.heading, cells.length)
            : W.closedSome(col.heading, shut.length, cells.length),
        why,
      },
    ];
  });
  if (!lines.length) return null;
  return (
    <section className="sg-side" aria-labelledby="sg-closed-h">
      <h3 id="sg-closed-h" className="a-cap">
        {W.closedTitle}
      </h3>
      <ul className="sg-closed">
        {lines.map((l) => (
          <li key={l.kind} className="a-tile2">
            <b>{l.title}</b>
            <span className="sg-closed-w">{l.why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ParallelSlots({ s }: { s: Session }) {
  // Built here, in the lazy Timeline chunk, so the builder stays out of the first load (TR-12).
  const v = useMemo(() => buildSlotsView(s.result, s.view), [s.result, s.view]);
  return (
    <section className="tl-section slots" id="slots" aria-labelledby="slots-h">
      <h3 id="slots-h" className="sr-only">
        {W.title}
      </h3>
      <PageSources>{W.sources}</PageSources>
      {!v ? (
        <p className="tl-quiet">{W.none}</p>
      ) : (
        <>
          <Hero v={v} s={s} />
          <div className="sg-cols">
            <div className="sg-main">
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
                          <KitSprite name={slotSprite(col.kind)} size={32} />
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
                          <span className={cx('num', (col.free > 0 || col.full > 0) && 'is-gold')}>
                            {col.count}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </section>
              <ul className="sg-legend" aria-label={BOARD_WORDS.legend}>
                <li>
                  <span className="sg-key is-earn" aria-hidden="true" /> {W.legendEarning}
                </li>
                <li>
                  <span className="sg-key is-full" aria-hidden="true" /> {W.legendFull}
                </li>
                <li>
                  <span className="sg-key is-free" aria-hidden="true" /> {W.legendEmpty}
                </li>
                <li>
                  <span className="sg-key is-shut" aria-hidden="true" /> {W.legendClosed}
                </li>
              </ul>
            </div>
            <aside className="sg-aside">
              <Also v={v} s={s} />
              <Closed v={v} />
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
