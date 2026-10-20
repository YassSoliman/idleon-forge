// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the Spend Plan page (canvas board SpendPlan): the answer framed at the top (how many buys the
// coins cover today, and which character to log into first), the plan in M7's order (the first three as
// tiles with their steps, the rest as a list), and the side column: each character's pocket, the coins
// in storage, the lines without a price, and what the plan leaves out. Each character pays from its own
// pocket (M7 D1). It only lays out the Now view's Spend Plan and M7's plan; no advice of its own.
import { useMemo, useState } from 'react';
import { GameIcon } from '../art/game/GameIcon';
import { dataArt } from '../art/game/game-art';
import { Sprite } from '../art/sprites/Sprite';
import { SourceLabel } from '../design/atoms';
import { cx } from '../design/atoms/Button';
import { WhoGlyph } from '../design/who/WhoGlyph';
import { useNowActions } from '../now/context';
import type { Session } from '../shell/session';
import { Crumb } from './Crumb';
import { type SpendPageLine, spendPage } from './spend-model';
import { SPEND_WORDS as W } from './words';

/** The list after the first three stops here; the rest opens on demand (rule 3). */
const REST_SHOWN = 8;

function Who({ l, scale }: { l: SpendPageLine; scale: 1 | 2 }) {
  if (!l.family || !l.who)
    return <span className={cx('ac-who-gap', scale === 2 && 'is-2')} aria-hidden="true" />;
  return <WhoGlyph family={l.family} classLabel={l.who} scale={scale} decorative />;
}

