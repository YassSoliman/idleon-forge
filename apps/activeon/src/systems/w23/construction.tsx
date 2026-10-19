// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 Construction (canvas board after/sys/Construction): the Cog Board with its rates and who sits
// where, the build slots, and every building. M20's cog-board picture and M24's build-slots picture
// (pictures/w23.ts); no advice of its own.
import type { BuildingView } from '@idleon-forge/engine/systems-ui';
import { PixelArt } from '../../design/art/PixelArt';
import { cx } from '../../design/atoms';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import type { SystemPageBodyProps } from '../pages';
import '../slot-pictures.css';
import {
  Bar,
  Big,
  Cap,
  litKeyOf,
  n0,
  type PageAnswer,
  type PageSections,
  pictureOf,
  Split,
  stepOf,
  Tag,
  Who,
  whoLabel,
} from './kit';

export const CONSTRUCTION_WORDS = {
  board: 'Cog Board',
  slots: 'Build slots',
  buildings: 'Buildings',
  buildRate: 'Build rate',
  exp: 'Construction EXP',
  anHour: 'an hour',
  onBoard: 'On the board',
  onShelf: 'On the Cog Shelf · makes cogs',
  inInventory: 'In the cog inventory · earns nothing',
  nobody: 'nobody',
  buildingNow: 'Building now',
  legend: { character: 'character', cog: 'cog', open: 'free square', locked: 'locked', now: 'seat here' },
  best: (who: string, lv: number) => `Best constructor: ${who}, Construction ${lv}.`,
  nextTier: (name: string, at: number) => `${name} open at Construction ${at}.`,
  emptySlot: 'Empty slot',
  lv: (from: number, to: number) => `Lv ${from} → ${to}`,
  max: (lv: number) => `Lv ${lv} · max`,
  paidIn: (salt: string) => `paid in ${salt}`,
  levelBuilt: 'level built: pay its salts in the Build menu to finish',
  of: (lv: number, max: number) => `Lv ${lv} of ${max}`,
  notBuilt: 'not built',
  freeSquares: 'free squares',
  usedOf: (used: number, open: number) => `${used} of ${open} open squares used`,
  boardAria: (open: number, free: number, seated: number) =>
    `Cog Board: ${open} squares open, ${free} free, ${seated} characters seated`,
} as const;
const W = CONSTRUCTION_WORDS;

function Board({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'cog-board');
  const slots = pictureOf(p, 'build-slots');
  if (!pic) return null;
  const open = pic.squares.filter((s) => s.state !== 'locked').length;
  const free = pic.squares.filter((s) => s.state === 'open').length;
  const lit = litKeyOf(
    p,
    [...pic.squares, ...pic.shelf, ...pic.inventory].map((x) => x.actionKey),
  );
  let litDone = false;
  const isLit = (k: string | null) => {
    if (litDone || k === null || k !== lit) return false;
    litDone = true;
    return true;
  };
  const seated = pic.squares.filter((s) => s.characterIndex !== undefined);
  return (
    <Split
      main={
        <section className="w-stack sy-cog" aria-label={W.board}>
          <div
            className="sy-cog__board w23-board"
            role="img"
            aria-label={W.boardAria(open, free, seated.length)}
          >
            {pic.squares.map((s) => {
              const on = isLit(s.actionKey);
              const family =
                s.characterIndex !== undefined ? p.s.result.classFamilies?.[s.characterIndex] : undefined;
              return (
                <span key={s.id} className={cx('sy-sq', `sy-sq--${s.state}`, on && 'is-now')}>
                  {family && s.characterIndex !== undefined ? (
                    <WhoGlyph
                      family={family}
                      classLabel={whoLabel(p, s.characterIndex)}
                      scale={1}
                      decorative
                    />
                  ) : on ? (
                    <PixelArt name="v2-systems-st-now" decorative />
                  ) : null}
                </span>
              );
            })}
          </div>
          <ul className="sy-legend" aria-hidden="true">
            {(['character', 'cog', 'open', 'locked'] as const).map((k) => (
              <li key={k}>
                <span className={`sy-sq sy-sq--${k}`} /> {W.legend[k]}
              </li>
            ))}
          </ul>
        </section>
      }
      aside={
        <>
          <div className="w-row w23-rates">
            <div className="w-stack w-stack--4">
              <Cap>{W.buildRate}</Cap>
              <Big value={n0(pic.buildRate)} />
              <span className="w-xs w-mut">{W.anHour}</span>
            </div>
            <div className="w-stack w-stack--4">
              <Cap>{W.exp}</Cap>
              <Big value={n0(pic.expRate)} />
              <span className="w-xs w-mut">{W.anHour}</span>
            </div>
          </div>
          <div className="w-stack w-stack--8">
            <Cap>{W.onBoard}</Cap>
            <div className="w-who-list w-sm">
              {seated.length
                ? seated.map((s) => <Who key={s.id} p={p} index={s.characterIndex as number} />)
                : W.nobody}
            </div>
          </div>
          <div className="w-stack w-stack--8">
            <Cap>{W.onShelf}</Cap>
            <div className="w-who-list w-sm">
              {pic.shelf.length ? pic.shelf.map((x) => <Who key={x.id} p={p} index={x.index} />) : W.nobody}
            </div>
          </div>
          {pic.inventory.length ? (
            <div className="w-stack w-stack--8">
              <Cap>{W.inInventory}</Cap>
              <div className="w-who-list w-sm">
                {pic.inventory.map((x) => (
                  <Who key={x.id} p={p} index={x.index} />
                ))}
              </div>
            </div>
          ) : null}
          {slots?.slots.some(Boolean) ? (
            <div className="a-tile2 w-tile2">
              <Cap>{W.buildingNow}</Cap>
              {slots.slots.map((b, i) =>
                b ? (
                  // biome-ignore lint/suspicious/noArrayIndexKey: build slots are positional
                  <span key={i} className="w-row w-row--between w-sm">
                    <span>{b.name}</span>
                    <span className="w-mut2">{W.lv(b.level, b.level + 1)}</span>
                  </span>
                ) : null,
              )}
            </div>
          ) : null}
          {pic.bestConstructor ? (
            <span className="w-xs w-mut2">
              {W.best(whoLabel(p, pic.bestConstructor.index), pic.bestConstructor.level)}
              {pic.bestConstructor.nextTier
                ? ` ${W.nextTier(pic.bestConstructor.nextTier.name, pic.bestConstructor.nextTier.atLevel)}`
                : ''}
            </span>
          ) : null}
          {pic.note ? <span className="w-xs w-mut2">{pic.note}</span> : null}
        </>
      }
    />
  );
}

