// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the account's own pages, a lazy chunk: the Spend Plan (#spend) and the Goals list (#goals), both
// reached from Now (canvas boards SpendPlan and Goals). Each has a breadcrumb back to Now, one framed
// answer at the top, the list, and a side column; they only lay out the Now view and the engine result.
import type { AccountPage as Page } from '../shell/route';
import type { Session } from '../shell/session';
import { GoalsPage } from './GoalsPage';
import { SpendPlanPage } from './SpendPlanPage';
import './account.css';

export function AccountPage({ s, page }: { s: Session; page: Page }) {
  return page === 'goals' ? <GoalsPage s={s} /> : <SpendPlanPage s={s} />;
}
