// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M26 F-C section 8: the #production page (an account page like #spend, reached from Now and from each
// Character's Production Plan). The answer framed first (what to make next across the account), the
// account producers (the Anvils summary and its levers, the pieces several characters want), then every
// character's rows in Visit Order. It only lays out EngineResult.production.
import { Crumb } from '../account/Crumb';
import { effort } from '../design/format';
import { WhoGlyph } from '../design/who/WhoGlyph';
import type { Session } from '../shell/session';
import { AccountProducers } from './AccountProducers';
import { PlanRows } from './PlanRows';
import './production.css';

export function ProductionPage({ s }: { s: Session }) {
  const p = s.result.production ?? null;
  const back = s.result.expectedReturn.usedSeconds;
  const order = s.result.visitOrder.length ? s.result.visitOrder : s.view.roster.map((r) => r.index);
  const go = (href: string) => {
    if (href === '#production') return;
    window.location.hash = href;
  };
  return (
    <article className="ac-page pp-page" aria-labelledby="pp-page-h">
      <Crumb s={s} here="Production Plan" back="Now" />
      <section className="a-frame ac-hero" aria-labelledby="pp-page-h">
        <span className="ac-hero__words">
          <span className="ac-cap">
            What each producer should make by your return{back > 0 ? ` (${effort(back)})` : ''}
          </span>
          <h2 id="pp-page-h" className="ac-h1" data-place-heading tabIndex={-1}>
            {p?.answer?.hero ?? p?.anvils.line ?? 'Nothing to change'}
          </h2>
          {p?.answer?.sub ? <span className="ac-sub">{p.answer.sub}</span> : null}
        </span>
      </section>
      {p ? (
        <div className="pp-page__grid">
          <div className="pp-page__chars">
            {order.map((i) => {
              const rows = p.rows.filter((r) => r.characterIndex === i);
              const who = s.view.roster.find((r) => r.index === i);
              if (!rows.length || !who) return null;
              const label = `${who.classLabel} Lv ${who.level}`;
              return (
                <section key={i} className="pp-char" aria-label={label} data-focus-key={`c${i}`}>
                  <h3 className="pp-char__h">
                    <WhoGlyph
                      family={s.view.families?.[i] ?? 'beginner'}
                      classLabel={label}
                      scale={2}
                      decorative
                    />
                    <a
                      href={`#now-${i}`}
                      onClick={(e) => {
                        e.preventDefault();
                        s.navigate({ place: 'character', index: i, tab: 'now' }, 'push');
                      }}
                    >
                      {label}
                    </a>
                  </h3>
                  <PlanRows rows={rows} p={p} onLink={go} />
                </section>
              );
            })}
          </div>
          <aside className="pp-page__side">
            <AccountProducers p={p} heading="h2" />
          </aside>
        </div>
      ) : (
        <p className="sf-note">Open a save to see what each producer should make.</p>
      )}
    </article>
  );
}
