// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 FR-55 (Wave 6): the Minigames page's Highscores tab. The five highscores the Tome adds up, and
// one row per Milestone ladder (Spiketrap round, Hoops and Darts unlocks, Pen Pals tiers). Every target
// is the engine's Goal (its Milestone), never a number of our own: with no Goal a row shows its value only.
import type { MinigamesState } from '@idleon-forge/account-state';
import type { Goal } from '@idleon-forge/engine/result';
import { GameIcon } from '../../art/game/GameIcon';
import { classArt, type GameArt } from '../../art/game/game-art';
import { MINIGAME_ART } from '../../art/game/systems-art';
import { Bar, Big, Head, n0, Tag } from '../w23/kit';
import './w1.css';

export const MINIGAME_SCORE_WORDS = {
  tab: 'Highscores',
  tome: 'Tome highscore',
  tomeNote: 'The Tome adds these five up. Hoops, Darts and Spiketrap are not in it.',
  ofTarget: (v: number, t: number) => `${n0(v)} of ${n0(t)}`,
  ladders: 'Ladders',
  next: (n: number) => `next ${n0(n)}`,
  games: {
    choppin: 'Choppin',
    fishing: 'Fishing',
    catching: 'Catching',
    mining: 'Mining',
    penPals: 'Pen Pals',
    spiketrap: 'Spiketrap round',
    hoops: 'Hoops levels',
    darts: 'Darts levels',
  },
} as const;
const W = MINIGAME_SCORE_WORDS;

/** The skill icons (Toolbox data/ClassIcons<n>: 42 Mining, 44 Choppin, 45 Fishing, 47 Catching, 48 Trapping). */
const SKILL_ICON: Readonly<Record<'choppin' | 'fishing' | 'catching' | 'mining' | 'penPals', number>> = {
  choppin: 44,
  fishing: 45,
  catching: 47,
  mining: 42,
  penPals: 48,
};

/** The account Goal of an entry, from the engine result (its Milestone carries the numbers). */
const goalOf = (goals: readonly Goal[], id: string): Goal | undefined => goals.find((g) => g.id === id);

function LadderRow({
  art,
  label,
  value,
  goal,
}: {
  art: GameArt | null;
  label: string;
  value: number;
  goal?: Goal;
}) {
  const m = goal?.milestone ?? null;
  return (
    <li className="w-li">
      <GameIcon art={art} fallback="sys-minigames" size={32} decorative />
      <span className="w-stack w-stack--4 w-grow">
        <span className="w-sm w-b">{label}</span>
        <span className="w-xs w-mut">{goal ? goal.nextAction.text : n0(value)}</span>
        {m ? (
          <Bar
            value={Math.min(m.current, m.next)}
            max={Math.max(1, m.next)}
            tone="gold"
            label={goal?.nextAction.text ?? label}
          />
        ) : null}
      </span>
      {m ? <Tag tone="gold">{W.next(m.next)}</Tag> : null}
    </li>
  );
}

export function MinigameScores({ mg, goals }: { mg: MinigamesState; goals: readonly Goal[] }) {
  const scores = [
    ['choppin', mg.highscores.choppin],
    ['fishing', mg.highscores.fishing],
    ['catching', mg.highscores.catching],
    ['mining', mg.highscores.mining],
    ['penPals', mg.penPals ?? 0],
  ] as const;
  const total = scores.reduce((n, [, v]) => n + v, 0);
  const tome = goalOf(goals, 'minigames.goal.tome-highscore')?.milestone ?? null;
  const levels = (k: 'hoops' | 'darts') => mg[k].levels.reduce((a, b) => a + b, 0);
  return (
    <div className="w-stack w-stack--24">
      <section className="w-stack" aria-labelledby="w1-mg-tome">
        <Head id="w1-mg-tome" title={W.tome} note={tome ? W.ofTarget(total, tome.next) : undefined} />
        <Big value={n0(total)} />
        {tome ? (
          <Bar
            value={Math.min(total, tome.next)}
            max={tome.next}
            tone="gold"
            label={W.ofTarget(total, tome.next)}
          />
        ) : null}
        <ul className="w-grid w-grid--3 w-plain">
          {scores.map(([k, v]) => (
            <li key={k} className="a-tile2 w-tile2">
              <div className="w-row">
                <GameIcon art={classArt(SKILL_ICON[k])} fallback="sys-minigames" size={32} decorative />
                <span className="w-stack w-stack--4">
                  <span className="w-sm">{W.games[k]}</span>
                  <span className="w-b num">{n0(v)}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="w-p w-xs">{W.tomeNote}</p>
      </section>
      <section className="w-stack" aria-labelledby="w1-mg-ladders">
        <Head id="w1-mg-ladders" title={W.ladders} />
        <ul className="w-hair w-plain">
          <LadderRow
            art={MINIGAME_ART.spiketrap}
            label={W.games.spiketrap}
            value={mg.spiketrap.bestRound}
            goal={goalOf(goals, 'minigames.goal.spiketrap-round')}
          />
          <LadderRow
            art={MINIGAME_ART.hoops}
            label={W.games.hoops}
            value={levels('hoops')}
            goal={goalOf(goals, 'minigames.goal.hoops-unlocks')}
          />
          <LadderRow
            art={MINIGAME_ART.darts}
            label={W.games.darts}
            value={levels('darts')}
            goal={goalOf(goals, 'minigames.goal.darts-unlocks')}
          />
          <LadderRow
            art={classArt(SKILL_ICON.penPals)}
            label={W.games.penPals}
            value={mg.penPals ?? 0}
            goal={goalOf(goals, 'minigames.goal.pen-pals')}
          />
        </ul>
      </section>
    </div>
  );
}