function TopLine({ l, first }: { l: SpendPageLine; first: boolean }) {
  const actions = useNowActions();
  return (
    <li className={cx('ac-sl', first && 'is-first')}>
      <div className="ac-sl__row">
        <span className="ac-n num" aria-hidden="true">
          {l.n}
        </span>
        <Who l={l} scale={2} />
        {l.art ? <GameIcon art={l.art} size={32} decorative /> : null}
        <span className="ac-sl__t">
          <b>{l.text}</b>
          <span className="ac-sub">{[l.who, l.where].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="ac-sl__cost">
          {l.cost ? (
            <>
              <b className="num">{l.cost}</b>
              <span className="ac-sub">{W.coins}</span>
            </>
          ) : (
            <span className="ac-sub">{W.priceInGame}</span>
          )}
          {l.status ? <span className="ac-sub ac-status">{l.status}</span> : null}
        </span>
        <button
          type="button"
          className="a-btn a-btn--quiet ac-skip"
          aria-label={W.skipLabel(l.text)}
          onClick={() => actions.skip(l.key)}
        >
          <span>{W.skip}</span>
        </button>
      </div>
      {l.steps.length > 1 ? (
        <ol className="ac-steps">
          {l.steps.map((x, i) => (
            <li key={x} className="ac-step">
              <span className="ac-step__k num">{i + 1}</span>
              <span>{x}</span>
            </li>
          ))}
        </ol>
      ) : l.steps.length === 1 ? (
        <p className="ac-steps ac-sub">{l.steps[0]}</p>
      ) : null}
    </li>
  );
}

function RestLine({ l }: { l: SpendPageLine }) {
  const actions = useNowActions();
  return (
    <li className="ac-rl">
      <span className="ac-rl__n num">{l.n}</span>
      <span className={cx('ac-pip', l.priced ? 'is-gold' : 'is-later')} aria-hidden="true" />
      <span className="ac-rl__t">
        <span className="ac-rl__what">
          {l.art ? <GameIcon art={l.art} size={24} decorative /> : null}
          <span>{l.text}</span>
        </span>
        <span className="ac-sub">{[l.who, l.where].filter(Boolean).join(' · ')}</span>
      </span>
      <span className={cx('ac-rl__cost num', !l.priced && 'is-later')}>
        {l.cost ?? W.priceInGame}
        {l.status ? <span className="ac-sub ac-status">{l.status}</span> : null}
      </span>
      <button
        type="button"
        className="a-btn a-btn--quiet ac-skip ac-skip--small"
        aria-label={W.skipLabel(l.text)}
        onClick={() => actions.skip(l.key)}
      >
        <span>{W.skip}</span>
      </button>
    </li>
  );
}

export function SpendPlanPage({ s }: { s: Session }) {
  const actions = useNowActions();
  const page = useMemo(() => spendPage(s.result, s.view.account.spendPlan), [s.result, s.view]);
  const source = s.view.account.spendPlan?.lines.find((l) => l.source)?.source ?? null;
  const [all, setAll] = useState(false);
  const rest = page ? (all ? page.rest : page.rest.slice(0, REST_SHOWN)) : [];
  return (
    <article className="ac-page" aria-labelledby="ac-spend-h">
      <Crumb s={s} here={W.crumb} back={W.back} />
      {!page ? (
        <section className="a-frame a-frame--gold ac-hero">
          <h2 id="ac-spend-h" className="ac-h1" data-place-heading tabIndex={-1}>
            {W.crumb}
          </h2>
          <p className="ac-sub">{W.noPlan}</p>
        </section>
      ) : (
        <>
          <section className="a-frame a-frame--gold ac-hero" aria-labelledby="ac-spend-h">
            <div className="ac-hero__row">
              <GameIcon art={dataArt('Coins3')} fallback="item-coin" size={64} decorative />
              <h2 id="ac-spend-h" className="ac-hero__h" data-place-heading tabIndex={-1}>
                <span className="ac-big num">{page.buys}</span>
                <span className="ac-h1">
                  {page.buys === 0 ? W.heroNone : page.buys === 1 ? W.heroOne : W.heroMany}
                </span>
              </h2>
            </div>
            <p className="ac-sub ac-hero__sub">{page.heroSub}</p>
            {page.best ? (
              <div className="ac-best">
                {page.best.family ? (
                  <WhoGlyph family={page.best.family} classLabel={page.best.who} scale={2} decorative />
                ) : null}
                <span className="ac-best__t">
                  <b>{page.best.text}</b>
                  {page.best.sub ? <span className="ac-sub">{page.best.sub}</span> : null}
                </span>
                <span className="ac-cap ac-gold">{W.bestBuy}</span>
              </div>
            ) : null}
          </section>

          <div className="ac-cols">
            <section className="ac-main" aria-labelledby="ac-order-h">
              <div className="ac-head">
                <h3 id="ac-order-h" className="ac-h2">
                  {W.order}
                </h3>
                <span className="ac-sub">{page.lineCount}</span>
              </div>
              {page.empty ? <p className="ac-sub">{page.empty}</p> : null}
              {page.top.length ? (
                <ol className="ac-top">
                  {page.top.map((l, i) => (
                    <TopLine key={l.key} l={l} first={i === 0} />
                  ))}
                </ol>
              ) : null}
              {page.rest.length ? (
                <section className="ac-then" aria-labelledby="ac-then-h">
                  <h4 id="ac-then-h" className="ac-cap">
                    {W.thenTitle}
                  </h4>
                  <ol className="ac-rest">
                    {rest.map((l) => (
                      <RestLine key={l.key} l={l} />
                    ))}
                  </ol>
                  {page.rest.length > REST_SHOWN ? (
                    <button
                      type="button"
                      className="n-link-btn ac-more"
                      aria-expanded={all}
                      onClick={() => setAll((v) => !v)}
                    >
                      {all ? W.showLess : W.showMore(page.rest.length - REST_SHOWN)}
                    </button>
                  ) : null}
                </section>
              ) : null}
              {page.skippedKeys.length ? (
                <p className="ac-skipped">
                  <span>{W.skipped(page.skippedKeys.length)}</span>
                  <button
                    type="button"
                    className="n-link-btn"
                    onClick={() => actions.unskip(page.skippedKeys)}
                  >
                    {W.undo}
                  </button>
                </p>
              ) : null}
            </section>

            <aside className="ac-side">
              {page.pockets.length ? (
                <section className="ac-part" aria-labelledby="ac-pockets-h">
                  <div className="ac-head">
                    <h3 id="ac-pockets-h" className="ac-h2">
                      {W.pockets}
                    </h3>
                    <span className="ac-sub">{W.coinsHeld}</span>
                  </div>
                  <ul className="ac-pockets" aria-label={W.pocketsLabel}>
                    {page.pockets.map((p) => (
                      <li key={p.index} className="ac-pocket">
                        <span className="ac-pocket__row">
                          <b>{p.who}</b>
                          <span className={cx('num', p.spends ? 'ac-gold' : 'ac-mut')}>{p.note}</span>
                        </span>
                        <span className="ac-bar" aria-hidden="true">
                          <i className="ac-bar__held" style={{ width: `${p.heldPct}%` }} />
                          <i className="ac-bar__plan" style={{ width: `${p.plannedPct}%` }} />
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="ac-key ac-sub">
                    <span>
                      <i className="ac-pip is-gold" aria-hidden="true" />
                      {W.spentByPlan}
                    </span>
                    <span>
                      <i className="ac-pip is-left" aria-hidden="true" />
                      {W.leftOver}
                    </span>
                  </p>
                </section>
              ) : null}
              {page.bank ? (
                <section className="ac-tile">
                  <h3 className="ac-cap">{W.storage(page.bank)}</h3>
                  <p className="ac-sub">{W.storageLine}</p>
                </section>
              ) : null}
              {page.unpriced.length ? (
                <section className="ac-tile">
                  <h3 className="ac-cap">
                    <i className="ac-pip is-later" aria-hidden="true" />
                    {W.unpricedTitle(page.unpriced.length)}
                  </h3>
                  <ul className="ac-plain">
                    {page.unpriced.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <p className="ac-sub">{W.unpricedLine}</p>
                </section>
              ) : null}
              {page.notCovered.length || page.unavailable.length ? (
                <section className="ac-part">
                  <h3 className="ac-cap">{W.notInPlan}</h3>
                  {page.notCovered.length ? <p className="ac-sub">{page.notCovered.join(', ')}</p> : null}
                  {page.unavailable.map((u) => (
                    <p key={u} className="ac-sub">
                      {u}
                    </p>
                  ))}
                </section>
              ) : null}
            </aside>
          </div>
          {source ? (
            <p className="ac-source">
              <SourceLabel source={source} more={false} />
            </p>
          ) : null}
        </>
      )}
    </article>
  );
}
