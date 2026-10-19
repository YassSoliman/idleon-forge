// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/Anvil.dc.html): the Anvil page on the System template. Tabs: the point split
// (why Speed makes the slow items, every character's split for an "Away for" window) and what each
// anvil makes. The numbers are the adapter's anvil point plan (Toolbox getPlayerAnvil, scored by anvil
// work) through `buildAnvilPageView`.
import { ANVIL_PAGE_HOURS, buildAnvilPageView, ANVIL_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { useMemo, useState } from 'react';
import { GameIcon } from '../../art/game/GameIcon';
import { itemArt } from '../../art/game/game-art';
import { WHETSTONE_ART } from '../../art/game/systems-art';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import { AnvilPlanTab } from '../../production/AnvilPlanTab';
import { AnvilRecipes } from '../../production/AnvilRecipes';
import { AnvilWalkthrough } from '../../production/AnvilWalkthrough';
import { SimplePage, StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, type FrameTab, frameAnswer, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import './pages.css';

const nearest = (seconds: number) =>
  ANVIL_PAGE_HOURS.reduce((best, h) =>
    Math.abs(h * 3600 - seconds) < Math.abs(best * 3600 - seconds) ? h : best,
  );

export default function AnvilPage({ s, page }: FullPageProps) {
  const [hours, setHours] = useState<number>(() => nearest(s.result.expectedReturn.usedSeconds));
  const v = useMemo(() => buildAnvilPageView(s.state, s.result, hours), [s.state, s.result, hours]);
  // The anvil's products carry their rawName in Account State; the view keeps only the display name.
  const rawOf = (index: number, name: string): string | null => {
    const c = s.state.characters.find((x) => x.index === index);
    const key = name.replace(/_/g, ' ');
    return c?.afk?.anvil?.find((a) => a.name.replace(/_/g, ' ') === key)?.item ?? null;
  };
  // The answer follows the player's own Expected Return, not the tab's chips.
  const own = useMemo(
    () => buildAnvilPageView(s.state, s.result, nearest(s.result.expectedReturn.usedSeconds)),
    [s.state, s.result],
  );
  // M26 F-C: the route's tab and row (FR-C2); the Walkthrough tab's own answer is the next tab (FR-C4).
  const route = s.route.place === 'system' && s.route.id === page.tile.id ? s.route : null;
  const prod = s.result.production ?? null;
  const openTab = (tab: string, focus?: string) =>
    s.navigate({ place: 'system', id: page.tile.id, tab, ...(focus ? { focus } : {}) }, 'replace', {
      origin: s.origin,
    });
  const next = prod?.nextTab ?? null;
  const pageAnswer: FrameAnswer | null =
    route?.tab === 'walkthrough' && next
      ? {
          tone: 'gold',
          cap: 'Do this next',
          hero: next.answer,
          sub: next.bottleneck || null,
          big: {
            value: `${next.ready}/${next.of}`,
            note: 'materials ready',
            meter: next.of ? next.ready / next.of : 0,
          },
        }
      : prod?.answer
        ? { tone: 'gold', cap: prod.answer.cap, hero: prod.answer.hero, sub: prod.answer.sub }
        : null;
  const answer: FrameAnswer =
    pageAnswer ??
    (own?.hero
      ? {
          tone: 'gold',
          cap: page.frame.answer.cap === 'All good' ? 'Do this next' : page.frame.answer.cap,
          hero: own.hero.hero,
          sub: own.hero.sub,
          big: { value: own.hero.points.toLocaleString('en-US'), unit: W.points, note: W.doingNothing },
        }
      : frameAnswer(page));
  const prodTabs: FrameTab[] = prod
    ? [
        {
          id: 'recipes',
          label: W.tabs.recipes,
          render: () => (
            <AnvilRecipes
              s={s}
              p={prod}
              focus={route?.tab === 'recipes' ? (route.focus ?? null) : null}
              openWalkthrough={() => openTab('walkthrough', next?.rawName)}
            />
          ),
        },
        {
          id: 'walkthrough',
          label: W.tabs.walkthrough,
          ...(prod.walkthroughs.length ? { badge: prod.walkthroughs.length } : {}),
          render: () => <AnvilWalkthrough p={prod} />,
        },
      ]
    : [];
  // M26 section 8: the Production Plan tab comes first and replaces "What each anvil makes".
  const planTab: FrameTab[] = prod
    ? [{ id: 'plan', label: W.tabs.plan, render: () => <AnvilPlanTab s={s} p={prod} /> }]
    : [];
  // Without the point plan (an old pasted save), the page still has its Plan, Recipes and Walkthrough.
  if (!v)
    return prodTabs.length ? (
      <SystemFrame
        s={s}
        page={page}
        answer={pageAnswer ?? frameAnswer(page)}
        tabs={[...planTab, ...prodTabs]}
      />
    ) : (
      <SimplePage s={s} page={page} />
    );
  const makers = v.makes.filter((m) => m.items.length > 0).length;
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        ...planTab,
        {
          id: 'points',
          label: W.tabs.points,
          render: () => (
            <div className="sf-split">
              <div className="sf-col">
                {v.products.length > 0 ? (
                  <section className="sf-sec" aria-labelledby="an-work-h">
                    <div className="sf-sec__head">
                      <h3 id="an-work-h" className="a-h2">
                        {W.workTitle}
                      </h3>
                      <span className="sf-hint">{W.workHint}</span>
                    </div>
                    <ul className="an-work">
                      {v.products.map((p) => (
                        <li key={p.item} className="an-work__row">
                          <span className="an-work__name">
                            <span className="an-item">
                              <GameIcon art={itemArt(p.item)} size={24} wiki={p.name} decorative />
                              <span className="sf-strong sf-small">{p.name}</span>
                            </span>
                            <span className="sf-hint">{p.who}</span>
                          </span>
                          <span className="an-work__bar">
                            <span className="an-work__fill" style={{ width: `${p.bar * 60}%` }} />
                            <span className="sf-hint">{W.work(p.work.toLocaleString('en-US'))}</span>
                          </span>
                          {p.fill ? (
                            <span className="an-work__fills sf-small">
                              {W.fillsIn} <b>{p.fill}</b>
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                    {v.why ? <p className="sf-note">{v.why}</p> : null}
                  </section>
                ) : null}
                <section className="sf-sec" aria-labelledby="an-split-h">
                  <div className="sf-sec__head">
                    <h3 id="an-split-h" className="a-h2">
                      {W.splitTitle}
                    </h3>
                    <div className="an-away">
                      <span className="sf-hint">{W.awayFor}</span>
                      <fieldset className="a-seg">
                        <legend className="sr-only">{W.awayFor}</legend>
                        {ANVIL_PAGE_HOURS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            className={`a-seg__option an-away__opt sf-seg-opt${h === hours ? ' a-seg__option--on' : ''}`}
                            aria-pressed={h === hours}
                            onClick={() => setHours(h)}
                          >
                            {h}h
                          </button>
                        ))}
                      </fieldset>
                    </div>
                  </div>
                  <p className="sf-legend">
                    <span>
                      <span className="sf-swatch an-sw--speed" />
                      {W.legend.speed}
                    </span>
                    <span>
                      <span className="sf-swatch an-sw--cap" />
                      {W.legend.capacity}
                    </span>
                    <span>
                      <span className="sf-swatch an-sw--spare" />
                      {W.legend.spare}
                    </span>
                  </p>
                  <ul className="sf-rows">
                    {v.rows.map((r) => {
                      const pool = Math.max(1, r.speed + r.capacity + r.spare);
                      return (
                        <li
                          key={r.index}
                          className={`sf-row an-row${r.tone === 'gold' ? ' sf-row--gold' : ''}`}
                          data-focus-key={`c${r.index}`}
                        >
                          <span className="an-row__who">
                            {r.who ? (
                              <WhoGlyph family={r.who.family} classLabel={r.who.label} scale={2} decorative />
                            ) : null}
                            <span className="sf-row__main">
                              <span className="sf-strong">{r.who?.label}</span>
                              <span className="sf-hint">{r.detail}</span>
                            </span>
                          </span>
                          <span className="an-row__bar">
                            <span className="an-bar" aria-hidden="true">
                              <span
                                className="an-sw--speed"
                                style={{ width: `${(r.speed / pool) * 100}%` }}
                              />
                              <span
                                className="an-sw--cap"
                                style={{ width: `${(r.capacity / pool) * 100}%` }}
                              />
                              <span
                                className="an-sw--spare"
                                style={{ width: `${(r.spare / pool) * 100}%` }}
                              />
                            </span>
                            <span className="sf-hint">{r.split}</span>
                          </span>
                          <span className="an-row__todo">
                            <span className={`sf-small sf-strong sf-t--${r.tone}`}>{r.todo}</span>
                            <span className="sf-hint">{r.gain}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
                <StepsSection page={page} quiet />
              </div>
              <aside className="sf-col">
                <section className="a-tile sf-tile" aria-labelledby="an-ws-h">
                  <div className="an-ws__head">
                    <GameIcon
                      art={WHETSTONE_ART}
                      fallback={
                        <svg
                          aria-hidden="true"
                          width="32"
                          height="32"
                          viewBox="0 0 16 16"
                          shapeRendering="crispEdges"
                        >
                          <rect x="2" y="7" width="12" height="4" fill="#9AA3B2" />
                          <rect x="3" y="6" width="10" height="1" fill="#C9D0DB" />
                          <rect x="2" y="11" width="12" height="1" fill="#6B7280" />
                          <rect x="4" y="8" width="3" height="1" fill="#EDE6D6" />
                        </svg>
                      }
                      size={32}
                      wiki="Anvil Reset Whetstone"
                      decorative
                    />
                    <span className="sf-row__main">
                      <span id="an-ws-h" className="sf-strong">
                        {W.whetstone}
                      </span>
                      <span className="sf-hint">{W.whetstoneSub}</span>
                    </span>
                  </div>
                  <dl className="sf-hair an-facts">
                    <div className="sf-hair__row">
                      <dt className="sf-muted">{W.where}</dt>
                      <dd className="sf-strong">{W.whereValue}</dd>
                    </div>
                    <div className="sf-hair__row">
                      <dt className="sf-muted">{W.price}</dt>
                      <dd className="sf-strong">{W.priceValue}</dd>
                    </div>
                    <div className="sf-hair__row">
                      <dt className="sf-muted">{W.howMany}</dt>
                      <dd className="sf-strong">{W.howManyValue}</dd>
                    </div>
                  </dl>
                  <span className="a-cap">{W.worthOn}</span>
                  {v.whetstone.length > 0 ? (
                    <ol className="an-worth">
                      {v.whetstone.map((w, i) => (
                        <li key={w.who?.label ?? i} className="sf-small">
                          <span className={`sf-n${i === 0 ? ' sf-n--gold' : ''}`}>{i + 1}</span>
                          <span className="sf-grow">{w.who?.label}</span>
                          <span className="sf-muted">{w.when}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="sf-muted">{W.worthNone}</p>
                  )}
                  <p className="sf-hint">{v.noExp ? W.noExp : W.hasExp}</p>
                </section>
              </aside>
            </div>
          ),
        },
        ...(prod
          ? []
          : [
              {
                id: 'makes',
                label: W.tabs.makes,
                badge: makers,
                render: () => (
                  <section className="sf-sec" aria-labelledby="an-makes-h">
                    <h3 id="an-makes-h" className="a-h2">
                      {W.makesTitle}
                    </h3>
                    <ul className="sf-rows">
                      {v.makes.map((m) => (
                        <li key={m.index} className="sf-row">
                          <span className="an-row__who">
                            {m.who ? (
                              <WhoGlyph family={m.who.family} classLabel={m.who.label} scale={2} decorative />
                            ) : null}
                            <span className="sf-strong">{m.who?.label}</span>
                          </span>
                          <ul className="an-makes">
                            {m.items.map((it) => (
                              <li key={it.name} className="sf-small an-item">
                                <GameIcon
                                  art={itemArt(rawOf(m.index, it.name))}
                                  size={16}
                                  wiki={it.name}
                                  decorative
                                />
                                <span className="sf-strong">{it.name}</span>{' '}
                                <span className="sf-muted">
                                  {W.of(
                                    it.amount.toLocaleString('en-US'),
                                    it.capacity.toLocaleString('en-US'),
                                  )}{' '}
                                  · {it.full}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </section>
                ),
              },
            ]),
        ...prodTabs,
      ]}
    />
  );
}
