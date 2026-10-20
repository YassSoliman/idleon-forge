// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 World 4: the Cooking page body (board `after/sys/Cooking`), a read-only view of the save: the
// framed answer, then Kitchens (a tile per kitchen with its state and upgrade levels or the spice each
// costs, and the next kitchens' prices), Meals (the three to find first, the meal table, how a meal
// grows) and Spices (held, what each pays for, claims today, ladles). M25: the game's kitchen, meal and
// spice sprites (ADR 0009 as amended 2026-10-19), our kit as the fallback.
import type { CookingPageView } from '@idleon-forge/engine/world4';
import { useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { etcArt } from '../art/game/game-art';
import { keyIndex, mealArt, spiceArt } from '../art/game/w4-art';
import { cx, Meter, Pip, Tabs } from '../design/atoms';
import type { Session } from '../shell/session';
import { Frame, SourceLine, Tag, toneClass } from './parts';

type CookTab = 'kitchens' | 'meals' | 'spices';
const MEAL_ROWS = 12;

export function CookingBody({ s, v, framed = true }: { s: Session; v: CookingPageView; framed?: boolean }) {
  const [tab, setTab] = useState<CookTab>('kitchens');
  const [allMeals, setAllMeals] = useState(false);
  const meals = allMeals ? v.meals : v.meals.slice(0, MEAL_ROWS);
  return (
    <div className="w4-page">
      {framed ? <Frame f={v.frame} s={s} /> : null}
      <Tabs<CookTab>
        label="Cooking sections"
        value={tab}
        idBase="w4-cook"
        onChange={setTab}
        tabs={v.tabs.map((t) => ({
          value: t.id as CookTab,
          label: t.label,
          badge: t.badge ? <Tag>{t.badge}</Tag> : undefined,
        }))}
      />
      <div
        id={`w4-cook-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`w4-cook-tab-${tab}`}
        className="w4-panel"
      >
        {tab === 'kitchens' ? (
          <section className="w4-sec" aria-labelledby="w4-k-h">
            <header className="w4-sec__head">
              <h3 id="w4-k-h" className="sy-h3">
                Kitchens
              </h3>
              <span className="w4-muted w4-small">{v.kitchensLede}</span>
            </header>
            <ul className="w4-kitchens">
              {v.kitchens.map((k) => (
                <li
                  key={k.key}
                  className={cx('a-tile w4-kitchen', toneClass(k.tone), k.owned ? 'is-owned' : 'is-locked')}
                >
                  <div className="w4-card__head">
                    <GameIcon
                      art={etcArt('Kitchen')}
                      fallback="sys-cooking"
                      size={32}
                      decorative
                      className={k.lit ? undefined : 'w4-dim'}
                    />
                    <Tag tone={k.tone}>{k.badge}</Tag>
                  </div>
                  <span className="w4-kitchen__name">Kitchen {k.n}</span>
                  <span className={cx('w4-small w4-strong', toneClass(k.tone))}>{k.state}</span>
                  <dl className="w4-kv w4-xs">
                    {k.upgrades.map((u) => (
                      <div key={u.label}>
                        <dt className="w4-muted">{u.label}</dt>
                        <dd>{u.value}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
            {v.buyLine ? (
              <div className="a-tile2 w4-line">
                <Pip tone="gold" />
                <span className="w4-small">
                  <span className="w4-strong">{v.buyLine.title}</span>{' '}
                  <span className="w4-muted">{v.buyLine.detail}</span>
                </span>
                {v.buyLine.later ? <span className="w4-xs w4-muted">{v.buyLine.later}</span> : null}
              </div>
            ) : null}
            <p className="w4-small w4-muted">{v.ladles}</p>
          </section>
        ) : null}
        {tab === 'meals' ? (
          <div className="w4-split">
            <section className="w4-sec" aria-labelledby="w4-m-h">
              <header className="w4-sec__head">
                <h3 id="w4-m-h" className="sy-h3">
                  {v.mealsTitle}
                </h3>
                {v.nextMeals.length > 0 ? (
                  <span className="w4-muted w4-small">
                    one spice per recipe is the surest way to discover
                  </span>
                ) : null}
              </header>
              {v.nextMeals.length > 0 ? (
                <ol className="w4-cards">
                  {v.nextMeals.map((m) => (
                    <li key={m.key} className="a-tile w4-card w4-card--lit">
                      <div className="w4-card__head">
                        <span className="w4-num w4-t--gold" aria-hidden="true">
                          {m.n}
                        </span>
                        <GameIcon art={mealArt(m.key)} fallback="item-meal" size={32} decorative />
                        <span className="w4-strong">{m.name}</span>
                      </div>
                      <span className="w4-small">{m.bonus}</span>
                      <span className="w4-xs w4-muted">{m.how}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              <table className="w4-table">
                <thead>
                  <tr>
                    <th scope="col">Meal</th>
                    <th scope="col">Each level gives</th>
                    <th scope="col">Found with</th>
                    <th scope="col" className="w4-r">
                      1 copy in
                    </th>
                    <th scope="col" className="w4-r">
                      Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {meals.map((m) => (
                    <tr key={m.key}>
                      <th scope="row">
                        <span className="w4-who">
                          <GameIcon art={mealArt(m.key)} fallback="item-meal" size={32} decorative />
                          {m.name}
                        </span>
                      </th>
                      <td className="w4-muted">{m.bonus}</td>
                      <td className="w4-muted">{m.spice}</td>
                      <td className="w4-r w4-muted num">{m.time}</td>
                      <td className="w4-r num">{m.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {v.meals.length > MEAL_ROWS ? (
                <button type="button" className="a-btn a-btn--quiet" onClick={() => setAllMeals((x) => !x)}>
                  {allMeals ? 'Show fewer' : `Show all ${v.meals.length}`}
                </button>
              ) : null}
              <p className="w4-xs w4-muted">{v.mealsNote}</p>
            </section>
            <aside className="w4-sec" aria-labelledby="w4-grow-h">
              <h3 id="w4-grow-h" className="w4-cap">
                How a meal grows
              </h3>
              <dl className="w4-kv w4-kv--rows w4-small">
                {v.growth.map((g) => (
                  <div key={g.label}>
                    <dt className="w4-muted">{g.label}</dt>
                    <dd className="w4-strong">{g.value}</dd>
                  </div>
                ))}
              </dl>
              {v.closest ? (
                <div className="a-tile2 w4-stack">
                  <span className="w4-who w4-small w4-strong">
                    <GameIcon art={mealArt(v.closest.name)} fallback="item-meal" size={32} decorative />
                    {v.closest.name}
                  </span>
                  <Meter value={v.closest.have} max={v.closest.need} label={v.closest.text} />
                  <span className="w4-xs w4-muted">{v.closest.text}</span>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}
        {tab === 'spices' ? (
          <section className="w4-sec" aria-labelledby="w4-s-h">
            <header className="w4-sec__head">
              <h3 id="w4-s-h" className="sy-h3">
                Spices
              </h3>
              <span className="w4-muted w4-small">{v.spicesLine}</span>
            </header>
            <ul className="w4-rows">
              {v.spices.map((x) => (
                <li key={x.key} className={cx('w4-row', !x.found && 'is-quiet')}>
                  <GameIcon
                    art={spiceArt(keyIndex(x.key))}
                    fallback="item-spice"
                    size={24}
                    decorative
                    className={x.found ? undefined : 'w4-dim'}
                  />
                  <span className="w4-row__main">
                    <span className="w4-strong w4-small">{x.name}</span>
                    <span className="w4-xs w4-muted">{x.use}</span>
                  </span>
                  <span className={cx('w4-row__status w4-small num', x.found ? undefined : 'w4-muted')}>
                    {x.held}
                  </span>
                </li>
              ))}
            </ul>
            <p className="w4-xs w4-muted">{v.spicesNote}</p>
          </section>
        ) : null}
      </div>
      <SourceLine sources={[v.source]} />
    </div>
  );
}
