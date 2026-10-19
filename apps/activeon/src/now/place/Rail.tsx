// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 (area I-now): the Account rail beside the Now place (the boards' aside; the "Account" section on
// a phone). Counts (fixes, Goals as a link), the account fixes and the account safety doubt as rows
// (M24 QA P1-1: they used to open the old Account column), the Daily ring with its reset, then by pause point:
// Log off lists the daily rows lost at the reset (the ones that expire soonest); Log in and Rounds list
// "Up next" (the top two account Goals, coral when losing now) and the coins card.
import type { NowView } from '@idleon-forge/engine/now';
import { PixelArt } from '../../design/art/PixelArt';
import { Pip } from '../../design/atoms/Surfaces';
import { useNowActions } from '../context';
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
  /** An account fix's row: to the Goals page, where the fix sits under "Fix these first". */
  onFix(key: string): void;
  onDaily(): void;
  onSpend(): void;
  /** M26 F-C: the Production Plan's one account line ("6 of 7 anvils should switch"), and #production. */
  production?: string | null;
  onProduction?(): void;
}

/** The account fixes and the account safety doubt, one row each (never names: an account row has none). */
function AccountRows({ view, onFix }: { view: NowView; onFix(key: string): void }) {
  const actions = useNowActions();
  const { blockers, safetyUnknown } = view.account;
  if (blockers.length === 0 && safetyUnknown === null) return null;
  return (
    <ul className="np-rail__list np-rail__fixes" aria-label={W.accountFixes}>
      {blockers.map((g) => (
        <li key={g.action.key}>
          <Go href="#goals" onGo={() => onFix(g.action.key)} className="np-rail__row">
            <Pip tone="coral" />
            <span className="np-rail__rt">
              <b className="np-sm">{g.action.text}</b>
              <span className="np-t-coral np-xs">{W.fixBeforeLeave}</span>
            </span>
            <PixelArt name="ui-arrow-right" decorative />
          </Go>
        </li>
      ))}
      {safetyUnknown ? (
        <li className="np-rail__row np-rail__unknown">
          <Pip tone="sky" />
          <span className="np-rail__rt">
            <b className="np-sm">{W.accountSafety}</b>
            <span className="np-muted np-xs">{W.cantTellSave}</span>
          </span>
          <button
            type="button"
            className="np-rail__skip np-sm"
            onClick={() =>
              safetyUnknown.skipped
                ? actions.unskip([safetyUnknown.skipKey])
                : actions.skip(safetyUnknown.skipKey)
            }
          >
            {safetyUnknown.skipped ? W.skippedUndo : W.skipToday}
          </button>
        </li>
      ) : null}
    </ul>
  );
}

export function Rail({
  view,
  tab,
  payers,
  losses,
  fixes,
  goals,
  onGoals,
  onFix,
  onDaily,
  onSpend,
  production,
  onProduction,
}: RailProps) {
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
        <Go href="#goals" onGo={onGoals} className="np-rail__goals">
          <b>{goals}</b> <span className="np-t-gold">{W.goals(goals)} →</span>
        </Go>
      </p>
      <AccountRows view={view} onFix={onFix} />
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
                  <Go href="#goals" onGo={onGoals} className="np-rail__row">
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
      {production && onProduction && tab !== 'logoff' ? (
        <div className="np-rail__part">
          <span className="a-cap">Production Plan</span>
          <Go href="#production" onGo={onProduction} className="np-rail__row">
            <Pip tone="gold" />
            <span className="np-rail__rt">
              <b className="np-sm">{production}</b>
            </span>
            <PixelArt name="ui-arrow-right" decorative />
          </Go>
        </div>
      ) : null}
    </div>
  );
}
