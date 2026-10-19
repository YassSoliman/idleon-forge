// @vitest-environment jsdom
// SPDX-License-Identifier: GPL-3.0-only
// Copyright (C) 2026 IdleOn Forge contributors.
// M20 in the DOM, area T (M21 §9, FR-T2): Now's Account keeps the one ring line, which links to the
// Timeline's `#daily` section; there, the two-ring reset clock, the three bands as pip rows, a band's
// rows in a sheet (3, then "Show all"), a glyph and a word per state, the Done tick, the Five-minute
// plan, the bank pips, and the row links that land on their Goal (R7 QA).

import type { Checklist, EngineResult } from '@idleon-forge/engine/result';
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import axe from 'axe-core';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { bankPips, planFor, ringFractions } from '../src/timeline/daily-model';
import { DAILY_WORDS } from '../src/timeline/words';
import { withM20 } from './helpers/m20-result';
import { fixture, props, renderNow, saveOf } from './now-helpers';

const ARRIVE = { timeout: process.env.CI ? 15_000 : 5_000 };
vi.setConfig({ testTimeout: ARRIVE.timeout + 5_000 });
beforeAll(async () => {
  await import('../src/timeline/TimelinePlace');
}, 30_000);

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(() => cleanup());

const daily = async (r: EngineResult) => {
  window.history.replaceState(null, '', '/#daily');
  const out = renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
  await screen.findByRole('heading', { level: 3, name: DAILY_WORDS.title }, ARRIVE);
  return { ...out, section: document.getElementById('daily') as HTMLElement };
};
const openBand = (section: HTMLElement, title: string) =>
  fireEvent.click(within(section).getByRole('button', { name: new RegExp(`^Open ${title}`) }));
const sheet = () => screen.getByRole('dialog');

describe("Now's Account: the one ring line (FR-T2)", () => {
  it('shows both rings as text and the daily reset, as one link to the Timeline’s #daily', async () => {
    const r = withM20(fixture('mid-session'));
    renderNow(props(r, saveOf(r, 1, 'first', null, 'paste')));
    const line = document.getElementById('checklist') as HTMLElement;
    expect(line.textContent).toContain('Today 1 of 3 · Week 0 of 1');
    expect(line.textContent).toContain('daily reset in 12h');
    const link = within(line).getByRole('link');
    expect(link.getAttribute('href')).toBe('#daily');
    fireEvent.click(link);
    await screen.findByRole('heading', { level: 3, name: DAILY_WORDS.title }, ARRIVE);
    expect(window.location.hash).toBe('#daily');
  });
});

