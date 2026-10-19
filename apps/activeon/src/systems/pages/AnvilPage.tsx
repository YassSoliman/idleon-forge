// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/Anvil.dc.html): the Anvil page on the System template. Tabs: the point split
// (why Speed makes the slow items, every character's split for an "Away for" window) and what each
// anvil makes. The numbers are the adapter's anvil point plan (Toolbox getPlayerAnvil, scored by anvil
// work) through `buildAnvilPageView`.
import { ANVIL_PAGE_HOURS, buildAnvilPageView, ANVIL_WORDS as W } from '@idleon-forge/engine/systems-ui';
import { useMemo, useState } from 'react';
import { WhoGlyph } from '../../design/who/WhoGlyph';
import { ChecksTile, SimplePage, StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, frameAnswer, SystemFrame } from '../frame/SystemFrame';
import type { FullPageProps } from '../pages';
import './pages.css';

const nearest = (seconds: number) =>
  ANVIL_PAGE_HOURS.reduce((best, h) =>
    Math.abs(h * 3600 - seconds) < Math.abs(best * 3600 - seconds) ? h : best,
  );

export default function AnvilPage({ s, page }: FullPageProps) {
  const [hours, setHours] = useState<number>(() => nearest(s.result.expectedReturn.usedSeconds));
  const v = useMemo(() => buildAnvilPageView(s.state, s.result, hours), [s.state, s.result, hours]);
  // The answer follows the player's own Expected Return, not the tab's chips.
  const own = useMemo(
    () => buildAnvilPageView(s.state, s.result, nearest(s.result.expectedReturn.usedSeconds)),
    [s.state, s.result],
  );
  if (!v) return <SimplePage s={s} page={page} />;
  const answer: FrameAnswer = own?.hero
    ? {
        tone: 'gold',
        cap: page.frame.answer.cap === 'All good' ? 'Do this next' : page.frame.answer.cap,
        hero: own.hero.hero,
        sub: own.hero.sub,
        big: { value: own.hero.points.toLocaleString('en-US'), unit: W.points, note: W.doingNothing },
      }
    : frameAnswer(page);
  const makers = v.makes.filter((m) => m.items.length > 0).length;
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        {
          id: 'split',
          label: W.tabs.split,
          render: () => (
            <div className="sf-split">
              <div className="sf-col">
                {v.products.length > 0 ? (
                  <section className="sf-sec" aria-labelledby="an-work-h">
                    <div className="sf-sec__head">
                      <h3 id="an-work-h" className="sf-h">
                        {W.workTitle}
                      </h3>
                      <span className="sf-hint">{W.workHint}</span>
                    </div>
                    <ul className="an-work">
                      {v.products.map((p) => (
                        <li key={p.item} className="an-work__row">
                          <span className="an-work__name">
                            <span className="sf-strong sf-small">{p.name}</span>
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
                    <h3 id="an-split-h" className="sf-h">
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
                <section className="sf-tile" aria-labelledby="an-ws-h">
                  <div className="an-ws__head">
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
                  <span className="sf-capline">{W.worthOn}</span>
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
                <ChecksTile s={s} page={page} />
              </aside>
            </div>
          ),
        },
        {
          id: 'makes',
          label: W.tabs.makes,
          badge: makers,
          render: () => (
            <section className="sf-sec" aria-labelledby="an-makes-h">
              <h3 id="an-makes-h" className="sf-h">
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
                        <li key={it.name} className="sf-small">
                          <span className="sf-strong">{it.name}</span>{' '}
                          <span className="sf-muted">
                            {W.of(it.amount.toLocaleString('en-US'), it.capacity.toLocaleString('en-US'))} ·{' '}
                            {it.full}
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
      ]}
    />
  );
}
