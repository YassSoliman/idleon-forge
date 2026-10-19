// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account section (M10 FR-22 to FR-26; M21 FR-N10, `cards.account-section` Summary header): one
// header, "Account · 0 fixes · 19 Goals", that folds the section; a blocker (or an Unknown account
// safety) opens it, and so does a link that lands inside it (a Timeline fix, the Spend Plan, a checklist
// row). The body is a lazy part (TR-12 offset 1, `now/account-parts`): only this header is in the first
// load. The body stays in the page while folded, so a link that lands in it always finds its target.
// R12 QA: in the desktop side column (Now from 1000 px) a glance sits under the header (the canvas): the
// counts, the Daily bar, Next up (the top two Goals) and the Before-you-leave list. It is drawn from the
// same NowView the page already has, and hidden by CSS everywhere else.
import { type NowView, ACCOUNT_WORDS as W } from '@idleon-forge/engine/now';
import { forwardRef, Suspense } from 'react';
import { PixelArt } from '../design/art/PixelArt';
import { cx } from '../design/atoms/Button';
import { Loading, lazyPart } from '../lazy-part';
import { useNowActions } from './context';

export const AccountBody = lazyPart(
  () => import('./account-parts/AccountBody'),
  (m) => m.AccountBody,
);

/**
 * The characters to fix before you leave, in Visit Order. The account's own blockers are not repeated
 * here: they open the Account body under this glance by themselves.
 */
function leaveItems(view: NowView): { key: string; href: string; who: string; text: string }[] {
  return view.roster
    .filter((r) => r.pill.kind === 'fix')
    .map((r) => ({
      key: `c${r.index}`,
      href: `#now-${r.index}`,
      who: `${r.classLabel} ${r.level.toLocaleString('en-US')}`,
      text: r.summary,
    }));
}

const LEAVE_CAP = 4;

/** R12 QA: the side column's glance (Main canvas, the aside). */
function Glance({ view, fixes, goals }: { view: NowView; fixes: number; goals: number }) {
  const today = view.checklist?.rings.today ?? null;
  const next = view.account.goals.filter((g) => !g.blocker).slice(0, 2);
  const leave = leaveItems(view);
  return (
    <div className="n-glance">
      <p className="n-glance__counts num">
        <span>
          <b>{fixes}</b> {W.fixWord(fixes)}
        </span>
        <span>
          <b>{goals}</b> {W.goalWord(goals)}
        </span>
      </p>
      {leave.length ? (
        <div className="n-glance__part">
          <p className="n-glance__h">{W.leaveTitle}</p>
          <ul className="n-glance__list">
            {leave.slice(0, LEAVE_CAP).map((i) => (
              <li key={i.key}>
                <a href={i.href} className="n-glance__item">
                  <b>{i.who}</b>
                  <span>{i.text}</span>
                </a>
              </li>
            ))}
          </ul>
          {leave.length > LEAVE_CAP ? (
            <p className="n-glance__more">{W.leaveMore(leave.length - LEAVE_CAP)}</p>
          ) : null}
        </div>
      ) : null}
      {today && today.total > 0 ? (
        <a href="#daily" className="n-glance__part n-glance__daily">
          <span className="n-glance__h">{W.daily}</span>
          <span className="n-glance__bar" aria-hidden="true">
            <i style={{ width: `${Math.round((100 * today.done) / today.total)}%` }} />
          </span>
          <span className="n-glance__sub num">
            {W.dailyLine(today.done, today.total, view.checklist?.dailyText ?? '')}
          </span>
        </a>
      ) : null}
      {next.length ? (
        <div className="n-glance__part">
          <p className="n-glance__h">{W.nextUp}</p>
          <ul className="n-glance__list">
            {next.map((g) => (
              <li key={g.id} className="n-glance__item">
                <span>{g.action.text}</span>
                {g.milestone ? <span className="n-glance__sub">{g.milestone}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/** Whether a link has to land inside the Account (it unfolds the section). */
function landsInside(view: NowView, highlight: string | null | undefined, expanded: ReadonlySet<string>) {
  if (expanded.has('account') || expanded.has('spend-open') || expanded.has('spend')) return true;
  if (!highlight) return false;
  if (highlight.endsWith('@account')) return true;
  return view.activePlay.some((a) => a.key === highlight) || view.account.skippedKeys.includes(highlight);
}

export const AccountSection = forwardRef<HTMLElement, { view: NowView }>(function AccountSection(
  { view },
  ref,
) {
  const actions = useNowActions();
  const acc = view.account;
  const fixes = acc.blockers.length;
  const goals = acc.goals.length + acc.hiddenCount;
  const opensItself = fixes > 0 || (acc.safetyUnknown !== null && !acc.safetyUnknown.skipped);
  const flipped = actions.expanded.has('account-fold');
  const open = landsInside(view, actions.highlight, actions.expanded) || (opensItself ? !flipped : flipped);
  return (
    <section
      ref={ref}
      className={cx('account n-account', fixes > 0 && 'is-fix')}
      aria-labelledby="account-h"
      tabIndex={-1}
    >
      <h2 className="n-account__h">
        <button
          type="button"
          className="n-account__toggle"
          aria-expanded={open}
          aria-controls="account-body"
          onClick={() => actions.toggle('account-fold')}
        >
          <span className="n-account__title" id="account-h">
            {W.title}
          </span>
          <span className="n-account__sum num">
            <span className={cx('n-dot', fixes > 0 ? 'is-bad' : 'is-ok')} aria-hidden="true" />
            {W.summary(fixes, goals)}
          </span>
          <PixelArt name={open ? 'ui-arrow-left' : 'ui-arrow-right'} decorative className="n-account__chev" />
        </button>
      </h2>
      <Glance view={view} fixes={fixes} goals={goals} />
      <div id="account-body" className={cx('n-account__body', !open && 'is-folded')}>
        <Suspense fallback={<Loading />}>
          <AccountBody view={view} />
        </Suspense>
      </div>
    </section>
  );
});
