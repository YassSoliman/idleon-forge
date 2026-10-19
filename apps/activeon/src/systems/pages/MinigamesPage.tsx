// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/Minigames.dc.html): the Minigames page on the System template. Tabs: today (one
// card per cooldown minigame: ready or when, points to spend) and where the points go (the Darts order
// from minigames.check.darts-spend). Data: `account.minigames` (M6) and this System's Goals.
import { shortDuration } from '@idleon-forge/engine/now';
import { MINIGAMES_PAGE_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { Sprite } from '../../art/sprites/Sprite';
import { ChecksTile, SimplePage, StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, type FrameTone, frameAnswer, Pip, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import './pages.css';

export default function MinigamesPage({ s, page }: FullPageProps) {
  const mg = s.state.account.minigames;
  if (!mg) return <SimplePage s={s} page={page} />;
  const elapsed = Math.max(0, (s.now - s.result.asOf) / 1000);
  const fired = new Set(page.goals.map((g) => g.id));
  const game = (k: 'darts' | 'hoops') => {
    const g = mg[k];
    const left = g.cooldownSecondsAtSave - elapsed;
    const play = fired.has(`minigames.check.${k}-play`);
    const tone: FrameTone = play ? 'coral' : left <= 0 ? 'gold' : 'sky';
    return {
      k,
      name: W.games[k],
      state: play ? W.play : left <= 0 ? W.ready : W.readyIn(shortDuration(left)),
      tone,
      points: g.points,
      sub: W.playsToday(g.playsToday),
    };
  };
  const cards = [
    game('darts'),
    game('hoops'),
    {
      k: 'spiketrap',
      name: W.games.spiketrap,
      state: fired.has('minigames.check.spiketrap') ? W.gems : W.nothing,
      tone: (fired.has('minigames.check.spiketrap') ? 'gold' : 'mint') as FrameTone,
      points: null as number | null,
      sub: W.best(mg.spiketrap.bestRound),
    },
  ];
  const ready = cards.filter((c) => c.tone === 'coral').length;
  const base = frameAnswer(page);
  const answer: FrameAnswer =
    ready > 0 && base.tone === 'coral'
      ? { ...base, big: { value: String(ready), unit: W.rounds(ready), note: W.readyNow } }
      : base;
  const dartsLevels = mg.darts.levels.reduce((a, b) => a + b, 0);
  const order = (
    <section className="sf-sec" aria-labelledby="mg-order-h">
      <div className="sf-sec__head">
        <h3 id="mg-order-h" className="a-h2">
          {W.dartsTitle}
        </h3>
        <span className="sf-hint">{W.dartsHint(mg.darts.points, dartsLevels)}</span>
      </div>
      <ol className="sf-plain">
        {W.dartsOrder.map(([what, until], i) => (
          <li key={what}>
            <span className={`sf-n${i === 0 ? ' sf-n--gold' : ''}`}>{i + 1}</span>
            <span className="sf-strong mg-what">{what}</span>
            <span className="sf-muted">{until}</span>
          </li>
        ))}
      </ol>
      <p className="sf-hint">{W.hoopsNote}</p>
    </section>
  );
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        {
          id: 'today',
          label: W.tabs.today,
          render: () => (
            <>
              <ul className="mg-cards">
                {cards.map((c) => (
                  <li key={c.k} className={`mg-card${c.tone === 'coral' ? ' mg-card--now' : ''}`}>
                    <div className="mg-card__top">
                      <Sprite name="sys-minigames" size={48} decorative />
                      <span className={`sf-small sf-strong mg-state sf-t--${c.tone}`}>
                        <Pip tone={c.tone} />
                        {c.state}
                      </span>
                    </div>
                    <div className="sf-row__main">
                      <span className="a-h2">{c.name}</span>
                      <span className="sf-muted">{c.sub}</span>
                    </div>
                    {c.points !== null ? (
                      <div className="mg-card__foot sf-small">
                        <span className="sf-muted">{W.pointsToSpend}</span>
                        <span className={`sf-strong ${c.points > 0 ? 'sf-t--gold' : 'sf-t--mut'}`}>
                          {c.points}
                        </span>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="sf-split">
                <div className="sf-col">
                  {order}
                  <StepsSection page={page} quiet />
                </div>
                <ChecksTile s={s} page={page} />
              </div>
            </>
          ),
        },
        {
          id: 'points',
          label: W.tabs.points,
          badge: [mg.darts.points, mg.hoops.points].filter((n) => n > 0).length || null,
          render: () => order,
        },
      ]}
    />
  );
}
