// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-26 the Task Board, the Merit Shop and Task Unlocks (Wave 2): one page, three tabs; each of the
// three Systems opens on its own. Data is the engine's task-board picture (pictures/gaps.ts); the Next
// Actions are the three Systems' Checks. Game sprites: the tasks star and each world's merit token.
import type { TaskWorldView } from '@idleon-forge/engine/systems-ui';
import { GameIcon } from '../../art/game/GameIcon';
import { etcArt } from '../../art/game/game-art';
import type { SystemPageBodyProps } from '../pages';
import {
  Bar,
  Big,
  Cap,
  Head,
  n0,
  type PageAnswer,
  type PageSections,
  pictureOf,
  Split,
  Tag,
} from '../w23/kit';
import './gaps.css';

export const TASK_WORDS = {
  pageTitle: 'Task Board',
  tasks: 'Tasks',
  merits: 'Merit Shop',
  unlocks: 'Unlocks',
  world: (w: number) => `World ${w}`,
  closed: 'not open yet',
  claim: (n: number) => `claim ${n}`,
  resets: 'resets on claim',
  next: (stat: string, need: string) => `${stat} of ${need}`,
  done: 'done',
  daily: (name: string) => `Daily: ${name}`,
  dailyDone: 'done today',
  dailyTodo: 'to do',
  tiers: (lv: number, max: number) => `tier ${lv} / ${max}`,
  unspent: 'merits to spend',
  rowLevel: (lv: number, max: number) => `${lv} / ${max}`,
  cost: (n: number) => `${n} each`,
  noShop: 'Opens with the board.',
  ptsOwned: 'Unlock points',
  ptsUnspent: (n: number) => `${n} to spend`,
  toNext: 'Task points to the next unlock point',
  openRows: (n: number) => `${n} rows to buy in the open columns`,
  unlocksNote:
    'Task points from every claimed tier add up to unlock points; each buys one row in the Unlocks tab.',
  where: 'Where you are',
  nothingReady: 'No task tier waiting to be claimed',
  meritsSub: (n: number) => `${n} merits unspent across the shops`,
} as const;
const W = TASK_WORDS;

/** 1234567 -> "1.23M" (no locale surprises). */
const short = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e12) return `${Number((n / 1e12).toPrecision(3))}T`;
  if (a >= 1e9) return `${Number((n / 1e9).toPrecision(3))}B`;
  if (a >= 1e6) return `${Number((n / 1e6).toPrecision(3))}M`;
  if (a >= 1e4) return `${Number((n / 1e3).toPrecision(3))}K`;
  return n0(n);
};

const Token = ({ world, size = 24 }: { world: number; size?: 16 | 24 | 32 }) => (
  <GameIcon art={etcArt(`Merit_${world - 1}`)} fallback="sys-merit-shop" size={size} decorative />
);

function Board({ w }: { w: TaskWorldView }) {
  const tasks = [...w.tasks].sort((a, b) => b.ready - a.ready || a.index - b.index);
  return (
    <section className={`a-tile w-tile w-stack${w.open ? '' : ' is-later'}`} aria-label={W.world(w.world)}>
      <div className="w-row w-row--between">
        <span className="w-row">
          <GameIcon art={etcArt('TasksStar')} fallback="sys-task-board" size={24} decorative />
          <span className="a-h2">{W.world(w.world)}</span>
        </span>
        {w.ready ? <Tag tone="gold">{W.claim(w.ready)}</Tag> : w.open ? null : <Tag>{W.closed}</Tag>}
      </div>
      {w.open ? (
        <ul className="w-hair w-plain">
          {tasks.map((t) => {
            const max = t.level >= t.maxLevel;
            return (
              <li key={t.index} className="w-li gp-task">
                <span className="w-stack w-stack--4 w-grow">
                  <span className="w-row w-sm">
                    <span className={t.ready ? 'w-b w-t--gold' : 'w-b'}>{t.name}</span>
                    {t.ready && t.resetsOnClaim ? <span className="w-xs w-t--coral">{W.resets}</span> : null}
                  </span>
                  <Bar
                    value={t.level}
                    max={Math.max(1, t.maxLevel)}
                    tone={max ? 'mint' : 'gold'}
                    label={`${t.name} ${W.tiers(t.level, t.maxLevel)}`}
                  />
                </span>
                <span className="w-stack w-stack--4 gp-task__n">
                  <span className="w-xs w-b">{W.tiers(t.level, t.maxLevel)}</span>
                  <span className="w-xs w-mut">
                    {max
                      ? W.done
                      : t.ready
                        ? W.claim(t.ready)
                        : t.next !== null
                          ? W.next(short(t.stat), short(t.next))
                          : ''}
                  </span>
                </span>
              </li>
            );
          })}
          {w.daily ? (
            <li className="w-li">
              <span className="w-grow w-sm">{W.daily(w.daily.name)}</span>
              <span className={`w-xs${w.daily.done ? ' w-t--mint' : ' w-mut'}`}>
                {w.daily.done ? W.dailyDone : W.dailyTodo}
              </span>
            </li>
          ) : null}
        </ul>
      ) : (
        <p className="w-p w-sm w-mut2">{w.opener}</p>
      )}
    </section>
  );
}

