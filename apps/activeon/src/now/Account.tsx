// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account section (M10 FR-22 to FR-26; M21 FR-N10, `cards.account-section` Summary header): one
// header, "Account · 0 fixes · 19 Goals", that folds the section; a blocker (or an Unknown account
// safety) opens it, and so does a link that lands inside it (a Timeline fix, the Spend Plan, a checklist
// row). The body is a lazy part (TR-12 offset 1, `now/account-parts`): only this header is in the first
// load. The body stays in the page while folded, so a link that lands in it always finds its target.
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
      <div id="account-body" className={cx('n-account__body', !open && 'is-folded')}>
        <Suspense fallback={<Loading />}>
          <AccountBody view={view} />
        </Suspense>
      </div>
    </section>
  );
});
