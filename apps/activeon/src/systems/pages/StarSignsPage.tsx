// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/StarSigns.dc.html): the Star Signs page on the System template. Tabs: the road
// to two signs (the Telescope, the next constellations, Chronus Cosmos), what each character wears and
// should wear, and the Star Chart (M21's constellation body). Data: M16's `EngineResult.starSigns`.
import { SIGNS_PAGE_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { Sprite } from '../../art/sprites/Sprite';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import { ChecksTile, StepsSection } from '../frame/SimplePage';
import { frameAnswer, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import { StarSignsSystemBody } from '../StarChartPage';
import './pages.css';

export default function StarSignsPage({ s, page }: FullPageProps) {
  const v = s.result.starSigns;
  if (!v) return <SystemFrame s={s} page={page} />;
  const who = (i: number) => {
    const c = s.result.characters.find((x) => x.index === i);
    return { label: c ? `${c.classLabel} ${c.level}` : `${i + 1}`, family: s.result.classFamilies?.[i] };
  };
  // The Telescope leg: done once the quest is in; else the character closest to reaching it.
  const closest = [...v.characters]
    .filter((c) => c.canChange === true || c.killsToTelescope !== null)
    .sort(
      (a, b) =>
        (a.canChange ? -1 : 0) - (b.canChange ? -1 : 0) ||
        (a.killsToTelescope ?? 0) - (b.killsToTelescope ?? 0),
    )[0];
  const pts = v.next.reduce((n, x) => n + x.points, 0);
  const legs = [
    {
      key: 'telescope',
      sprite: 'item-star',
      title: W.telescope,
      done: v.questDone,
      line: v.questDone
        ? W.telescopeDone
        : closest?.canChange
          ? W.telescopeOpen
          : closest?.killsToTelescope
            ? W.telescopeKills(closest.killsToTelescope)
            : W.telescopeOpen,
      foot: v.questDone ? W.done : closest ? W.telescopeWho(who(closest.index).label) : '',
    },
    {
      key: 'constellations',
      sprite: 'sys-star-signs',
      title: W.constellations,
      done: false,
      line: v.next.length ? W.constellationsLine(v.next.length, pts) : W.noConstellations,
      foot: v.points !== null ? W.holdPoints(v.points) : '',
    },
    {
      key: 'cosmos',
      sprite: 'item-star',
      title: W.cosmos,
      done: v.slots >= 2,
      line: v.slots >= 2 ? W.cosmosDone : (v.milestone ?? W.cosmosLine),
      foot: v.slots >= 2 ? W.done : '',
    },
  ];
  const firstOpen = legs.findIndex((l) => !l.done);
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={frameAnswer(page)}
      tabs={[
        {
          id: 'road',
          label: W.tabs.road,
          render: () => (
            <div className="sf-split">
              <div className="sf-col">
                <section className="sf-sec" aria-label={W.roadTitle}>
                  <ol className="sg-road">
                    {legs.map((l, i) => (
                      <li
                        key={l.key}
                        className={`sg-leg${i === firstOpen ? ' sg-leg--now' : ''}${l.done ? ' sg-leg--done' : ''}`}
                      >
                        <div className="sg-leg__top">
                          <Sprite name={l.sprite} size={48} decorative />
                          <span className={`sf-n${i === firstOpen ? ' sf-n--gold' : ''}`}>{i + 1}</span>
                        </div>
                        <span className="sf-strong sg-leg__title">{l.title}</span>
                        <span className="sf-muted">{l.line}</span>
                        {l.foot ? (
                          <span className={`sf-hint${l.done ? ' sf-t--mint' : ''}`}>{l.foot}</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
                <StepsSection page={page} quiet />
              </div>
              <ChecksTile s={s} page={page} />
            </div>
          ),
        },
        {
          id: 'who',
          label: W.tabs.who,
          badge: v.characters.length,
          render: () => (
            <section className="sf-sec" aria-labelledby="sg-who-h">
              <div className="sf-sec__head">
                <h3 id="sg-who-h" className="sf-h">
                  {W.whoTitle}
                </h3>
                <span className="sf-hint">{W.whoHint}</span>
              </div>
              <ul className="sf-rows">
                {v.characters.map((c) => {
                  const w = who(c.index);
                  const rec = c.recommended.join(' + ');
                  return (
                    <li key={c.index} className="sf-row">
                      {w.family ? (
                        <WhoGlyph family={w.family} classLabel={w.label} scale={2} decorative />
                      ) : null}
                      <span className="sf-strong sg-who">{w.label}</span>
                      <span className="sf-row__main">
                        <span className={`sf-small ${c.matches ? 'sf-t--mint' : 'sf-t--gold'}`}>
                          {c.matches ? `${rec || c.worn.join(' + ')} ✓` : W.swapTo(rec)}
                        </span>
                        <span className="sf-hint">
                          {c.matches
                            ? W.right
                            : [
                                W.wears(c.worn.join(' + ') || W.nothingWorn),
                                c.killsToTelescope ? W.killsToReach(c.killsToTelescope) : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                        </span>
                      </span>
                      {c.afterCosmos ? (
                        <span className="sf-row__main sg-after">
                          <span className="sf-hint">{W.afterCosmos}</span>
                          <span className="sf-small">{c.afterCosmos.join(' + ')}</span>
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ),
        },
        {
          id: 'chart',
          label: W.tabs.chart,
          badge: W.chartBadge(v.unlockedNodes, v.hydronAt),
          render: () => <StarSignsSystemBody s={s} page={page} />,
        },
      ]}
    />
  );
}
