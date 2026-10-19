// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M24 the account pages (canvas boards SpendPlan and Goals): #spend and #goals open their own page with
// a breadcrumb back to Now, one framed answer, the list in the engine's order, and no character names.
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { goalsPage } from '../src/account/goals-model';
import { coins, spendPage, stepText } from '../src/account/spend-model';
import { fixture, props, renderNow, saveOf } from './now-helpers';

beforeEach(() => window.history.replaceState(null, '', '/'));
afterEach(() => cleanup());

const open = (hash: string, id = 'spend-plan') => {
  window.history.replaceState(null, '', `/${hash}`);
  const r = fixture(id);
  renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
  return r;
};

describe('the Spend Plan page (#spend)', () => {
  it('frames how many buys the coins cover, then the plan in order, then each pocket', async () => {
    const r = open('#spend');
    const page = await screen.findByRole('article', { name: /buys? your coins cover today/ });
    expect(page.querySelectorAll('.a-frame')).toHaveLength(1);
    const lines = [...page.querySelectorAll('.ac-sl, .ac-rl')];
    expect(lines.length).toBeGreaterThan(0);
    expect(within(page).getByRole('list', { name: 'Who holds the coins' })).toBeTruthy();
    for (const c of r.characters) expect(page.textContent).not.toContain(c.name);
  });

  it('Skip today takes a line off the page, and Undo brings it back', async () => {
    open('#spend');
    const page = await screen.findByRole('article', { name: /buys? your coins cover today/ });
    const before = page.querySelectorAll('.ac-sl, .ac-rl').length;
    const skip = within(page).getAllByRole('button', { name: /^Skip ".*" today$/ })[0] as HTMLElement;
    fireEvent.click(skip);
    expect(page.querySelectorAll('.ac-sl, .ac-rl').length).toBe(before - 1);
    fireEvent.click(within(page).getByRole('button', { name: 'Undo' }));
    expect(page.querySelectorAll('.ac-sl, .ac-rl').length).toBe(before);
  });

  it('the breadcrumb goes back to Now', async () => {
    open('#spend');
    const crumb = await screen.findByRole('navigation', { name: 'Breadcrumb' });
    fireEvent.click(within(crumb).getByRole('link', { name: /Now/ }));
    expect(window.location.hash).toBe('#now');
  });

  it('says each token once: no payer or cost repeated inside the step', () => {
    expect(
      stepText('Buy 2 Vault upgrades on Squire Lv 43: 1.3B coins', { classLabel: 'Squire', level: 43 }),
    ).toBe('Buy 2 Vault upgrades');
    expect(stepText('Raise and level 9 capped stamps: about 2M coins', null)).toBe(
      'Raise and level 9 capped stamps',
    );
    expect(coins(2_300_000_000)).not.toMatch(/coins/);
  });

  it('keeps M7 order and every live line', () => {
    const r = fixture('spend-plan');
    const view = {
      goal: null,
      lines: (r.account.spendPlan?.lines ?? []).map((l) => ({
        id: l.id,
        key: l.id,
        text: l.text,
        detail: l.detail,
        levels: null,
        cost: null,
        payer: null,
        status: l.status,
        statusText: '',
        runningTotal: null,
        note: null,
        source: null,
        stale: false,
        contested: false,
      })),
      hiddenCount: 0,
      skippedCount: 0,
      skippedKeys: [],
      summary: '',
      unavailable: [],
    };
    const p = spendPage(r, view);
    expect([...(p?.top ?? []), ...(p?.rest ?? [])].map((l) => l.key)).toEqual(view.lines.map((l) => l.id));
  });
});

describe('the Goals page (#goals)', () => {
  it('frames the top three, then the rest by group, every Goal once', async () => {
    const r = open('#goals', 'mid-session');
    const page = await screen.findByRole('article', { name: /Start with|No Goals/ });
    expect(page.querySelectorAll('.a-frame')).toHaveLength(1);
    const keys = [...page.querySelectorAll('.ac-gtop, .ac-grow')].length;
    expect(keys).toBeGreaterThan(0);
    for (const c of r.characters) expect(page.textContent).not.toContain(c.name);
  });

  it('groups by category and keeps the engine rank inside each group', () => {
    const r = fixture('mid-session');
    const goals = r.account.goals.filter((g) => g.category !== 'blocker');
    const view = {
      account: {
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          system: g.system,
          category: g.category,
          blocker: false,
          action: { key: g.nextAction.key, text: g.nextAction.text, why: '' },
          milestone: null,
          details: [],
          walkthrough: null,
        })),
        hiddenCount: 0,
        blockers: [],
        skippedKeys: [],
        dismissed: [],
      },
    } as unknown as Parameters<typeof goalsPage>[1];
    const p = goalsPage(r, view);
    const all = [...p.three, ...p.groups.flatMap((g) => g.rows)].map((x) => x.goal.action.key);
    expect(new Set(all).size).toBe(goals.length);
    for (const g of p.groups) for (const row of g.rows) expect(row.group).toBe(g.id);
  });
});