describe('the Daily & Weekly section on the Timeline (FR-T2)', () => {
  it('QA P1-2: after a long break, at most 3 lost-day boxes and the rest in words, inside the column', async () => {
    const r = withM20(fixture('mid-session'));
    const cl = r.checklist as Checklist;
    const base = cl.rows[0];
    if (!base) throw new Error('withM20 has rows');
    r.checklist = {
      ...cl,
      rows: [
        ...cl.rows,
        {
          ...base,
          id: 'colosseum',
          band: 'banks',
          label: 'Colosseum tickets',
          details: ['Lonely Hunter: 3 days banked, 860 lost'],
        },
      ],
    };
    const { section } = await daily(r);
    const bank = section.querySelector('.dw-band-bank .dw-bank') as HTMLElement;
    expect(bank.querySelectorAll('.dw-pip.s-banked')).toHaveLength(3);
    expect(bank.querySelectorAll('.dw-pip.s-lostday')).toHaveLength(3);
    expect(bank.querySelector('.dw-bank-more')?.textContent).toBe('857 more days lost');
  });

  it('draws the clock with its words, the bands as pip rows, and passes axe', async () => {
    const r = withM20(fixture('mid-session'));
    const { container, section } = await daily(r);
    expect(section.textContent).toContain(DAILY_WORDS.ringKey);
    expect(section.textContent).toContain('12h 00m');
    expect(section.querySelector('.dw-count')?.textContent).toBe('2things to do before the daily reset');
    expect(section.textContent).toContain('today: 1 of 3 done');
    expect(section.textContent).toContain('this week: 0 of 1 · resets in 36h 00m');
    // M24: the one frame on this tab.
    expect(document.querySelectorAll('.timeline-place .a-frame')).toHaveLength(1);
    const bands = within(section).getAllByRole('button', { name: /^Open / });
    expect(bands.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Open No bank: lost at the reset: 2 of 3 to do',
      'Open Weekly: 1 of 1 to do',
    ]);
    // One pip per row, each with its state class.
    expect(section.querySelectorAll('.dw-band-nobank .dw-pip')).toHaveLength(3);
    await axe
      .run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
      .then((res) => expect(res.violations.map((v) => v.id)).toEqual([]));
  });

  it("a band's sheet lists its rows with a word per state, the lost line and Opens later", async () => {
    const r = withM20(fixture('mid-session'));
    const { section } = await daily(r);
    openBand(section, 'No bank');
    const s = sheet();
    expect(s.textContent).toContain('To do');
    expect(s.textContent).toContain('Done');
    expect(s.textContent).toContain("Opens later: Post Office orders: finish Postboy Pablob's quest");
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    // The weekly row is lost before you are back: its pip and its line say so.
    expect(section.querySelectorAll('.dw-band-weekly .dw-wk.is-lost')).toHaveLength(1);
    openBand(section, 'Weekly');
    expect(sheet().textContent).toContain('lost before you are back');
  });

  it('shows 3 rows, then "Show all n"', async () => {
    const base = withM20(fixture('mid-session'));
    const c = base.checklist as Checklist;
    const extra = ['a', 'b'].map((id) => ({
      ...(c.rows[0] as Checklist['rows'][number]),
      id: `extra-${id}`,
    }));
    const r = { ...base, checklist: { ...c, rows: [...c.rows, ...extra] } };
    const { section } = await daily(r);
    openBand(section, 'No bank');
    expect(sheet().querySelectorAll('.cl-row')).toHaveLength(3);
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Show all 5' }));
    expect(sheet().querySelectorAll('.cl-row')).toHaveLength(5);
  });

  it('the Done tick on a row the save can’t judge counts in the today ring', async () => {
    const r = withM20(fixture('mid-session'));
    const { section } = await daily(r);
    openBand(section, 'No bank');
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Done' }));
    expect(section.textContent).toContain('today: 2 of 3 done');
    expect(within(sheet()).getByRole('button', { name: 'Done ✓ · undo' })).toBeTruthy();
  });

  it('M24: the time planner shows 15 minutes first, the losing job first, and switches on a pick', async () => {
    const r = withM20(fixture('mid-session'));
    const { section } = await daily(r);
    const plan = section.querySelector('.dw-plan') as HTMLElement;
    expect((within(plan).getByRole('radio', { name: '15 min' }) as HTMLInputElement).checked).toBe(true);
    expect(plan.textContent).toMatch(/\d+ jobs? fits? in 15 minutes/);
    const jobs = [...plan.querySelectorAll('.dw-jobr')];
    expect(jobs.length).toBeGreaterThan(0);
    // The weekly row lost before you're back comes first.
    expect(jobs[0]?.querySelector('.dw-n')?.classList.contains('is-lost')).toBe(true);
    fireEvent.click(within(plan).getByRole('radio', { name: '5 min' }));
    expect(plan.textContent).toMatch(/in 5 minutes|Nothing to do fits in 5 min/);
  });
});

/** The Spiketrap row linked to `link`; with `extra` account Goals so the 6th+ sit behind "show more". */
function linked(link: NonNullable<Checklist['rows'][number]['link']>, extra = 0): EngineResult {
  const r = withM20(fixture('mid-session'));
  const base = r.account.goals[0];
  if (!base || !r.checklist) throw new Error('mid-session has an account Goal and a checklist');
  const goals = Array.from({ length: extra }, (_, i) => ({
    ...base,
    id: `arcade.check.g${i}`,
    system: 'arcade',
    nextAction: {
      ...base.nextAction,
      key: `arcade.check.g${i}@account`,
      entryId: `arcade.check.g${i}`,
      text: `Arcade line ${i}`,
    },
  }));
  return {
    ...r,
    account: { ...r.account, goals: [...r.account.goals, ...goals] },
    checklist: {
      ...r.checklist,
      rows: r.checklist.rows.map((x) => (x.id === 'spiketrap' ? { ...x, link, nextAction: null } : x)),
    },
  };
}