function Tasks({ p }: { p: SystemPageBodyProps }) {
  const t = pictureOf(p, 'task-board');
  if (!t) return null;
  const order = [...t.worlds].sort(
    (a, b) => Number(b.open) - Number(a.open) || b.ready - a.ready || a.world - b.world,
  );
  return (
    <div className="w-grid gp-boards">
      {order.map((w) => (
        <Board key={w.world} w={w} />
      ))}
    </div>
  );
}

function Merits({ p }: { p: SystemPageBodyProps }) {
  const t = pictureOf(p, 'task-board');
  if (!t) return null;
  return (
    <div className="w-grid gp-boards">
      {t.worlds.map((w) => (
        <section key={w.world} className={`a-tile w-tile w-stack${w.open ? '' : ' is-later'}`}>
          <div className="w-row w-row--between">
            <span className="w-row">
              <Token world={w.world} />
              <span className="a-h2">{W.world(w.world)}</span>
            </span>
            {w.merits !== null ? (
              <span className="w-row">
                <Big value={n0(w.merits)} tone={w.merits ? 'gold' : undefined} />
                <span className="w-xs w-mut">{W.unspent}</span>
              </span>
            ) : null}
          </div>
          {w.open && w.shop.length ? (
            <ul className="w-hair w-plain">
              {w.shop.map((r) => {
                const max = r.level >= r.max;
                return (
                  <li key={r.index} className="w-li">
                    <span className={`w-grow w-sm${max ? ' w-mut' : ''}`}>{r.text}</span>
                    <span className="w-stack w-stack--4 gp-task__n">
                      <span className={`w-xs w-b${max ? ' w-t--mint' : ''}`}>
                        {W.rowLevel(r.level, r.max)}
                      </span>
                      {!max && r.cost !== null ? <span className="w-xs w-mut">{W.cost(r.cost)}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="w-p w-sm w-mut2">{w.open ? W.noShop : w.opener}</p>
          )}
        </section>
      ))}
    </div>
  );
}

function Unlocks({ p }: { p: SystemPageBodyProps }) {
  const t = pictureOf(p, 'task-board');
  if (!t) return null;
  const u = t.unlocks;
  const spare = Math.max(0, u.owned - u.bought);
  return (
    <Split
      main={
        <section className="w-stack">
          <Head title={W.unlocks} />
          <p className="w-p">{W.unlocksNote}</p>
          {u.openUnbought !== null ? <span className="w-sm">{W.openRows(u.openUnbought)}</span> : null}
          <div className="w-stack w-stack--8">
            <Cap>{W.toNext}</Cap>
            <Bar value={u.progress} max={Math.max(1, u.nextAt)} tone="sky" label={W.toNext} />
            <span className="w-xs w-mut">
              {n0(u.progress)} / {n0(u.nextAt)}
            </span>
          </div>
        </section>
      }
      aside={
        <div className="w-stack">
          <Cap>{W.ptsOwned}</Cap>
          <Big
            value={n0(spare)}
            unit={W.ptsUnspent(spare).replace(/^\d+ /, '')}
            tone={spare ? 'gold' : undefined}
          />
          <span className="w-xs w-mut">
            {n0(u.bought)} / {n0(u.owned)}
          </span>
        </div>
      }
    />
  );
}

const OPENS_ON: Record<string, string> = {
  'task-board': 'tasks',
  'merit-shop': 'merits',
  'task-unlocks': 'unlocks',
};

export function taskBoardSections(p: SystemPageBodyProps): PageSections | null {
  const t = pictureOf(p, 'task-board');
  if (!t) return null;
  const merits = t.worlds.reduce((n, w) => n + (w.open ? (w.merits ?? 0) : 0), 0);
  const answer: PageAnswer | null =
    p.page.goals.length === 0 && t.ready === 0
      ? { tone: 'mint', cap: W.where, hero: W.nothingReady, sub: merits ? W.meritsSub(merits) : null }
      : null;
  return {
    answer,
    initialTab: OPENS_ON[p.page.tile.id] ?? 'tasks',
    tabs: [
      { id: 'tasks', label: W.tasks, badge: t.ready || null, render: () => <Tasks p={p} /> },
      { id: 'merits', label: W.merits, badge: merits || null, render: () => <Merits p={p} /> },
      {
        id: 'unlocks',
        label: W.unlocks,
        badge: Math.max(0, t.unlocks.owned - t.unlocks.bought) || null,
        render: () => <Unlocks p={p} />,
      },
    ],
  };
}