function BuildingTile({ b }: { b: BuildingView }) {
  const maxed = b.level >= b.maxLevel && b.maxLevel > 0;
  return (
    <div className={`a-tile w-tile${b.bodyFull ? ' is-now' : ''}`}>
      <div className="w-row w-row--between">
        <span className="w-b">{b.name}</span>
        <span className="w-sm w-mut2">{maxed ? W.max(b.level) : W.lv(b.level, b.level + 1)}</span>
      </div>
      {!maxed ? (
        <Bar
          value={b.progress}
          max={b.buildCost}
          tone={b.bodyFull ? 'gold' : 'sky'}
          label={`${b.name} build progress`}
        />
      ) : null}
      <span className="w-xs w-mut">
        {[b.bodyFull && !maxed ? W.levelBuilt : null, b.salt ? W.paidIn(b.salt) : null]
          .filter(Boolean)
          .join(' · ')}
      </span>
    </div>
  );
}

function Slots({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'build-slots');
  if (!pic) return null;
  return (
    <ul className="w-grid w-plain">
      {pic.slots.map((b, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: build slots are positional
        <li key={i}>
          {b ? (
            <BuildingTile b={b} />
          ) : (
            <div className="a-tile w-tile is-later">
              <span className="w-mut">{W.emptySlot}</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function Buildings({ p }: { p: SystemPageBodyProps }) {
  const pic = pictureOf(p, 'build-slots');
  if (!pic) return null;
  return (
    <section className="w-stack" aria-label={W.buildings}>
      <ul className="w-hair w-plain">
        {pic.buildings.map((b) => (
          <li key={b.index} className="w-li">
            <span className="w-grow">
              <span className={b.level > 0 ? 'w-b' : 'w-mut'}>{b.name}</span>
              {b.salt ? <span className="w-xs w-mut"> · {W.paidIn(b.salt)}</span> : null}
            </span>
            {b.level > 0 ? (
              <span className="w-sm w-mut2">{W.of(b.level, b.maxLevel)}</span>
            ) : (
              <Tag>{W.notBuilt}</Tag>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The answer's big number when the step is about the Cog Board: the free squares. */
function answerOf(p: SystemPageBodyProps): PageAnswer | null {
  const pic = pictureOf(p, 'cog-board');
  const step = stepOf(p);
  if (!pic || !step) return null;
  const keys = new Set([...pic.squares, ...pic.shelf, ...pic.inventory].map((x) => x.actionKey));
  if (!keys.has(step.key)) return null;
  const open = pic.squares.filter((s) => s.state !== 'locked').length;
  const free = pic.squares.filter((s) => s.state === 'open').length;
  return {
    tone: 'gold',
    cap: 'Do this next',
    hero: step.text,
    sub: step.who?.label ?? null,
    big: {
      value: String(free),
      unit: W.freeSquares,
      meter: open ? (open - free) / open : null,
      note: W.usedOf(open - free, open),
    },
  };
}

export function constructionSections(p: SystemPageBodyProps): PageSections | null {
  const board = pictureOf(p, 'cog-board');
  const slots = pictureOf(p, 'build-slots');
  if (!board && !slots) return null;
  return {
    answer: answerOf(p),
    tabs: [
      ...(board ? [{ id: 'board', label: W.board, render: () => <Board p={p} /> }] : []),
      ...(slots
        ? [
            {
              id: 'slots',
              label: W.slots,
              badge: slots.slots.length,
              render: () => <Slots p={p} />,
            },
            { id: 'buildings', label: W.buildings, render: () => <Buildings p={p} /> },
          ]
        : []),
    ],
  };
}
