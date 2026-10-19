// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (board after/sys/Stamps.dc.html): the Stamps page on the System template. Tabs: Collect (the next
// stamps in M8's order with how each is got, the stamp book's counts per tab), Level up (the stamps the
// Spend Plan levels) and the Stamp book (M21's picture). Data: area S's stamps picture (M8, M7).
import { formatCoins } from '@idleon-forge/engine/now';
import {
  STAMP_WORDS,
  type StampStatus,
  type StampsPicture,
  type StampTile,
  STAMPS_PAGE_WORDS as W,
} from '@idleon-forge/engine/systems-ui';
import { ChecksTile, SimplePage, SpendSection, StepsSection } from '../frame/SimplePage';
import { type FrameAnswer, frameAnswer, SystemFrame } from '../frame/SystemFrame';
import { StampsBody } from '../NewPictures';
import type { FullPageProps } from '../pages';
import './pages.css';

const RANK: Record<StampStatus, number> = { now: 0, active: 1, toward: 2, later: 3, unknown: 4, owned: 5 };

function StampGlyph({ now }: { now: boolean }) {
  const edge = now ? 'var(--tier-bronze-3)' : 'var(--line-strong)';
  const face = now ? 'var(--tier-bronze-4)' : 'var(--sunk)';
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="2" y="2" width="12" height="12" fill={edge} />
      <rect x="4" y="4" width="8" height="8" fill={face} />
      <rect x="6" y="6" width="4" height="4" fill={edge} />
    </svg>
  );
}

export default function StampsPage({ s, page }: FullPageProps) {
  const pic = page.pictures.find((p) => p.kind === 'stamps') as StampsPicture | undefined;
  if (!pic) return <SimplePage s={s} page={page} />;
  const byId = new Map(pic.elements.map((e) => [e.id, e]));
  const ribbon = pic.next.map((id) => byId.get(id)).filter((t): t is StampTile => !!t);
  const rest = pic.elements
    .filter((e) => e.status !== 'owned' && !pic.next.includes(e.id))
    .sort((a, b) => RANK[a.status] - RANK[b.status]);
  const next = [...ribbon, ...rest].slice(0, 5);
  const nowCount = pic.elements.filter((e) => e.status === 'now').length;
  const laterCount = pic.elements.filter((e) => e.status === 'later' || e.status === 'unknown').length;
  const base = frameAnswer(page);
  const answer: FrameAnswer =
    nowCount > 0 && base.tone !== 'mut' && base.tone === 'gold'
      ? {
          ...base,
          big: {
            value: String(nowCount),
            unit: W.stamps(nowCount),
            note: W.toCollect(pic.owned, pic.owned + nowCount, pic.total),
          },
        }
      : base;
  const levels = pic.elements
    .filter((e) => e.status === 'owned' && (e.raiseInPlan || (e.nextCoins !== null && e.level < e.cap)))
    .sort((a, b) => Number(b.raiseInPlan) - Number(a.raiseInPlan) || (a.nextCoins ?? 0) - (b.nextCoins ?? 0))
    .slice(0, 8);
  return (
    <SystemFrame
      s={s}
      page={page}
      answer={answer}
      tabs={[
        {
          id: 'collect',
          label: W.tabs.collect,
          badge: W.ofTotal(pic.owned, pic.total),
          render: () => (
            <div className="sf-split">
              <div className="sf-col">
                <section className="sf-sec" aria-labelledby="st-next-h">
                  <div className="sf-sec__head">
                    <h3 id="st-next-h" className="a-h2">
                      {W.nextTitle}
                    </h3>
                    <span className="sf-hint">{W.nextHint}</span>
                  </div>
                  <ol className="sf-rows">
                    {next.map((t, i) => {
                      const now = t.status === 'now';
                      return (
                        <li
                          key={t.id}
                          className={`sf-row${now ? ' sf-row--gold' : ''}${t.status === 'later' || t.status === 'unknown' ? ' sf-row--later' : ''}`}
                        >
                          <span className={`sf-n${now ? ' sf-n--gold' : ''}`}>{i + 1}</span>
                          <StampGlyph now={now} />
                          <span className="sf-row__main">
                            <span className="sf-strong">{t.name}</span>
                            <span className="sf-muted">{t.route ? STAMP_WORDS.route[t.route] : ''}</span>
                          </span>
                          <span className="sf-row__end">
                            <span className={`sf-small sf-strong ${now ? 'sf-t--gold' : 'sf-t--mut'}`}>
                              {now ? W.whenNow : STAMP_WORDS.status[t.status]}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
                <StepsSection page={page} quiet />
              </div>
              <aside className="sf-col">
                <section className="sf-sec" aria-labelledby="st-book-h">
                  <span id="st-book-h" className="a-cap">
                    {W.bookTitle}
                  </span>
                  {pic.tabs.map((t) => (
                    <div key={t.tab} className="st-book">
                      <div className="sf-sec__head">
                        <span className="sf-small sf-strong">{STAMP_WORDS.tabs[t.tab]}</span>
                        <span className="sf-small">
                          <b>{t.owned}</b>
                          <span className="sf-muted"> of {t.total}</span>
                        </span>
                      </div>
                      <span className="sf-meter sf-t--mint" aria-hidden="true">
                        <i style={{ width: `${t.total ? (t.owned / t.total) * 100 : 0}%` }} />
                      </span>
                    </div>
                  ))}
                  {laterCount > 0 ? <p className="sf-hint">{W.later(laterCount)}</p> : null}
                </section>
                {page.spendLines.length > 0 ? (
                  <div className="a-tile sf-tile">
                    <SpendSection s={s} page={page} title={W.levelInPlan} />
                  </div>
                ) : null}
                <ChecksTile s={s} page={page} />
              </aside>
            </div>
          ),
        },
        {
          id: 'level',
          label: W.tabs.level,
          badge: levels.length || null,
          render: () => (
            <div className="sf-split">
              <section className="sf-sec" aria-labelledby="st-lv-h">
                <h3 id="st-lv-h" className="a-h2">
                  {W.levelRows}
                </h3>
                {levels.length > 0 ? (
                  <ul className="sf-rows">
                    {levels.map((t) => (
                      <li key={t.id} className="sf-row">
                        <StampGlyph now={t.raiseInPlan} />
                        <span className="sf-row__main">
                          <span className="sf-strong">{t.name}</span>
                          <span className="sf-muted">{W.nextLevel(t.level, t.cap)}</span>
                        </span>
                        <span className="sf-row__end sf-small">
                          {t.raiseInPlan ? (
                            <span className="sf-t--gold">{W.capRaise}</span>
                          ) : t.nextCoins !== null ? (
                            <span className="sf-muted">{W.nextCost(formatCoins(t.nextCoins))}</span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sf-muted">{W.levelEmpty}</p>
                )}
              </section>
              <SpendSection s={s} page={page} />
            </div>
          ),
        },
        {
          id: 'book',
          label: W.tabs.book,
          render: () => <StampsBody s={s} page={page} />,
        },
      ]}
    />
  );
}
