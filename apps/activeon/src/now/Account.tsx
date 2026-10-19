// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// The Account section beside Now (M24, the board `after/Now`): a heading and the Now rail under it
// (counts, the account fixes and the account safety doubt as rows, Goals as a link, the Daily ring,
// what is lost at the reset or up next). Nothing else: the Goals and the Spend Plan have their own
// pages, the Daily & Weekly Checklist lives on the Timeline (M24 QA P1-1 removed the pre-M24 folding
// body, which repeated the hero, the Goals page and the Spend Plan page, and named characters).
// The Account lives only on Now (rule 8), never under a Character page.
import { ACCOUNT_WORDS as W } from '@idleon-forge/engine/now';
import { forwardRef, type ReactNode } from 'react';
import { cx } from '../design/atoms/Button';

export const AccountSection = forwardRef<HTMLElement, { fixes: number; rail: ReactNode }>(
  function AccountSection({ fixes, rail }, ref) {
    return (
      <section
        ref={ref}
        className={cx('account n-account has-rail', fixes > 0 && 'is-fix')}
        aria-labelledby="account-h"
        tabIndex={-1}
      >
        <h2 className="n-account__h">
          <span className="n-account__title" id="account-h">
            {W.title}
          </span>
        </h2>
        {rail}
      </section>
    );
  },
);
