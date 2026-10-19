// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): the Account rail beside the Now place (the boards' aside; the "Account" section on
// a phone). Counts (fixes, Goals as a link), the Daily ring with its reset, then by pause point:
// Log off lists the daily rows lost at the reset (the ones that expire soonest); Log in and Rounds list
// "Up next" (the top two account Goals, coral when losing now) and the coins card.
import type { NowView } from '@idleon-forge/engine/now';
import { PixelArt } from '../../design/art/PixelArt';
import { Pip } from '../../design/atoms/Surfaces';
import { dailyPart, type LossNow, type Payer } from './derive';
import { CoinsRow, Go } from './LogOff';
import { NOW_PLACE_WORDS as W } from './words';

/** The Daily ring: a stroked circle, its done share in mint. */
function Ring({ done, total, size }: { done: number; total: number; size: number }) {
  const c = 2 * Math.PI * 15;
  const share = total > 0 ? done / total : 0;
  return (
    <svg
      className="np-ring"
      role="img"
      aria-label={W.dailyRing(done, total)}
      width={size}
      height={size}
      viewBox="0 0 36 36"
    >
      <circle cx="18" cy="18" r="15" fill="none" className="np-ring__track" strokeWidth="5" />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        className="np-ring__done"
        strokeWidth="5"
        strokeDasharray={`${(c * share).toFixed(1)} ${c.toFixed(1)}`}
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}

export interface RailProps {
  view: NowView;
  tab: 'login' | 'rounds' | 'logoff';
  payers: Payer[];
  losses: LossNow[];
  fixes: number;
  goals: number;
  onGoals(): void;
  onDaily(): void;
  onSpend(): void;
}

export function Rail({ view, tab, payers, losses, fixes, goals, onGoals, onDaily, onSpend }: RailProps) {
  const daily = dailyPart(view.checklist);
  const lossIds = new Set(losses.map((l) => l.entryId));
  const next = view.account.goals.filter((g) => !g.blocker).slice(0, 2);
  const more = daily ? W.moreDaily(daily.moreToday, daily.moreWeek) : '';
  return (
    <div className="np-rail">
      <p className="np-rail__counts num">
        <span>
          <b>{fixes}</b> <span className="np-muted">{W.fixes(fixes)}</span>
        </span>
        <Go href="#account-body" onGo={onGoals} className="np-rail__goals">
          <b>{goals}</b> <span className="np-t-gold">{W.goals(goals)} →</span>
        </Go>
      </p>
      {daily && daily.ring.total > 0 ? (
        <div className="np-rail__daily">
          <Ring done={daily.ring.done} total={daily.ring.total} size={72} />
          <span className="np-rail__dt">
            <span className="a-cap">{W.daily}</span>
            <b>{W.dailyDone(daily.ring.done, daily.ring.total)}</b>
            <span className="np-t-sky np-sm">{daily.text}</span>
          </span>
        </div>
      ) : null}
      {tab === 'logoff' && daily && daily.rows.length > 0 ? (
        <div className="np-rail__part">
          <span className="a-cap">{W.lostAtReset}</span>
          <ul className="np-rail__list">
            {daily.rows.map((r) => (
              <li key={r.id}>
                <Go href="#daily" onGo={onDaily} className="np-rail__row">
                  <Pip tone="gold" />
                  <span className="np-rail__rt">
                    <b className="np-sm">{r.label}</b>
                    {r.details.length ? (
                      <span className="np-muted np-xs">{r.details.join(' · ')}</span>
                    ) : null}
                  </span>
                  <PixelArt name="ui-arrow-right" decorative />
                </Go>
              </li>
            ))}
          </ul>
          <Go href="#daily" onGo={onDaily} className="np-rail__more np-sm">
            {more ? `${more} · ` : ''}
            {W.dailyLink} →
          </Go>
        </div>
      ) : null}
      {tab !== 'logoff' && next.length > 0 ? (
        <div className="np-rail__part">
          <span className="a-cap">{W.upNext}</span>
          <ul className="np-rail__list">
            {next.map((g) => {
              const losing = lossIds.has(g.action.entryId);
              return (
                <li key={g.id}>
                  <Go href="#account-body" onGo={onGoals} className="np-rail__row">
                    <Pip tone={losing ? 'coral' : 'gold'} />
                    <span className="np-rail__rt">
                      <b className="np-sm">{g.action.text}</b>
                      {losing ? <span className="np-t-coral np-xs">{W.losingNow}</span> : null}
                    </span>
                  </Go>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      {tab !== 'logoff' ? <CoinsRow payers={payers} onSpend={onSpend} compact /> : null}
    </div>
  );
}