const lit = (key: string) =>
  document.querySelector(`[data-na-key="${CSS.escape(key)}"]`)?.classList.contains('lit') ?? false;

describe('the checklist links land on their Goal (R7 QA)', () => {
  it('"in your list" opens the account list\'s "show more" when the Goal is behind it, and outlines it', async () => {
    const r = linked({ kind: 'goal', key: 'arcade.check.g5@account' }, 6);
    const { section } = await daily(r);
    openBand(section, 'No bank');
    fireEvent.click(within(sheet()).getByRole('link', { name: 'in your list ↓' }));
    expect(window.location.hash).toBe('#now');
    expect(lit('arcade.check.g5@account')).toBe(true);
  });

  it('a character Goal (@cN) opens that character\'s Now tab, past its "show more", outlined', async () => {
    const key = 'minigames.check.daily-plays@c2';
    const r = linked({ kind: 'goal', key });
    const { section } = await daily(r);
    openBand(section, 'No bank');
    fireEvent.click(within(sheet()).getByRole('link', { name: 'in your list ↓' }));
    expect(window.location.hash).toBe('#now-2');
    expect(lit(key)).toBe(true);
  });

  it('"If you have time" lands on the keyed item and outlines it', async () => {
    const key = 'minigames.check.daily-plays@account';
    const r = linked({ kind: 'active-play', key });
    const { section } = await daily(r);
    openBand(section, 'No bank');
    fireEvent.click(within(sheet()).getByRole('link', { name: 'If you have time ↓' }));
    const item = document.querySelector(`[data-na-key="${key}"]`);
    expect(item?.tagName).toBe('LI');
    expect(item?.textContent).toContain('Play the Hoops minigame');
    expect(lit(key)).toBe(true);
  });
});

describe('the Daily & Weekly arithmetic (daily-model)', () => {
  it('reads the banking details as day pips and keeps other details as text', () => {
    expect(bankPips(['Typhoon: 1 day banked', 'Lonely Hunter: 3 days banked, 2 lost', '5 Water'])).toEqual({
      pips: [
        { name: 'Typhoon', kept: 1, lost: 0 },
        { name: 'Lonely Hunter', kept: 3, lost: 2 },
      ],
      rest: ['5 Water'],
    });
  });

  it('places the rings by the time left to each reset, and says nothing when it is unknown', () => {
    const now = 1_000_000_000_000;
    const clocks = { daily: now + 6 * 3_600_000, accountWeek: null, serverWeek: now, ballotWeek: now };
    expect(ringFractions(clocks, now)).toEqual({ day: 0.25, week: null });
    expect(ringFractions(undefined, now)).toEqual({ day: null, week: null });
  });

  it('plans the losing rows first, then no-bank rows, adding efforts until the next would not fit', () => {
    const row = (id: string, band: 'no-bank' | 'banks' | 'weekly') => ({ id, band, state: 'todo' }) as never;
    const view = {
      bands: [
        { band: 'weekly', rows: [row('w', 'weekly')], done: [], later: [], title: '' },
        { band: 'no-bank', rows: [row('a', 'no-bank'), row('b', 'no-bank')], done: [], later: [], title: '' },
      ],
    } as never;
    const effort: Record<string, number> = { a: 120, b: 240, w: 60 };
    const plan = planFor(view, (id) => effort[id] ?? null, 5);
    expect(plan.rows.map((r) => r.id)).toEqual(['a', 'w']);
    expect(plan.usedSeconds).toBe(180);
    // M24: a row already being lost goes before every band.
    const lost = { id: 'w', band: 'weekly', state: 'todo', lostBeforeReturn: true } as never;
    const view2 = {
      bands: [
        { band: 'no-bank', rows: [row('a', 'no-bank')], done: [], later: [], title: '' },
        { band: 'weekly', rows: [lost], done: [], later: [], title: '' },
      ],
    } as never;
    expect(planFor(view2, (id) => effort[id] ?? null, 5).rows.map((r) => r.id)).toEqual(['w', 'a']);
  });
});
